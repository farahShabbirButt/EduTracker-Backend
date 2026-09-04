import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { ConductController, ConductValidation } from './index.js';

const router = Router();

router.put(
  '/student/:studentExternalId',
  ZodValidator(ConductValidation.upsertConductValidation),
  ConductController.upsert,
);
router.get('/student/:studentExternalId', ZodValidator(ConductValidation.getConductValidation), ConductController.get);

export default router;
