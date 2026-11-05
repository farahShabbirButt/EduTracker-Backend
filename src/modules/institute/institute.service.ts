import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { InstituteMessages, ISaveInstitute } from './index.js';

const INSTITUTE_PUBLIC_FIELDS = {
  externalId: true,
  name: true,
  address: true,
  phone: true,
  schoolYearStartDate: true,
  logo: true,
} satisfies Prisma.InstituteSelect;

type PublicInstitute = Prisma.InstituteGetPayload<{ select: typeof INSTITUTE_PUBLIC_FIELDS }>;

// A date without a time, so it can't shift a day in another timezone
const toResponse = (institute: PublicInstitute) => ({
  ...institute,
  schoolYearStartDate: institute.schoolYearStartDate.toISOString().slice(0, 10),
});

class InstituteService {
  // There is one school. null until its details are entered.
  async getInstitute(): Promise<IAPISuccessResponse> {
    const institute = await prisma.institute.findFirst({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
      select: INSTITUTE_PUBLIC_FIELDS,
    });

    return {
      keyName: 'institute',
      institute: institute && toResponse(institute),
      code: InstituteMessages.INSTITUTE_FETCHED_SUCCESSFULLY.code,
      message: InstituteMessages.INSTITUTE_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async saveInstitute({ updatedBy, schoolYearStartDate, ...rest }: ISaveInstitute): Promise<IAPISuccessResponse> {
    const details = { ...rest, schoolYearStartDate: new Date(schoolYearStartDate) };

    const existing = await prisma.institute.findFirst({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
      select: { id: true },
    });

    const institute = existing
      ? await prisma.institute.update({
          where: { id: existing.id },
          data: { ...details, updatedBy },
          select: INSTITUTE_PUBLIC_FIELDS,
        })
      : await prisma.institute.create({
          data: { ...details, createdBy: updatedBy },
          select: INSTITUTE_PUBLIC_FIELDS,
        });

    return {
      keyName: 'institute',
      institute: toResponse(institute),
      code: InstituteMessages.INSTITUTE_SAVED_SUCCESSFULLY.code,
      message: InstituteMessages.INSTITUTE_SAVED_SUCCESSFULLY.message,
      success: true,
    };
  }
}

export default new InstituteService();
