import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { ICreateStudent, StudentMessages } from './index.js';
import { StudentSubjectService } from '../../modules/studentSubject/index.js';

class SubjectService {
  //Create Student then assign compulsory subjects auto and assign elective subjects which user provided
  async createStudent(payload: ICreateStudent): Promise<IAPISuccessResponse> {
    try {
      // Check class existence
      const classEntity = await prisma.class.findFirst({
        where: {
          externalId: payload.classId,
          isActive: true,
        },
      });

      if (!classEntity) {
        throw ApiError.format('', StudentMessages.CLASS_NOT_FOUND);
      }

      // Check duplicate roll number in same class
      const existingStudent = await prisma.student.findFirst({
        where: {
          rollNumber: payload.rollNumber,
          classId: classEntity.id,
          isActive: true,
        },
      });

      if (existingStudent) {
        throw ApiError.format('', StudentMessages.STUDENT_ALREADY_EXISTS);
      }

      // Create student
      const createdStudent = await prisma.student.create({
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          fatherName: payload.fatherName,
          rollNumber: payload.rollNumber,
          email: payload.email,
          contactNo: payload.contactNo,
          classId: classEntity.id,
          isActive: payload.isActive ?? true,
          createdBy: payload.createdBy,
        },
      });

      if (payload.electiveSubjectIds) {
        await StudentSubjectService.assignSubjectsToStudent({
          studentId: createdStudent.id,
          classId: classEntity.id,
          subjectIds: payload.electiveSubjectIds ?? [],
        });
      }
      return {
        keyName: 'student',
        student: createdStudent,
        code: StudentMessages.STUDENT_CREATED_SUCCESSFULLY.code,
        message: StudentMessages.STUDENT_CREATED_SUCCESSFULLY.message,
        success: true,
      };
    } catch (error) {
      throw ApiError.format(error, StudentMessages.STUDENT_CREATION_FAILURE);
    }
  }
}

export default new SubjectService();
