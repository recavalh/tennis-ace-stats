import { expect, test, type Page } from '@playwright/test';
import { createGameServer } from '../../apps/server/src/server';
import type { RoomView } from '../../packages/shared/src';
let game: Awaited<ReturnType<typeof createGameServer>>, origin: string;
test.beforeEach(async () => {
  game = await createGameServer({database:':memory:', animationScale:.2, botDelay:30});
  await new Promise<void>(r => game.http.listen(0,'127.0.0.1',r));
  origin = `http://127.0.0.1:${(game.http.address() as any).port}`;
});
test.afterEach(async () => {await game.close();});
async function computer(page: Page) {
  await page.addInitScript(() => localStorage.setItem('ace.entry.v1', 'guest'));
  await page.goto(origin);
  await page.getByRole('button',{name:/Desafie o computador/}).click();
  await page.getByRole('button',{name:'Entrar em quadra',exact:true}).click();
  await expect(page.getByRole('button',{name:/Saque no corpo/})).toBeVisible();
}
test('aba anterior recebe golpe desconhecido e oferece atualização sem tela branca', async ({page}) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await computer(page);
  const room = [...game.rooms.values()][0];
  const socketId = room.members[0].socketId!;
  // Mesmo caso da aba antiga: o servidor anuncia um golpe ausente no catálogo local.
  const state = structuredClone(room.engine!.state); state.options = ['future-volley' as any];
  const view: RoomView = {code:room.code,mode:room.mode,me:0,host:0,members:room.members.map(m=>({name:m.name,color:m.color,connected:true,ready:true,bot:m.bot})),seconds:0,botStyle:room.botStyle,state,paused:false,reconnectUntil:null,canAbandon:false,serverTime:Date.now(),version:room.version+1};
  game.io.to(socketId).emit('match:state',view);
  await expect(page.getByRole('heading',{name:'Atualização do jogo disponível'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Atualizar e continuar'})).toBeVisible();
  expect(errors).toEqual([]);
  await page.getByRole('button',{name:'Atualizar e continuar'}).click();
  await expect(page.locator('.phaser-court canvas')).toBeVisible();
  expect(game.rooms.size).toBe(1); expect(room.members).toHaveLength(2);
});
test('detecta servidor atualizado ao voltar à aba e recarrega preservando a sala', async ({page}) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  let changed = false;
  await page.route('**/api/health', async route => {
    const response = await route.fetch(), body = await response.json();
    await route.fulfill({response,json:{...body,...(changed ? {buildId:'a-new-game-build'} : {})}});
  });
  await computer(page);
  const room = [...game.rooms.values()][0], id = room.engine!.state.id;
  changed = true; await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('heading',{name:'Atualização do jogo disponível'})).toBeVisible();
  changed = false; await page.getByRole('button',{name:'Atualizar e continuar'}).click();
  await expect(page.getByRole('button',{name:/Saque no corpo/})).toBeVisible();
  expect([...game.rooms.values()][0].engine!.state.id).toBe(id);
  expect(game.rooms.size).toBe(1); expect(errors).toEqual([]);
});
test('reproduz a partida registrada, executa voleio e continua após a revisão', async ({page}, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await computer(page);
  const room = [...game.rooms.values()][0]; room.engine!.state.seed = 966332212;
  await page.getByRole('combobox',{name:'Tipo de saque'}).selectOption('flat');
  const play = async (label: RegExp, recovery: string) => {
    await page.getByRole('button',{name:label}).click();
    await page.getByRole('button',{name:recovery,exact:true}).click();
    await page.getByRole('button',{name:'Confirmar jogada',exact:true}).click();
    await expect(page.getByRole('group',{name:'Escolha seu golpe'})).not.toBeVisible();
  };
  await play(/Saque no corpo/,'Fundo');
  await play(/Bola de segurança/,'Fundo');
  await play(/Cruzada profunda/,'Direita');
  await play(/Paralela profunda/,'À rede');
  await expect(page.getByRole('button',{name:/Voleio de bloqueio/})).toBeVisible();
  await play(/Voleio de bloqueio/,'À rede');
  let turns = 0;
  while (String(room.engine!.state.phase) !== 'POINT_REVIEW' && turns++ < 35) {
    await expect.poll(() => ['POINT_REVIEW','SHOT_DECISION'].includes(room.engine!.state.phase) && (room.engine!.state.phase === 'POINT_REVIEW' || room.engine!.state.turn === 0)).toBe(true);
    if (room.engine!.state.phase === 'POINT_REVIEW') break;
    const first = page.getByRole('group',{name:'Escolha seu golpe'}).locator('button').first();
    await first.click(); await page.getByRole('button',{name:'Fundo',exact:true}).click();
    await page.getByRole('button',{name:'Confirmar jogada',exact:true}).click();
    await expect(page.getByRole('group',{name:'Escolha seu golpe'})).not.toBeVisible();
  }
  await expect(page.getByRole('button',{name:'Próximo ponto',exact:true})).toBeVisible();
  await expect(page.locator('.coach-note')).toContainText('voleio');
  await page.screenshot({path:`output/playwright/${info.project.name}-partida-voleio-corrigida.png`,fullPage:true});
  await page.getByRole('button',{name:'Rever trajetórias'}).click();
  await page.getByRole('button',{name:'Próximo ponto',exact:true}).click();
  await expect(page.getByRole('button',{name:'Confirmar posição',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});
