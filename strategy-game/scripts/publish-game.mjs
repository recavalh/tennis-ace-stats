import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const projectName = 'ace-stats-game';
const renderHealth = 'https://ace-stats-game.onrender.com/api/health';
const pagesBuildInfo = 'https://app.ace-stats.com/build-info.json';
const commit = process.env.GITHUB_SHA;
const { buildId } = JSON.parse(await readFile(new URL('../dist/client/build-info.json', import.meta.url), 'utf8'));

if (!/^[a-f0-9]{40}$/.test(commit ?? '') || !/^[a-f0-9]{16}$/.test(buildId ?? '')) {
  throw new Error('A publicação precisa do commit do GitHub e do identificador do build.');
}

function renderHook() {
  let hook;
  try {
    hook = new URL(process.env.RENDER_DEPLOY_HOOK_URL ?? '');
  } catch {
    throw new Error('Configure o segredo RENDER_DEPLOY_HOOK_URL.');
  }
  if (hook.origin !== 'https://api.render.com' || hook.pathname !== '/deploy/srv-dbjo124s728c738b8v90' || !hook.searchParams.get('key')) {
    throw new Error('RENDER_DEPLOY_HOOK_URL precisa apontar para o serviço ace-stats-game.');
  }
  return hook;
}

async function waitForBuild(label, endpoint, timeoutMs, matches) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(endpoint, {
        cache: 'no-store',
        signal: AbortSignal.timeout(Math.min(80_000, deadline - Date.now())),
      });
      if (response.ok && matches(await response.json())) {
        console.log(`${label} confirmou o build ${buildId}.`);
        return;
      }
    } catch {
      // A versão anterior ou um servidor iniciando ainda não está pronto para a publicação.
    }
    await delay(Math.max(0, Math.min(8_000, deadline - Date.now())));
  }
  throw new Error(`${label} não confirmou o build ${buildId} do commit ${commit}. Confira o deploy no painel.`);
}

switch (process.argv[2]) {
  case 'preflight': {
    renderHook();
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN;
    if (!token || !/^[a-f0-9]{32}$/.test(accountId ?? '')) {
      throw new Error('Configure CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID no GitHub.');
    }
    const projectUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`;
    const response = await fetch(projectUrl, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    }).catch(() => undefined);
    const project = response?.ok ? (await response.json().catch(() => null))?.result : null;
    if (project?.name !== projectName || project.production_branch !== 'main') {
      throw new Error('Não foi possível validar o projeto de produção no Cloudflare Pages.');
    }
    break;
  }
  case 'render': {
    const hook = renderHook();
    hook.searchParams.set('ref', commit);
    const response = await fetch(hook, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    }).catch(() => undefined);
    if (response?.status !== 200 && response?.status !== 202) {
      throw new Error(`O Render não aceitou o deploy (${response?.status ?? 'sem resposta'}).`);
    }
    console.log(`Deploy solicitado ao Render para ${commit}.`);
    await waitForBuild('Render', renderHealth, 12 * 60_000, health =>
      health.ok && health.buildId === buildId && health.commit === commit,
    );
    break;
  }
  case 'verify':
    await waitForBuild('Cloudflare Pages', `${pagesBuildInfo}?commit=${commit}`, 3 * 60_000, info => info.buildId === buildId);
    break;
  default:
    throw new Error('Use preflight, render ou verify.');
}
