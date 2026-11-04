import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { InstituteController, InstituteValidation } from './index.js';

const router = Router();

router.get('/', InstituteController.get);
router.put('/', ZodValidator(InstituteValidation.saveInstituteValidation), InstituteController.save);

export default router;
