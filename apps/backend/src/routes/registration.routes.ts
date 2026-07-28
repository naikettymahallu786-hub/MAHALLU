import { Router } from 'express';
import { submitRegistration, getPendingRegistrations, approveRegistration, rejectRegistration, getFamiliesForRegistration } from '../controllers/registration.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { UserRole } from '@mahallu/shared-types';

const router = Router();

// Public route for mobile app
router.post('/submit', submitRegistration);
router.get('/families/:mahalluCode', getFamiliesForRegistration);

// Protected admin routes
router.use(authenticate);
router.use(authorizeRoles(UserRole.SUPER_ADMIN, UserRole.SECRETARY));

router.get('/pending', getPendingRegistrations);
router.post('/:id/approve', approveRegistration);
router.post('/:id/reject', rejectRegistration);

export default router;
