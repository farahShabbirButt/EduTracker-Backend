import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { StudentController, StudentValidation } from './index.js';

const router = Router();

router.post('/', ZodValidator(StudentValidation.createStudentValidation), StudentController.create);

export default router;
