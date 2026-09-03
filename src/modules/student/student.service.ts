import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { ICreateStudent, IUpdateStudent, StudentMessages } from './index.js';
import { StudentSubjectService } from '../../modules/studentSubject/index.js';

class StudentService {
  //Create Student then assign compulsory subjects auto and assign elective subjects which user provided
  //TODO: FIX create api response should alos return student Class Id's data also instead of just externalId
  async createStudent(payload: ICreateStudent): Promise<IAPISuccessResponse> {
    // Check class existence
    const classEntity = await prisma.class.findFirst({
      where: {
        externalId: payload.classId,
        isActive: true,
        deletedAt: null,
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
        deletedAt: null,
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
  }

  async updateStudent(studentExternalId: string, payload: IUpdateStudent): Promise<IAPISuccessResponse> {
    // Fetch student
    const student = await prisma.student.findFirst({
      where: {
        externalId: studentExternalId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!student) {
      throw ApiError.format('', StudentMessages.STUDENT_NOT_FOUND);
    }

    let classId = student.classId;

    // Handle class change (if provided)
    if (payload?.classId) {
      const classEntity = await prisma.class.findFirst({
        where: {
          externalId: payload.classId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!classEntity) {
        throw ApiError.format('', StudentMessages.CLASS_NOT_FOUND);
      }

      classId = classEntity.id;
    }

    // Update student basic info
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        fatherName: payload.fatherName,
        email: payload.email,
        contactNo: payload.contactNo,
        ...(classId !== student.classId && {
          classId,
        }),
      },
    });

    // Reassign subjects ONLY if electives provided OR class changed
    if (payload.electiveSubjectIds || classId !== student.classId) {
      await StudentSubjectService.assignSubjectsToStudent({
        studentId: student.id,
        classId,
        subjectIds: payload.electiveSubjectIds ?? [],
        replaceExisting: true,
      });
    }

    return {
      keyName: 'student',
      student: updatedStudent,
      code: StudentMessages.STUDENT_UPDATED_SUCCESSFULLY.code,
      message: StudentMessages.STUDENT_UPDATED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async getStudentById(studentExternalId: string): Promise<IAPISuccessResponse> {
    const student = await prisma.student.findFirst({
      where: {
        externalId: studentExternalId,
        isActive: true,
        deletedAt: null,
      },
      include: this.studentInclude,
    });

    if (!student) {
      throw ApiError.format('', StudentMessages.STUDENT_NOT_FOUND);
    }

    const formattedStudent = this.formatStudentResponse(student);

    return {
      keyName: 'student',
      student: formattedStudent,
      code: StudentMessages.STUDENT_FETCHED_SUCCESSFULLY.code,
      message: StudentMessages.STUDENT_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async getStudentsByClassId(classExternalId: string): Promise<IAPISuccessResponse> {
    const classEntity = await prisma.class.findFirst({
      where: {
        externalId: classExternalId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!classEntity) {
      throw ApiError.format('', StudentMessages.CLASS_NOT_FOUND);
    }

    const students = await prisma.student.findMany({
      where: {
        classId: classEntity.id,
        isActive: true,
        deletedAt: null,
      },
      include: this.studentInclude,
      orderBy: {
        rollNumber: 'asc',
      },
    });

    const formattedStudents = students.map(this.formatStudentResponse);

    return {
      keyName: 'students',
      students: formattedStudents,
      code: StudentMessages.STUDENTS_FETCHED_SUCCESSFULLY.code,
      message: StudentMessages.STUDENTS_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }
  async getAllStudents(): Promise<IAPISuccessResponse> {
    const students = await prisma.student.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: this.studentInclude,
      orderBy: [{ classId: 'asc' }, { rollNumber: 'asc' }],
    });

    const formattedStudents = students.map(this.formatStudentResponse);

    return {
      keyName: 'students',
      students: formattedStudents,
      code: StudentMessages.STUDENTS_FETCHED_SUCCESSFULLY.code,
      message: StudentMessages.STUDENTS_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }
  async deleteStudent(studentExternalId: string): Promise<IAPISuccessResponse> {
    // Check student existence
    const student = await prisma.student.findFirst({
      where: {
        externalId: studentExternalId,
        isActive: true,
        deletedAt: null,
      },
    });
    if (!student) {
      throw ApiError.format('', StudentMessages.STUDENT_NOT_FOUND);
    }

    // Soft delete student
    await prisma.student.update({
      where: { id: student.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return {
      keyName: 'student',
      student: { externalId: studentExternalId },
      code: StudentMessages.STUDENT_DELETED_SUCCESSFULLY.code,
      message: StudentMessages.STUDENT_DELETED_SUCCESSFULLY.message,
      success: true,
    };
  }

  private studentInclude = {
    class: { select: { externalId: true, name: true } },
    studentSubjects: { include: { subjectClass: { include: { subject: true } } } },
  };

  private formatStudentResponse = (student: any) => ({
    id: student.id,
    externalId: student.externalId,
    firstName: student.firstName,
    lastName: student.lastName,
    fatherName: student.fatherName,
    rollNumber: student.rollNumber,
    email: student.email,
    contactNo: student.contactNo,
    class: {
      externalId: student.class.externalId,
      name: student.class.name,
    },
    subjects: student.studentSubjects.map((ss: any) => ({
      externalId: ss.subjectClass.subject.externalId,
      name: ss.subjectClass.subject.name,
      subjectType: ss.subjectClass.subject.subjectType,
      maxMarks: ss.subjectClass.subject.maxMarks,
    })),
  });
}

export default new StudentService();
