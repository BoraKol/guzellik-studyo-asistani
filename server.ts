import { startServer } from './server/index';

startServer().catch((error) => {
  console.error('StüdyoAsistan sunucusu başlatılamadı:', error);
  process.exit(1);
});
