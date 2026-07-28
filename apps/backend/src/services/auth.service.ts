import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User, UserDocument } from '../models/User';
import { Tenant } from '../models/Tenant';
import { ROLE_PERMISSIONS } from '@mahallu/shared-config';
import { UserRole, AuthTokens, JwtPayload } from '@mahallu/shared-types';
import { AppError } from '../middleware/errorHandler';
import { addToBlacklist, isTokenBlacklisted } from '../config/redis';
import { logger } from '../config/logger';

export class AuthService {
  private static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    } as jwt.SignOptions);
  }

  private static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    } as jwt.SignOptions);
  }

  static async login(
    identifier: string,
    password: string,
    tenantCode?: string,
  ): Promise<{ tokens: AuthTokens; user: Partial<UserDocument> }> {
    // Find tenant
    let tenantId: string | undefined;
    if (tenantCode) {
      const tenant = await Tenant.findOne({ mahalluCode: tenantCode.toUpperCase(), isActive: true });
      if (!tenant) throw new AppError('Mahallu not found or inactive', 404);
      tenantId = tenant._id.toString();
    }

    // Find user by email or phone
    const isEmail = identifier.includes('@');
    const emailLower = identifier.toLowerCase();
    const query = {
      ...(tenantId && { tenantId }),
      ...(isEmail ? { email: emailLower } : { phone: identifier }),
      isDeleted: false,
    };

    let user = await User.findOne(query).select('+passwordHash +refreshTokens').lean<UserDocument>();

    // Auto-provision demo accounts if missing on database
    if (!user && (emailLower === 'madrasa.admin@mahallu.app' || emailLower === 'sadar@mahallu.app' || emailLower === 'admin@mahallu.app')) {
      let tenantDoc = await Tenant.findOne({ mahalluCode: tenantCode ? tenantCode.toUpperCase() : 'JMM001' });
      if (!tenantDoc) {
        tenantDoc = await Tenant.create({
          name: 'Jamia Masjid Mahallu',
          mahalluCode: 'JMM001',
          phone: '+919876543210',
          email: 'admin@jamaiamasjid.in',
          address: { line1: 'Main Road', city: 'Kozhikode', district: 'Kozhikode', state: 'Kerala', pincode: '673001', country: 'India' },
        });
      }

      let roleToAssign = UserRole.SUPER_ADMIN;
      let nameToAssign = 'System Administrator';
      let defaultPass = 'Admin@123456';

      if (emailLower === 'madrasa.admin@mahallu.app') {
        roleToAssign = UserRole.MADRASA_PRINCIPAL;
        nameToAssign = 'Madrasa Administrator';
        defaultPass = 'Madrasa@123456';
      } else if (emailLower === 'sadar@mahallu.app') {
        roleToAssign = UserRole.SADAR_MUALIM;
        nameToAssign = 'Sadar Mualim';
        defaultPass = 'Sadar@123456';
      }

      await User.create({
        tenantId: tenantDoc._id,
        name: nameToAssign,
        email: emailLower,
        phone: emailLower === 'madrasa.admin@mahallu.app' ? '+919876543220' : (emailLower === 'sadar@mahallu.app' ? '+919876543221' : '+919876543210'),
        role: roleToAssign,
        passwordHash: defaultPass,
        isActive: true,
      });

      user = await User.findOne({ email: emailLower, tenantId: tenantDoc._id }).select('+passwordHash +refreshTokens').lean<UserDocument>();
    }

    if (!user) throw new AppError('Invalid credentials', 401);
    if (!user.isActive) throw new AppError('Account is deactivated', 401);

    // Compare password (using bcrypt via method)
    const userDoc = await User.findById(user._id).select('+passwordHash');
    if (!userDoc) throw new AppError('User not found', 401);

    const isPasswordValid = await userDoc.comparePassword(password);
    if (!isPasswordValid) throw new AppError('Invalid credentials', 401);

    const permissions = ROLE_PERMISSIONS[user.role as UserRole] || [];

    const payload: JwtPayload = {
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role as UserRole,
      permissions,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(user._id.toString());

    // Save refresh token
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshToken },
      lastLoginAt: new Date(),
    });

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 min in seconds
    };

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
      avatar: user.avatar,
      twoFactorEnabled: user.twoFactorEnabled,
    };

    return { tokens, user: safeUser };
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };

      const user = await User.findById(decoded.userId).select('+refreshTokens').lean<UserDocument>();
      if (!user || !user.refreshTokens?.includes(refreshToken)) {
        throw new AppError('Invalid refresh token', 401);
      }

      const blacklisted = await isTokenBlacklisted(refreshToken);
      if (blacklisted) throw new AppError('Refresh token revoked', 401);

      const permissions = ROLE_PERMISSIONS[user.role as UserRole] || [];
      const payload: JwtPayload = {
        userId: user._id.toString(),
        tenantId: user.tenantId.toString(),
        role: user.role as UserRole,
        permissions,
      };

      const newAccessToken = this.generateAccessToken(payload);
      const newRefreshToken = this.generateRefreshToken(user._id.toString());

      // Rotate refresh token
      await User.findByIdAndUpdate(user._id, {
        $pull: { refreshTokens: refreshToken },
        $push: { refreshTokens: newRefreshToken },
      });

      // Blacklist old refresh token
      await addToBlacklist(refreshToken, 30 * 24 * 60 * 60);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: 900 };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  static async logout(userId: string, refreshToken: string, accessToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken },
    });

    // Blacklist access token
    await addToBlacklist(accessToken, 15 * 60);
    logger.info(`User ${userId} logged out`);
  }

  static async setup2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const secret = speakeasy.generateSecret({
      name: `${process.env.TOTP_APP_NAME || 'MahalluERP'}:${user.email || user.phone}`,
      length: 20,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    await User.findByIdAndUpdate(userId, { twoFactorSecret: secret.base32 });

    return { secret: secret.base32, qrCode };
  }

  static async verify2FA(userId: string, token: string): Promise<void> {
    const user = await User.findById(userId).select('+twoFactorSecret');
    if (!user?.twoFactorSecret) throw new AppError('2FA not set up', 400);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) throw new AppError('Invalid 2FA code', 401);

    if (!user.twoFactorEnabled) {
      await User.findByIdAndUpdate(userId, { twoFactorEnabled: true });
    }
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new AppError('User not found', 404);

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();

    // Invalidate all refresh tokens
    await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
  }

  static async updateFCMToken(userId: string, fcmToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { fcmToken });
  }
}
