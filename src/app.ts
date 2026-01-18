import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { API_ROUTE, APP_BASE } from './common/base/baseRoutes.js';
import { SubjectRoutes } from './modules/subject/index.js';
import { SubjectClassRoutes } from './modules/subjectClass/index.js';
import { ClassRoutes } from './modules/class/index.js';
import { StudentRoutes } from './modules/student/index.js';

dotenv.config();

const app: Application = express();
console.info('App file loaded');
// APP_BASE = '/edu-tracker';
// API_ROUTE = '/api/v1';
const BASE = APP_BASE + API_ROUTE;
const SUBJECT = BASE + '/subject';
const SUBJECT_CLASS = BASE + '/subject-class';
const CLASS = BASE + '/class';
const STUDENT = BASE + '/students';
app.use((req, _res, next) => {
  console.info('➡️ Incoming:', req.method, req.url);
  next();
});

// Global middlewares
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('EduTracker Backend Working');
});
// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'OK' });
});

//Application Routes
app.use(SUBJECT, SubjectRoutes);
app.use(SUBJECT_CLASS, SubjectClassRoutes);
app.use(CLASS, ClassRoutes);
app.use(STUDENT, StudentRoutes);

export default app;
