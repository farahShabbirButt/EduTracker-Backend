import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { StudentController, StudentValidation } from './index.js';
import { deleteStudentValidation } from './student.validation.js';

const router = Router();

router.post('/', ZodValidator(StudentValidation.createStudentValidation), StudentController.create);
router.put('/:studentExternalId', ZodValidator(StudentValidation.updateStudentValidation), StudentController.update);
router.get('/', StudentController.getAllStudents);

router.get('/class/:classExternalId', StudentController.getStudentsByClassId);

router.get('/:studentExternalId', StudentController.getStudentById);
router.delete('/:studentExternalId', ZodValidator(deleteStudentValidation), StudentController.deleteStudent);

export default router;
