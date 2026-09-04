import { ConductRating } from '@prisma/client';

export interface IUpsertConduct {
  month: number;
  year: number;
  behaviour: ConductRating;
  uniformCleanliness: ConductRating;
  createdBy?: string;
  updatedBy?: string;
}
