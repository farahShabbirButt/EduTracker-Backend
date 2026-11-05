import { Prisma, PrismaClient } from '@prisma/client';
import { ApiError } from '../common/responses/index.js';

const prisma = new PrismaClient();

// The findFirst "already exists" checks race: two concurrent requests can both pass them, and the
// partial unique indexes then reject the second write with P2002. Use as `.catch(rethrowUniqueViolation(X))`
// on the write so that loser gets the module's normal "already exists" error instead of a 500.
export const rethrowUniqueViolation =
  (duplicateError: IError) =>
  (error: unknown): never => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw ApiError.format('', duplicateError);
    }
    throw error;
  };

// Marks that still count. A deleted student's marks are off every card and can't be cleared,
// so they must not block a change. A student moved to another class keeps counting: the mark
// stays on their card, and the marks sheet still lists them so it can be fixed.
export const LIVE_SCORES = {
  deletedAt: null,
  student: { isActive: true, deletedAt: null },
} satisfies Prisma.StudentScoreWhereInput;

export default prisma;
