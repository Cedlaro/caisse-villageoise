import { Router } from 'express';
import { authRateLimiter } from '../middleware/rateLimit';
import { memberLoginValidator, staffLoginValidator } from '../middleware/validators/auth.validator';
import { memberLoginController, staffLoginController } from '../controllers/auth.controller';

const router = Router();

router.post('/member/login', authRateLimiter, memberLoginValidator, memberLoginController);
router.post('/staff/login',  authRateLimiter, staffLoginValidator,  staffLoginController);

export default router;
