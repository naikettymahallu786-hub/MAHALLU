import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { UserRole } from '@mahallu/shared-types';

const router = Router();

// Public routes
router.post('/login', authRateLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);

// Protected routes
router.use(authenticate);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.me);
router.post('/2fa/setup', AuthController.setup2FA);
router.post('/2fa/verify', AuthController.verify2FA);
router.post('/change-password', AuthController.changePassword);
router.patch('/fcm-token', AuthController.updateFCMToken);
router.post('/:memberId/admin-reset-password', authorizeRoles(UserRole.SUPER_ADMIN, UserRole.SECRETARY), AuthController.adminResetPassword);

export default router;
