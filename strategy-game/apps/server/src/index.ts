import { createGameServer } from './server';
const dev = process.argv.includes('--dev');
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL para preservar os dados do jogo na hospedagem.');
const port = Number(process.env.PORT ?? 3100);
const server = await createGameServer({dev});
server.http.listen(port, process.env.HOST ?? (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'), () => {
  console.log(`\n  TENNIS TÁTICO · Arena de Estratégias\n  Computador: http://localhost:${port}\n${server.addresses().map(ip => `  iPad na mesma rede: http://${ip}:${port}`).join('\n')}\n  Ctrl+C para parar.\n`);
});
const shutdown = async () => {await server.close(); process.exit(0);};
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
