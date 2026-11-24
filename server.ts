import { startServer } from './server/index.js';

startServer().catch((error) => {
  console.error('StüdyoAsistan sunucusu başlatılamadı:', error);
  process.exit(1);
});
