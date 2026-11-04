import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { InstituteMessages, ISaveInstitute } from './index.js';

const INSTITUTE_PUBLIC_FIELDS = {
  externalId: true,
  name: true,
  address: true,
  phone: true,
  schoolYearStartMonth: true,
} satisfies Prisma.InstituteSelect;

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
      institute,
      code: InstituteMessages.INSTITUTE_FETCHED_SUCCESSFULLY.code,
      message: InstituteMessages.INSTITUTE_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async saveInstitute({ updatedBy, ...details }: ISaveInstitute): Promise<IAPISuccessResponse> {
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
      institute,
      code: InstituteMessages.INSTITUTE_SAVED_SUCCESSFULLY.code,
      message: InstituteMessages.INSTITUTE_SAVED_SUCCESSFULLY.message,
      success: true,
    };
  }
}

export default new InstituteService();
