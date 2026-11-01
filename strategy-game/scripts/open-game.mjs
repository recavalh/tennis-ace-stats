import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, writeFileSync, appendFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtime = join(root, '.runtime'), url = 'http://localhost:3100/', entry = join(root, 'dist', 'server.js');
const powershell = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const ps = command => ['-NoProfile', '-NonInteractive', '-Command', command];
mkdirSync(runtime,{recursive:true});
const log = join(runtime,'inicializacao.log');
const record = text => appendFileSync(log,`${new Date().toISOString()} ${text}\r\n`);
const pause = ms => new Promise(r=>setTimeout(r,ms));
async function ready() {
  try {const response=await fetch(`${url}api/health`,{signal:AbortSignal.timeout(1200)}); const body=await response.json(); return response.ok && body.ok===true && body.game==='Tennis Tático';} catch {return false;}
}
function run(executable,args,options={}) {
  return new Promise((accept,reject)=>{const child=spawn(executable,args,{cwd:root,windowsHide:true,...options}); child.once('error',reject); child.once('exit',code=>code===0 ? accept() : reject(new Error(`O processo terminou com código ${code}.`)));});
}
async function browser() {if (!process.argv.includes('--no-browser')) await run(process.env.ComSpec || 'cmd.exe',['/d','/c',`start "" "${url}"`],{stdio:'ignore'});}
function newest(path) {
  if (!existsSync(path)) return 0;
  const stat=statSync(path);
  return stat.isDirectory() ? Math.max(stat.mtimeMs,...readdirSync(path).map(name=>newest(join(path,name)))) : stat.mtimeMs;
}
async function stop() {
  const path=join(runtime,'servidor.pid');
  if (!existsSync(path)) {console.log('Nenhum servidor iniciado pelo atalho. Se iniciou no terminal, use Ctrl+C.'); return;}
  const pid=Number(readFileSync(path,'utf8'));
  if (!Number.isSafeInteger(pid)||pid<=0) throw new Error('Registro de servidor inválido.');
  // Só encerra o executável e o caminho absoluto iniciados por este atalho.
  const result=spawnSync(powershell,ps(`$p=Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}';if($p -and $p.ExecutablePath -eq ${quote(process.execPath)} -and $p.CommandLine.IndexOf(${quote(entry)},[StringComparison]::OrdinalIgnoreCase) -ge 0){Stop-Process -Id ${pid};exit 0};exit 2`),{windowsHide:true,stdio:'ignore'});
  console.log(result.status===0 ? 'Servidor do jogo encerrado.' : 'O processo registrado já terminou ou não pertence a este atalho.');
  unlinkSync(path);
}
async function main() {
  if (process.argv.includes('--stop')) return stop();
  if (process.argv.includes('--status')) {console.log(JSON.stringify({running:await ready(),url})); return;}
  if (await ready()) {record('Servidor já disponível; abrindo navegador.'); return browser();}
  if (Number(process.versions.node.split('.')[0])!==24) throw new Error('Instale o Node.js 24 LTS.');
  const lock=join(runtime,'iniciando.lock');
  if (existsSync(lock)&&Date.now()-statSync(lock).mtimeMs>600_000) unlinkSync(lock);
  let owner;
  try {owner=openSync(lock,'wx');} catch(error) {
    if(error.code!=='EEXIST') throw error;
    for(let i=0;i<180;i++){if(await ready()) return browser(); await pause(1000);}
    throw new Error('Outra inicialização ainda não terminou. Consulte o log.');
  }
  const output=openSync(log,'a');
  try {
    const npm=join(dirname(process.execPath),'node_modules','npm','bin','npm-cli.js');
    const options={env:{...process.env,NODE_USE_SYSTEM_CA:'1'},stdio:['ignore',output,output]};
    if(!existsSync(join(root,'node_modules'))){record('Instalando dependências.');await run(process.execPath,[npm,'install','--no-audit','--no-fund'],options);}
    const sourceTime=Math.max(...['apps/client/src','apps/client/public','apps/client/index.html','apps/server/src','packages','content','package.json','package-lock.json','tsconfig.json','vite.config.ts'].map(path=>newest(join(root,path))));
    if(!existsSync(entry)||!existsSync(join(root,'dist/client/index.html'))||sourceTime>statSync(entry).mtimeMs){record('Preparando build.');await run(process.execPath,[npm,'run','build'],options);}
    if(!await ready()){
      record('Iniciando servidor na porta 3100.');
      const child=spawn(process.execPath,[entry],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',output,output],env:{...process.env,PORT:'3100'}});
      let failure;child.once('error',error=>{failure=error;});
      if(child.pid){writeFileSync(join(runtime,'servidor.pid'),String(child.pid));child.unref();}
      for(let i=0;i<60;i++){if(failure)throw failure;if(await ready()){record('Jogo pronto.');return browser();}await pause(500);}
      throw new Error('O servidor não respondeu. A porta 3100 pode estar em uso.');
    }
    await browser();
  } finally {closeSync(output);closeSync(owner);if(existsSync(lock))unlinkSync(lock);}
}
main().then(()=>process.exit(0)).catch(error=>{
  record(`ERRO: ${error.stack??error.message}`);console.error(error.message);
  console.error(`Detalhes: ${log}`);
  process.exitCode=1;
});
