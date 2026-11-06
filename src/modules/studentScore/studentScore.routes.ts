import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { StudentScoreController, StudentScoreValidation } from './index.js';

const router = Router();

router.get('/grid', ZodValidator(StudentScoreValidation.getMarksGridValidation), StudentScoreController.getMarksGrid);
router.put('/grid', ZodValidator(StudentScoreValidation.saveMarksGridValidation), StudentScoreController.saveMarksGrid);

export default router;
