import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { StudentScoreController, StudentScoreValidation } from './index.js';

const router = Router();

router.post('/entry', ZodValidator(StudentScoreValidation.marksEntryValidation), StudentScoreController.enterMarks);
router.get(
  '/entry',
  ZodValidator(StudentScoreValidation.getMarksEntryStudentsVaidation),
  StudentScoreController.getMarksEntryStudents,
);
export default router;
