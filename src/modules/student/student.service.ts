import prisma, { rethrowUniqueViolation } from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { ICreateStudent, IImportStudents, IUpdateStudent, StudentMessages } from './index.js';
import {
  cleanText,
  countRows,
  IImportResult,
  IImportRowResult,
  localDay,
  nameKey,
  dayInWords,
  parseDay,
  plural,
  refuseProblems,
} from '../../lib/import.js';
import { z } from 'zod';
import { StudentSubjectService } from '../../modules/studentSubject/index.js';
import { Prisma, SubjectType } from '@prisma/client';

const STUDENT_INCLUDE = {
  class: { select: { externalId: true, name: true } },
  studentSubjects: {
    where: { subjectClass: { deletedAt: null } },
    include: { subjectClass: { include: { subject: true } } },
  },
} satisfies Prisma.StudentInclude;

type StudentWithRelations = Prisma.StudentGetPayload<{ include: typeof STUDENT_INCLUDE }>;

class StudentService {
  //Create Student then assign compulsory subjects auto and assign elective subjects which user provided
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

    // Create student + assign subjects atomically; compulsory subjects are always assigned, electives only if provided
    const createdStudent = await prisma.$transaction(async (tx) => {
      const student = await tx.student
        .create({
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
        })
        .catch(rethrowUniqueViolation(StudentMessages.STUDENT_ALREADY_EXISTS));

      await StudentSubjectService.assignSubjectsToStudent(
        {
          studentId: student.id,
          classId: classEntity.id,
          subjectIds: payload.electiveSubjectIds ?? [],
        },
        tx,
      );

      // Re-read with class + subjects so the response matches GET (the UI renders it straight into the table)
      return tx.student.findUniqueOrThrow({ where: { id: student.id }, include: STUDENT_INCLUDE });
    });
    return {
      keyName: 'student',
      student: this.formatStudentResponse(createdStudent),
      code: StudentMessages.STUDENT_CREATED_SUCCESSFULLY.code,
      message: StudentMessages.STUDENT_CREATED_SUCCESSFULLY.message,
      success: true,
    };
  }

  // Students from a register. Same rules as the add form; rows whose roll number is already in
  // the class are skipped. Each new student joins on the row's date or the one picked for the
  // file, so they owe the tests from then on. Compulsory subjects come with the class.
  async importStudents({ dryRun, classId, joinedOn, rows, createdBy }: IImportStudents): Promise<IAPISuccessResponse> {
    // A day of slack: the school's today can be ahead of the server's (UTC+5 in Pakistan)
    const today = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const classes = await prisma.class.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, externalId: true, name: true },
    });

    let fixedClass: (typeof classes)[number] | undefined;
    if (classId) {
      fixedClass = classes.find((c) => c.externalId === classId);
      if (!fixedClass) throw ApiError.format('', StudentMessages.CLASS_NOT_FOUND);
    }

    const classKeys = classes.map((c) => nameKey(c.name));
    const classByKey = new Map(classes.map((c) => [nameKey(c.name), c]));
    const classTwice = new Set(classKeys.filter((k, i) => classKeys.indexOf(k) !== i));

    const [existing, electiveLinks] = await Promise.all([
      prisma.student.findMany({
        where: { deletedAt: null },
        select: { classId: true, rollNumber: true, firstName: true, lastName: true },
      }),
      prisma.subjectClass.findMany({
        where: { deletedAt: null, subject: { subjectType: SubjectType.ELECTIVE, isActive: true, deletedAt: null } },
        select: { id: true, classId: true, subject: { select: { name: true } } },
      }),
    ]);
    const rollKey = (cls: number, roll: string) => `${cls}:${roll.toLowerCase()}`;
    const taken = new Map(existing.map((s) => [rollKey(s.classId, s.rollNumber), s]));
    const seen = new Map<string, number>();

    const plans: {
      classId: number;
      data: Prisma.StudentCreateManyInput;
      electiveLinkIds: number[];
    }[] = [];

    const results: IImportRowResult[] = rows.map((input) => {
      const problems: string[] = [];
      const notes: string[] = [];
      const firstName = cleanText(input.firstName);
      const lastName = cleanText(input.lastName);
      const fatherName = cleanText(input.fatherName);
      const rollNumber = cleanText(input.rollNumber);
      const fullName = [firstName, lastName].filter(Boolean).join(' ');

      let cls = fixedClass;
      if (!cls) {
        const className = cleanText(input.className);
        if (!className) problems.push('The class is missing');
        else if (classTwice.has(nameKey(className))) {
          problems.push(`More than one class is called ${className} (different capitals). Rename one first`);
        } else {
          cls = classByKey.get(nameKey(className));
          if (!cls) problems.push(`There is no class called ${className}`);
        }
      }

      const label = [fullName || '(no name)', rollNumber && `roll ${rollNumber}`, cls?.name].filter(Boolean).join(', ');
      const done = (status: IImportRowResult['status'], messages: string[]): IImportRowResult => ({
        row: input.row,
        label,
        status,
        messages,
      });

      if (!rollNumber) problems.push('The roll number is missing');
      else if (rollNumber.length > 20) problems.push('The roll number must be at most 20 characters');

      if (cls && rollNumber) {
        const there = taken.get(rollKey(cls.id, rollNumber));
        if (there) {
          const name = [there.firstName, there.lastName].filter(Boolean).join(' ');
          return done('exists', [`Roll ${rollNumber} is already in ${cls.name} (${name}), so this row is skipped`]);
        }
        const key = rollKey(cls.id, rollNumber);
        if (seen.has(key)) problems.push(`Roll ${rollNumber} in ${cls.name} is also on row ${seen.get(key)}`);
        else seen.set(key, input.row);
      }

      if (!firstName) problems.push('The first name is missing');
      else if (firstName.length > 50) problems.push('The first name must be at most 50 characters');
      if (lastName.length > 50) problems.push('The last name must be at most 50 characters');
      if (!fatherName) problems.push("The father's name is missing");
      else if (fatherName.length > 50) problems.push("The father's name must be at most 50 characters");

      let contactNo = cleanText(input.contactNo) || undefined;
      if (contactNo) {
        // Excel stores 03001234567 as a number and drops the 0
        if (/^3\d{9}$/.test(contactNo)) {
          notes.push(`Phone saved as 0${contactNo}: Excel had dropped its first 0`);
          contactNo = `0${contactNo}`;
        }
        if (contactNo.length < 7 || contactNo.length > 20) problems.push('The phone number must be 7 to 20 characters');
      }

      const email = cleanText(input.email) || undefined;
      if (email && !z.email().safeParse(email).success) problems.push(`${email} isn't a valid email`);

      const day = input.joinedOn?.trim() ? parseDay(input.joinedOn) : joinedOn;
      if (!day) problems.push('Joined on must be a date, e.g. 2026-04-01 or 1/4/2026');
      else if (day > today) problems.push("Joined on can't be in the future");

      const electiveLinkIds: number[] = [];
      const electiveShown: string[] = [];
      const electiveNames = [
        ...new Map(
          cleanText(input.electives)
            .split(/[,;]/)
            .map((e) => cleanText(e))
            .filter(Boolean)
            .map((e) => [nameKey(e), e]),
        ).values(),
      ];
      if (cls) {
        for (const elective of electiveNames) {
          const matches = electiveLinks.filter(
            (l) => l.classId === cls.id && nameKey(l.subject.name) === nameKey(elective),
          );
          const link = matches[0];
          if (matches.length > 1) {
            problems.push(
              `More than one elective in ${cls.name} is called ${elective} (different capitals). Rename one first`,
            );
          } else if (link) {
            electiveLinkIds.push(link.id);
            electiveShown.push(link.subject.name);
          } else problems.push(`${elective} isn't an elective offered in ${cls.name}`);
        }
      }

      if (problems.length || !cls || !day) return done('problem', problems);

      plans.push({
        classId: cls.id,
        electiveLinkIds,
        data: {
          firstName,
          lastName,
          fatherName,
          rollNumber,
          contactNo,
          email,
          classId: cls.id,
          classSince: localDay(day),
          createdBy: createdBy ?? null,
        },
      });
      // In words, so a day and month swapped by the file's date settings (4/1 read as 4 January) shows
      const joined = input.joinedOn?.trim() ? [`Joined on ${dayInWords(day)}`] : [];
      return done('new', [...joined, ...electiveShown.map((e) => `Elective: ${e}`), ...notes]);
    });

    const answer: IImportResult = { dryRun, counts: countRows(results), rows: results };
    if (dryRun) {
      return { keyName: 'studentImport', studentImport: answer, ...StudentMessages.STUDENT_IMPORT_CHECKED };
    }

    refuseProblems(results, StudentMessages.STUDENT_IMPORT_HAS_PROBLEMS);

    const created = await prisma
      .$transaction(
        async (tx) => {
          const made = await tx.student.createManyAndReturn({
            data: plans.map((p) => p.data),
            select: { id: true, classId: true, rollNumber: true },
          });
          const idOf = new Map(made.map((s) => [rollKey(s.classId, s.rollNumber), s.id]));
          const electives = plans.flatMap((p) =>
            p.electiveLinkIds.map((subjectClassId) => ({
              studentId: idOf.get(rollKey(p.classId, p.data.rollNumber))!,
              subjectClassId,
            })),
          );
          if (electives.length) await tx.studentSubject.createMany({ skipDuplicates: true, data: electives });
          for (const id of new Set(plans.map((p) => p.classId))) {
            await StudentSubjectService.enrolClassInCompulsorySubjects(id, tx);
          }
          return tx.student.findMany({
            where: { id: { in: made.map((s) => s.id) } },
            include: STUDENT_INCLUDE,
            orderBy: { id: 'asc' },
          });
        },
        { timeout: 60_000 },
      )
      .catch(rethrowUniqueViolation(StudentMessages.STUDENT_ALREADY_EXISTS));

    answer.created = created.map(this.formatStudentResponse);
    const skipped = answer.counts.exists ? `, ${answer.counts.exists} already there` : '';
    return {
      keyName: 'studentImport',
      studentImport: answer,
      code: StudentMessages.STUDENT_IMPORT_DONE.code,
      message: `${plural(created.length, 'student', 'students')} imported${skipped}`,
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

    // Update student + reassign subjects atomically, so a failed reassignment can't leave the student with none
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // Moving class can collide with a student already holding this roll number there
      const updated = await tx.student
        .update({
          where: { id: student.id },
          data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            fatherName: payload.fatherName,
            email: payload.email,
            contactNo: payload.contactNo,
            ...(classId !== student.classId && {
              classId,
              classSince: new Date(),
            }),
          },
        })
        .catch(rethrowUniqueViolation(StudentMessages.STUDENT_ALREADY_EXISTS));

      // Reassign subjects ONLY if electives provided OR class changed
      if (payload.electiveSubjectIds || classId !== student.classId) {
        await StudentSubjectService.assignSubjectsToStudent(
          {
            studentId: student.id,
            classId,
            subjectIds: payload.electiveSubjectIds ?? [],
            replaceExisting: true,
          },
          tx,
        );
      }

      return tx.student.findUniqueOrThrow({ where: { id: updated.id }, include: STUDENT_INCLUDE });
    });

    return {
      keyName: 'student',
      student: this.formatStudentResponse(updatedStudent),
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
      include: STUDENT_INCLUDE,
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
      include: STUDENT_INCLUDE,
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
      include: STUDENT_INCLUDE,
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

  private formatStudentResponse = (student: StudentWithRelations) => ({
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
    subjects: student.studentSubjects.map((ss) => ({
      externalId: ss.subjectClass.subject.externalId,
      name: ss.subjectClass.subject.name,
      subjectType: ss.subjectClass.subject.subjectType,
      maxMarks: ss.subjectClass.subject.maxMarks,
    })),
  });
}

export default new StudentService();
