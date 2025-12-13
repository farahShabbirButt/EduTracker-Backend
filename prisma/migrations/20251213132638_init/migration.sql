-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('COMPULSORY', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('MONTHLY', 'SESSION');

-- CreateTable
CREATE TABLE "Class" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "email" TEXT,
    "contactNo" TEXT,
    "rollNumber" TEXT NOT NULL,
    "classId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectType" "SubjectType" NOT NULL,
    "maxMarks" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSubject" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StudentSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "testType" "TestType" NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentScore" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "testId" INTEGER NOT NULL,
    "obtainedMarks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StudentScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeScale" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "minPercentage" DOUBLE PRECISION NOT NULL,
    "maxPercentage" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GradeScale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Class_externalId_key" ON "Class"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_externalId_key" ON "Student"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_classId_rollNumber_key" ON "Student"("classId", "rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_externalId_key" ON "Subject"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubject_externalId_key" ON "StudentSubject"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubject_studentId_subjectId_key" ON "StudentSubject"("studentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Test_externalId_key" ON "Test"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentScore_externalId_key" ON "StudentScore"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentScore_studentId_subjectId_testId_key" ON "StudentScore"("studentId", "subjectId", "testId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeScale_externalId_key" ON "GradeScale"("externalId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubject" ADD CONSTRAINT "StudentSubject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubject" ADD CONSTRAINT "StudentSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScore" ADD CONSTRAINT "StudentScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScore" ADD CONSTRAINT "StudentScore_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScore" ADD CONSTRAINT "StudentScore_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
