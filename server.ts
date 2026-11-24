import { startServer } from './server/index.ts';

startServer().catch((error) => {
  console.error('StüdyoAsistan sunucusu başlatılamadı:', error);
  process.exit(1);
});
