import { Router } from 'express';
import multer from 'multer';
import { submissionController } from './submissions.controller.js';

// Multer in-memory storage for handling upload validation & processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max limit
  },
});

export const submissionsRouter = Router();

submissionsRouter.post('/', submissionController.create);
submissionsRouter.get('/', submissionController.list);
submissionsRouter.post('/upload', upload.single('file'), submissionController.uploadPdf);
submissionsRouter.post('/extract-url', submissionController.extractUrl);
submissionsRouter.get('/:id', submissionController.getById);
submissionsRouter.get('/:id/file', submissionController.getFile);
submissionsRouter.put('/:id', submissionController.update);
submissionsRouter.patch('/:id', submissionController.update);
submissionsRouter.delete('/:id', submissionController.delete);
submissionsRouter.delete('/', submissionController.deleteMany);
