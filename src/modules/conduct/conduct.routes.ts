import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { ConductController, ConductValidation } from './index.js';

const router = Router();

router.get(
  '/class/:classExternalId',
  ZodValidator(ConductValidation.getClassConductValidation),
  ConductController.getForClass,
);
router.put(
  '/class/:classExternalId',
  ZodValidator(ConductValidation.saveClassConductValidation),
  ConductController.saveForClass,
);

export default router;
