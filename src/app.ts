import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './lib/env.js';
import { API_ROUTE, APP_BASE } from './common/base/baseRoutes.js';
import { SubjectRoutes } from './modules/subject/index.js';
import { SubjectClassRoutes } from './modules/subjectClass/index.js';
import { ClassRoutes } from './modules/class/index.js';
import { StudentRoutes } from './modules/student/index.js';
import { TestRoutes } from './modules/test/index.js';
import { StudentScoreRoutes } from './modules/studentScore/index.js';
import { GradeRoutes } from './modules/grade/index.js';
import { ConductRoutes } from './modules/conduct/index.js';
import { ReportRoutes } from './modules/report/index.js';
import { InstituteRoutes } from './modules/institute/index.js';
import { AuthRoutes } from './modules/auth/index.js';
import { notFoundMiddleware } from './middleware/notFound.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { requestLogger } from './middleware/requestLogger.middleware.js';

const app: Application = express();
// APP_BASE = '/edu-tracker';
// API_ROUTE = '/api/v1';
const BASE = APP_BASE + API_ROUTE;
const SUBJECT = BASE + '/subject';
const SUBJECT_CLASS = BASE + '/subject-class';
const CLASS = BASE + '/class';
const STUDENT = BASE + '/student';
const TEST = BASE + '/test';
const STUDENT_SCORE = BASE + '/student-score';
const GRADE_SCALE = BASE + '/grade-scale';
const CONDUCT = BASE + '/conduct';
const REPORT = BASE + '/report';
const INSTITUTE = BASE + '/institute';
const AUTH = BASE + '/auth';

app.use(requestLogger);

// Global middlewares
app.use(cookieParser());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
// Only the school's details carry a logo. Whichever parser runs first handles the body.
app.use(INSTITUTE, express.json({ limit: '500kb' }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('EduTracker Backend Working');
});
// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'OK' });
});

//Application Routes
app.use(AUTH, AuthRoutes);

app.use(SUBJECT, authMiddleware, SubjectRoutes);
app.use(SUBJECT_CLASS, authMiddleware, SubjectClassRoutes);
app.use(CLASS, authMiddleware, ClassRoutes);
app.use(STUDENT, authMiddleware, StudentRoutes);
app.use(TEST, authMiddleware, TestRoutes);
app.use(STUDENT_SCORE, authMiddleware, StudentScoreRoutes);
app.use(GRADE_SCALE, authMiddleware, GradeRoutes);
app.use(CONDUCT, authMiddleware, ConductRoutes);
app.use(REPORT, authMiddleware, ReportRoutes);
app.use(INSTITUTE, authMiddleware, InstituteRoutes);

// 404 + error handlers — must be registered AFTER all routes
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
