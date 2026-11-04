import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Evolyn API listening on http://localhost:${env.PORT}`);
  console.log(`📡 Health Check: http://localhost:${env.PORT}/health`);
  console.log(`🤖 Gemini Model: ${env.GEMINI_MODEL} (Embedding: ${env.GEMINI_EMBEDDING_MODEL})`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default server;
