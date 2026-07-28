import { Router } from 'express';
import multer from 'multer';
import { MemberController } from '../controllers/member.controller';
import { ImportExportController } from '../controllers/importExport.controller';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { auditLog } from '../middleware/requestLogger';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(authenticate);

// Import & Export Routes
router.get('/import-export/template', authorize(PERMISSIONS.MEMBER_VIEW), ImportExportController.downloadTemplate);
router.post('/import-export/import', authorize(PERMISSIONS.MEMBER_CREATE), upload.single('file'), ImportExportController.importData);
router.get('/import-export/export', authorize(PERMISSIONS.MEMBER_EXPORT || PERMISSIONS.MEMBER_VIEW), ImportExportController.exportData);
router.get('/import-export/history', authorize(PERMISSIONS.MEMBER_VIEW), ImportExportController.getHistory);

// Member Routes
router.get('/stats', authorize(PERMISSIONS.MEMBER_VIEW), MemberController.getStats);
router.get('/search', authorize(PERMISSIONS.MEMBER_VIEW), MemberController.search);
router.get('/', authorize(PERMISSIONS.MEMBER_VIEW), MemberController.getAll);
router.get('/:id', authorize(PERMISSIONS.MEMBER_VIEW), MemberController.getById);
router.get('/:id/qr-card', authorize(PERMISSIONS.MEMBER_VIEW), MemberController.getQRCard);
router.post('/', authorize(PERMISSIONS.MEMBER_CREATE), auditLog('Member', 'CREATE'), MemberController.create);
router.put('/:id', authorize(PERMISSIONS.MEMBER_UPDATE), auditLog('Member', 'UPDATE'), MemberController.update);
router.delete('/:id', authorize(PERMISSIONS.MEMBER_DELETE), auditLog('Member', 'DELETE'), MemberController.delete);

export default router;
