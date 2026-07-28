import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { RegistrationRequest, RegistrationStatus, RegistrationType } from '../models/RegistrationRequest';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Member } from '../models/Member';
import { Family } from '../models/Family';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { UserRole, Gender, MemberStatus } from '@mahallu/shared-types';
import { logger } from '../config/logger';

// ---------------------------------------------------------
// PUBLIC ENDPOINTS (Called by Mobile App during registration)
// ---------------------------------------------------------

export const submitRegistration = async (req: Request, res: Response) => {
  try {
    const { mahalluCode, type, payload } = req.body;

    if (!mahalluCode || !type || !payload) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const tenant = await Tenant.findOne({ mahalluCode: mahalluCode.toUpperCase() });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Invalid Mahallu Code' });
    }

    const registration = await RegistrationRequest.create({
      tenantId: tenant._id,
      type,
      payload,
    });

    res.status(201).json({
      success: true,
      message: 'Registration request submitted successfully. Please wait for admin approval.',
      data: registration,
    });
  } catch (error) {
    logger.error('Error submitting registration:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting registration' });
  }
};

export const getFamiliesForRegistration = async (req: Request, res: Response) => {
  try {
    const { mahalluCode } = req.params;
    if (!mahalluCode) return res.status(400).json({ success: false, message: 'Mahallu code is required' });

    const tenant = await Tenant.findOne({ mahalluCode: mahalluCode.toUpperCase() });
    if (!tenant) return res.status(404).json({ success: false, message: 'Invalid Mahallu Code' });

    const families = await Family.find({ tenantId: tenant._id, isDeleted: false })
      .populate('headMemberId', 'name')
      .lean();

    const formatted = families.map(f => ({
      _id: f._id,
      familyCode: f.familyCode,
      headName: (f.headMemberId as any)?.name || 'Unknown',
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    logger.error('Error fetching families for registration:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------------------------------------------------
// PROTECTED ENDPOINTS (Called by Admin Dashboard)
// ---------------------------------------------------------

export const getPendingRegistrations = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const registrations = await RegistrationRequest.find({
      tenantId,
      status: RegistrationStatus.PENDING,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Pending registrations fetched successfully',
      data: registrations,
    });
  } catch (error) {
    logger.error('Error fetching registrations:', error);
    res.status(500).json({ success: false, message: 'Server error fetching registrations' });
  }
};

export const rejectRegistration = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const request = await RegistrationRequest.findOne({ _id: id, tenantId });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Registration request not found' });
    }

    request.status = RegistrationStatus.REJECTED;
    await request.save();

    res.status(200).json({ success: true, message: 'Registration request rejected' });
  } catch (error) {
    logger.error('Error rejecting registration:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pass = '';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

const generateId = (prefix: string) => {
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${randomStr}`;
};

export const approveRegistration = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const request = await RegistrationRequest.findOne({ _id: id, tenantId });
    if (!request || request.status !== RegistrationStatus.PENDING) {
      return res.status(404).json({ success: false, message: 'Registration request not found or already processed' });
    }

    const { type, payload } = request;
    const generatedPassword = generatePassword();
    
    // We must generate a unique fallback email in case a family shares a phone number
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    let email = payload.email || `${payload.phone}_${uniqueSuffix}@mahallu.local`;

    // 1. Create Base Member Profile for ALL types
    const member = await Member.create({
      tenantId,
      memberId: generateId('MHL'),
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      gender: payload.gender || Gender.MALE,
      dateOfBirth: payload.dob ? new Date(payload.dob) : undefined,
      status: MemberStatus.ACTIVE,
      occupation: payload.occupation,
      qualification: payload.qualification,
    });

    let role = UserRole.STUDENT;

    // 2. Handle Specific Role Logic
    if (type === RegistrationType.MEMBER) {
      role = UserRole.PARENT;
      
      const familyMembersData = [{ memberId: member._id, relationship: 'Head', isHead: true }];

      if (payload.familyMembers && Array.isArray(payload.familyMembers)) {
        for (const fm of payload.familyMembers) {
          if (fm.name && fm.relationship) {
            const dependent = await Member.create({
              tenantId,
              memberId: generateId('MHL'),
              name: fm.name,
              phone: payload.phone, // Dependents use the head's phone number if not provided
              gender: fm.gender || Gender.MALE,
              status: MemberStatus.ACTIVE,
            });
            familyMembersData.push({ memberId: dependent._id, relationship: fm.relationship, isHead: false });
          }
        }
      }

      const family = await Family.create({
        tenantId,
        familyCode: generateId('FAM'),
        headMemberId: member._id,
        members: familyMembersData,
        address: {
          line1: payload.addressLine1 || 'N/A',
          city: payload.city || 'Unknown',
          district: payload.district || 'Unknown',
          state: payload.state || 'Unknown',
          pincode: payload.pincode || '000000',
          country: 'India',
        },
        outstandingBalance: 0,
      });

      await Member.updateMany(
        { _id: { $in: familyMembersData.map(m => m.memberId) } },
        { $set: { familyId: family._id } }
      );
    } else if (type === RegistrationType.STUDENT) {
      role = UserRole.STUDENT;

      let guardianId = member._id;

      if (payload.familyId) {
        const family = await Family.findById(payload.familyId);
        if (family) {
          guardianId = family.headMemberId;
          member.familyId = family._id;
          
          family.members.push({
            memberId: member._id,
            relationship: 'Child/Dependent',
            isHead: false
          });
          await family.save();
        }
      }

      // Dummy class & madrasa IDs if none passed. Ideally selected during registration.
      await Student.create({
        tenantId,
        memberId: member._id,
        admissionNo: generateId('ADM'),
        admissionDate: new Date(),
        madrasaId: payload.madrasaId || member._id, // placeholder
        classId: payload.classId || member._id,     // placeholder
        guardianId: guardianId,                     // Self or parent
        status: 'active',
        feePaid: 0,
        feeBalance: 0,
      });
    } else if (type === RegistrationType.TEACHER || type === (RegistrationType as any).SADAR_MUALIM) {
      role = type === RegistrationType.TEACHER ? UserRole.USTADH : UserRole.SADAR_MUALIM;

      await Teacher.create({
        tenantId,
        memberId: member._id,
        madrasaId: payload.madrasaId || member._id, // placeholder
        employeeId: generateId('EMP'),
        subjects: payload.subjects || [],
        qualification: payload.qualification || '',
        salary: 0,
        joiningDate: new Date(),
        status: 'active',
        documents: [],
      });
    }

    // 3. Create the User Account
    let userPhone = payload.phone;
    const existingUser = await User.findOne({ tenantId, phone: userPhone });
    if (existingUser) {
      userPhone = `${userPhone}_${uniqueSuffix}`;
    }

    const user = await User.create({
      tenantId,
      name: payload.name,
      email: email.toLowerCase(),
      phone: userPhone,
      role: role,
      passwordHash: generatedPassword,
      memberId: member._id,
      isActive: true,
    });

    member.userId = user._id;
    await member.save();

    // 4. Update request status
    request.status = RegistrationStatus.APPROVED;
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Registration approved successfully',
      data: {
        email: user.email,
        phone: user.phone,
        generatedPassword,
      },
    });
  } catch (error) {
    logger.error('Error approving registration:', error);
    res.status(500).json({ success: false, message: 'Server error while approving registration' });
  }
};
