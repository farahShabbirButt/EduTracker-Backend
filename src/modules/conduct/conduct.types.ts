import { ConductRating } from '@prisma/client';

export interface ISaveClassConduct {
  month: number;
  year: number;
  entries: {
    studentExternalId: string;
    behaviour: ConductRating;
    uniformCleanliness: ConductRating;
  }[];
}
