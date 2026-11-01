import { expect, test, type Page } from '@playwright/test';
import type { RoomView } from '../../packages/shared/src/index';
test.beforeEach(async ({page}) => {await page.addInitScript(() => localStorage.setItem('ace.entry.v1', 'guest'));});
function capture(page: Page) {
  const errors: string[] = [], states: RoomView[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('websocket', ws => ws.on('framereceived', ({payload}) => {
    const value = String(payload); if (!value.startsWith('42')) return;
    try {const [event, body] = JSON.parse(value.slice(2)); if (['match:state','point:resolved','match:finished','player:reconnected','player:disconnected'].includes(event)) states.push(body);} catch { /* Ping, binary or other namespace packet. */ }
  }));
  return {errors, states};
}
async function shot(page: Page) {
  const options = page.getByRole('group', {name: 'Escolha seu golpe'}).locator('button');
  const angle = options.filter({hasText: 'Curta e angulada'}), line = options.filter({hasText: 'Paralela profunda'});
  if (await angle.count()) await angle.click(); else if (await line.count()) await line.click(); else await options.first().click();
  await page.getByRole('button', {name: 'Fundo', exact: true}).click();
  await page.getByRole('button', {name: 'Confirmar jogada', exact: true}).click();
  await expect(page.getByRole('group', {name: 'Escolha seu golpe'})).not.toBeVisible();
}
test('menu, perfil, navegação e ausência de métricas inventadas', async ({page}, info) => {
  const evidence = capture(page);
  await page.goto('/'); await expect(page.getByRole('heading', {name: 'Bom jogo começa com boas decisões.'})).toBeVisible();
  await expect(page.locator('.network-dot')).toHaveClass(/connected/);
  await page.screenshot({path: `output/playwright/${info.project.name}-inicio.png`, fullPage: true});
  await page.getByRole('button', {name: 'Configurações', exact: true}).click();
  await page.getByRole('textbox', {name: 'Como podemos chamar você?'}).fill('Renato');
  await page.getByRole('combobox', {name: 'Linguagem do treinador'}).selectOption('child');
  await page.getByRole('button', {name: 'Azul', exact: true}).click();
  await page.getByRole('button', {name: 'Salvar meu perfil'}).click();
  await expect(page.locator('.profile-button')).toContainText('Renato');
  await page.reload(); await expect(page.locator('.profile-button')).toContainText('Renato');
  await page.getByRole('button', {name: 'Meu progresso', exact: true}).click();
  await expect(page.getByText('Seu primeiro ponto é o ponto de partida.')).toBeVisible();
  await expect(page.locator('.stat-card').nth(1)).toContainText('—');
  await page.getByRole('button', {name: 'Academia', exact: true}).click();
  await expect(page.locator('.scenario-card')).toHaveCount(12);
  await page.screenshot({path:`output/playwright/${info.project.name}-academia.png`,fullPage:true});
  await page.locator('.scenario-card').first().screenshot({path:`output/playwright/${info.project.name}-miniatura-quadra.png`});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(evidence.errors).toEqual([]);
});
test('academia: toque livre, escolha de golpe, ponto, explicação, replay e progresso', async ({page}, info) => {
  const evidence = capture(page);
  await page.goto('/'); await page.getByRole('button', {name: 'Entrar na academia'}).click();
  await page.locator('.scenario-card').filter({hasText: 'Devolva um saque aberto'}).click();
  await expect(page.locator('.phaser-court canvas')).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Devolva um saque aberto'})).toBeVisible();
  await page.getByRole('button', {name: /Profunda no meio/}).click();
  const canvas = page.locator('.phaser-court canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (info.project.name === 'desktop-chromium') await canvas.click({position: {x: box!.width * .55, y: box!.height * .83}});
  else await canvas.tap({position: {x: box!.width * .55, y: box!.height * .83}});
  await expect(page.getByRole('button', {name: 'Confirmar jogada', exact: true})).toBeEnabled();
  if (info.project.name === 'ipad-webkit') {
    const confirm = await page.getByRole('button', {name: 'Confirmar jogada', exact: true}).boundingBox();
    expect(confirm!.y + confirm!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  }
  await page.screenshot({path: `output/playwright/${info.project.name}-quadra.png`, fullPage: true});
  await page.getByRole('button', {name: 'Confirmar jogada', exact: true}).click();
  await expect(page.getByRole('group', {name: 'Escolha seu golpe'})).not.toBeVisible();
  let decisions = 0;
  while (!(await page.getByRole('button', {name: 'Repetir e experimentar'}).isVisible()) && decisions++ < 35) {
    await expect.poll(async () => (await page.getByRole('group', {name: 'Escolha seu golpe'}).isVisible()) || (await page.getByRole('button', {name: 'Repetir e experimentar'}).isVisible()), {timeout: 20_000}).toBe(true);
    if (await page.getByRole('button', {name: 'Repetir e experimentar'}).isVisible()) break;
    await shot(page);
  }
  await expect(page.getByRole('button', {name: 'Repetir e experimentar'})).toBeVisible();
  await expect(page.locator('.coach-note')).toContainText('Sua devolução profunda pelo meio');
  await page.screenshot({path: `output/playwright/${info.project.name}-revisao.png`, fullPage: true});
  await page.getByRole('button', {name: 'Rever trajetórias'}).click();
  await page.getByRole('button', {name: 'Escolher outro exercício'}).click();
  await page.getByRole('button', {name: 'Meu progresso', exact: true}).click();
  await expect(page.locator('.stat-card').nth(3)).toContainText('1');
  await expect(page.locator('.stat-card').nth(1)).not.toContainText('—');
  expect(evidence.states.some(r => r.state?.decisions.some(d => d.shot === 'deep-middle' && d.player === 0))).toBe(true);
  expect(evidence.errors).toEqual([]);
});
test('dois navegadores: sala privada, devolvedor, saque aberto, sincronização e recarga', async ({browser, page}, info) => {
  test.skip(info.project.name === 'mobile-webkit', 'Fluxo competitivo prioriza computador e iPad horizontal.');
  const hostEvidence = capture(page);
  const guestContext = await browser.newContext({viewport: {width: 1024, height: 768}, hasTouch: true});
  const guest = await guestContext.newPage(), guestEvidence = capture(guest);
  await page.goto('/'); await page.getByRole('button', {name: 'Duelo', exact: true}).click();
  await page.getByRole('combobox', {name: 'Tempo por decisão'}).first().selectOption('8');
  await page.getByRole('button', {name: 'Criar duelo privado'}).click();
  const code = await page.locator('.room-code-display strong').innerText();
  await guest.addInitScript(() => localStorage.setItem('ace.entry.v1', 'guest'));
  await guest.goto(`${new URL(page.url()).origin}/?sala=${code}`);
  await expect(guest.getByRole('heading', {name: 'A quadra está reservada.'})).toBeVisible();
  await guest.getByRole('button', {name: 'Estou pronto', exact: true}).click();
  await page.getByRole('button', {name: 'Iniciar tie-break'}).click();
  await expect(guest.getByRole('button', {name: 'Confirmar posição'})).toBeVisible();
  await guest.getByRole('button', {name: 'Fundo', exact: true}).click();
  await guest.getByRole('button', {name: 'Confirmar posição'}).click();
  await expect(page.getByRole('button', {name: /Saque aberto/})).toBeVisible();
  await page.getByRole('button', {name: /Saque aberto/}).click();
  await page.getByRole('button', {name: 'Fundo', exact: true}).click();
  await page.getByRole('button', {name: 'Confirmar jogada', exact: true}).click();
  await expect.poll(() => guestEvidence.states.some(r => r.state?.decisions.some(d => d.shot === 'serve-wide'))).toBe(true);
  const before = (await guest.locator('.score-numbers').innerText()).replace(/\s/g, '');
  await guest.reload(); await expect.poll(async () => (await guest.locator('.score-numbers').innerText()).replace(/\s/g, '')).toBe(before);
  await expect.poll(() => hostEvidence.states.at(-1)?.paused).toBe(false);
  expect(guestEvidence.states.at(-1)!.members).toHaveLength(2);
  await guest.screenshot({path: `output/playwright/${info.project.name}-duelo-ipad.png`, fullPage: true});
  expect(hostEvidence.errors).toEqual([]); expect(guestEvidence.errors).toEqual([]);
  await guestContext.close();
});
test('cronômetro expira no servidor e registra defesa automática', async ({page}, info) => {
  test.skip(info.project.name === 'mobile-webkit', 'Coberto nos outros dois motores.');
  const evidence = capture(page);
  await page.goto('/'); await page.getByRole('button', {name: /Desafie o computador/}).click();
  await page.getByRole('combobox', {name: 'Tempo por decisão'}).selectOption('3');
  await page.getByRole('button', {name: 'Entrar em quadra'}).click();
  await expect(page.locator('.phaser-court canvas')).toBeVisible();
  await expect.poll(() => evidence.states.some(r => r.state?.decisions.some(d => d.automatic && d.player === 0)), {timeout: 20_000}).toBe(true);
  expect(evidence.errors).toEqual([]);
});
test('subir à rede libera voleios e permite rebater antes do quique', async ({page}, info) => {
  const evidence = capture(page);
  await page.goto('/'); await page.getByRole('button', {name: 'Entrar na academia'}).click();
  await page.locator('.scenario-card').filter({hasText: 'Suba com um plano'}).click();
  await expect(page.locator('.phaser-court canvas')).toBeVisible();
  // Novas tentativas cobrem possíveis erros de execução reais do aluno ou do bot.
  for (let attempt = 0; attempt < 6; attempt++) {
    await page.getByRole('button', {name: /Cruzada profunda/}).click();
    await page.getByRole('button', {name: 'À rede', exact: true}).click();
    await page.getByRole('button', {name: 'Confirmar jogada', exact: true}).click();
    await expect(page.getByRole('group', {name: 'Escolha seu golpe'})).not.toBeVisible();
    await expect.poll(() => {const s = evidence.states.at(-1)?.state; return s?.phase === 'POINT_REVIEW' || s?.phase === 'SHOT_DECISION' && s.turn === 0;}, {timeout: 20_000}).toBe(true);
    if (evidence.states.at(-1)?.state?.options.includes('volley-block')) break;
    await page.getByRole('button', {name: 'Repetir e experimentar'}).click();
  }
  await expect(page.getByRole('button', {name: /Voleio profundo/})).toBeVisible();
  await expect(page.getByRole('button', {name: /Voleio angulado/})).toBeVisible();
  await expect(page.getByText(/Antes do quique · voleio disponível/)).toBeVisible();
  await page.screenshot({path:`output/playwright/${info.project.name}-voleio.png`,fullPage:true});
  await page.getByRole('button', {name: /Voleio de bloqueio/}).click();
  await page.getByRole('button', {name:'À rede',exact:true}).click();
  await page.getByRole('button', {name:'Confirmar jogada',exact:true}).click();
  await expect.poll(() => evidence.states.some(r => r.state?.decisions.some(d => d.player === 0 && d.shot === 'volley-block'))).toBe(true);
  expect(evidence.errors).toEqual([]);
});
