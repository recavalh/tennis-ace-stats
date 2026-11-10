import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { io, type Socket } from 'socket.io-client';
import { ArrowUpRight, ArrowRight, ArrowLeft, Check, CheckCheck, ChevronRight, Clock3, Copy, Crosshair, Flag, Home, Layers3, LogOut, Menu, Play, Plus, RotateCcw, Settings2, ShieldCheck, Smartphone, Sparkles, Target, TrendingUp, Trophy, Users, VolumeX, Wifi, X, Zap, BookOpen, CircleHelp, Activity } from 'lucide-react';
import { SCENARIOS } from '../../../content/scenarios/index';
import { LEVEL_SECONDS, side, type Ack, type BotStyle, type Decision, type Profile, type Progress, type RoomView, type ShotId, type Vec } from '../../../packages/shared/src/index';
import { SHOTS } from '../../../packages/game-engine/src/config';
import { TacticalCoach } from '../../../packages/game-engine/src/coach';
import { CLIENT_BUILD_ID, hasUnknownShot, isBuildMismatch } from './compatibility';
import { RecoveryBoundary, RecoveryPanel } from './RecoveryBoundary';
import { HeroCourt, MiniCourt } from './CourtIllustrations';
import './style.css';
import './entry.css';
import './game-mobile.css';
import Welcome, {GoogleMark} from './Welcome';
import {apiUrl, GAME_SERVER_URL, SITE_URL, readLocal, writeLocal, readRoom, useAccount} from './accounts';
const Court = lazy(() => import('./Court'));
const EMPTY_PROGRESS: Omit<Progress, 'profile'> = {completed: [], attempts: 0, matches: 0, points: 0, shotIQ: null, positionIQ: null, weaknesses: [], history: []};
const DEFAULT_PROFILE: Profile = {id: '', nickname: 'Tenista', audience: 'adult', level: 'study', color: '#ddeb78'};
const MODE_LABEL = {academy: 'Academia Tática', computer: 'Contra o computador', duel: 'Duelo Tático'};
type Page = 'home' | 'academy' | 'duel' | 'computer' | 'progress';
function App() {
  const [page, setPage] = useState<Page>(() => {const query = new URLSearchParams(location.search); const mode = query.get('modo'); return query.has('sala') ? 'duel' : mode === 'academy' || mode === 'computer' || mode === 'duel' ? mode : 'home';}), [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE), [progress, setProgress] = useState<Progress>({...EMPTY_PROGRESS, profile: DEFAULT_PROFILE});
  const [socket, setSocket] = useState<Socket | null>(null), [online, setOnline] = useState(false), [room, setRoom] = useState<RoomView | null>(null);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false), [toast, setToast] = useState(''), [busy, setBusy] = useState(false), [joinCode, setJoinCode] = useState(new URLSearchParams(location.search).get('sala') ?? '');
  const [seconds, setSeconds] = useState(0), [botStyle, setBotStyle] = useState<BotStyle>('consistent'), [help, setHelp] = useState(false), [replay, setReplay] = useState<Decision[] | null>(null), [inviteOrigin, setInviteOrigin] = useState(location.origin);
  const account = useAccount();
  const accessToken = account.session?.access_token;
  const [visitor, setVisitor] = useState(() => readLocal('ace.entry.v1') === 'guest' || !!readLocal('tennis.profile.v1'));
  const [connectionError, setConnectionError] = useState('');
  const pendingNickname = useRef(readLocal('ace.nickname.v1') ?? '');
  const offset = useRef(0), toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function notify(message: string) {setToast(message); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 5000);}
  useEffect(() => {
    if (!visitor && !accessToken) return;
    if (!GAME_SERVER_URL && ['localhost', '127.0.0.1'].includes(location.hostname)) fetch(apiUrl('/api/health')).then(r => r.json()).then(data => {if (data.addresses?.[0]) setInviteOrigin(`${location.protocol}//${data.addresses[0]}:${location.port || '3000'}`);}).catch(() => {});
    const saved = readRoom();
    const s = io(GAME_SERVER_URL || undefined, {autoConnect: false, auth: {profileToken: readLocal('tennis.profile.v1'), accessToken, roomCode: saved?.code, roomToken: saved?.token}});
    const checkVersion = () => {if (document.visibilityState === 'hidden') return; fetch(apiUrl('/api/health'), {cache:'no-store'}).then(r => r.json()).then(data => {if (isBuildMismatch(CLIENT_BUILD_ID, data.buildId)) setNeedsUpdate(true);}).catch(() => {});};
    const update = (view: RoomView) => {offset.current = view.serverTime - Date.now(); if (hasUnknownShot(view.state)) setNeedsUpdate(true); setRoom(view);};
    s.on('connect', () => {setOnline(true); setConnectionError(''); checkVersion();});
    s.on('connect_error', (error: Error) => {setOnline(false); setConnectionError(error.message === 'websocket error' || error.message === 'xhr poll error' ? 'O servidor está iniciando. A conexão será retomada automaticamente.' : error.message);});
    s.on('storage:error', (message: string) => notify(message));
    s.on('session:expired', () => {setRoom(null); setVisitor(false); writeLocal('ace.entry.v1'); void account.signOut();}); s.on('disconnect', () => setOnline(false));
    s.on('session', async (data: {profile: Profile; token?: string; account?: {id: string; email: string}; buildId?: string}) => {
      if (isBuildMismatch(CLIENT_BUILD_ID, data.buildId)) setNeedsUpdate(true);
      if (data.account) {writeLocal('tennis.profile.v1'); writeLocal('ace.entry.v1');} else if (data.token) writeLocal('tennis.profile.v1', data.token);
      s.auth = {...s.auth, profileToken: data.account ? undefined : data.token};
      setProfile(data.profile); setSeconds(LEVEL_SECONDS[data.profile.level]);
      try {
        if (!data.account && pendingNickname.current && data.profile.nickname === 'Tenista') {
          const ack = await s.timeout(12000).emitWithAck('profile:update', {nickname: pendingNickname.current, audience: data.profile.audience, level: data.profile.level, color: data.profile.color}) as Ack<Profile>;
          if (ack.ok && ack.data) setProfile(ack.data);
          pendingNickname.current = ''; writeLocal('ace.nickname.v1');
        }
        const invitation = new URLSearchParams(location.search).get('sala');
        if (invitation && /^[A-F0-9]{10}$/.test(invitation) && !readRoom()) {
          const ack = await s.timeout(12000).emitWithAck('room:join', {code: invitation}) as Ack<{token: string; room: RoomView}>;
          if (ack.ok && ack.data) {
            sessionStorage.setItem('tennis.room.v1', JSON.stringify({code: ack.data.room.code, token: ack.data.token}));
            s.auth = {...s.auth, roomCode: ack.data.room.code, roomToken: ack.data.token};
            setRoom(ack.data.room); offset.current = ack.data.room.serverTime - Date.now();
          } else notify(ack.error ?? 'Não foi possível entrar no convite. Confira a sala.');
        }
      } catch {notify('Não foi possível concluir a entrada na sala. Tente novamente.');}
    });
    s.on('progress', (value: Progress) => setProgress(value));
    for (const event of ['match:state', 'point:resolved', 'match:finished', 'player:disconnected', 'player:reconnected']) s.on(event, update);
    s.on('room:closed', () => {setRoom(null); sessionStorage.removeItem('tennis.room.v1'); s.auth = {...s.auth, roomCode: undefined, roomToken: undefined}; notify('Sala encerrada. Você pode começar outra partida.');});
    s.on('resume:failed', (message: string) => {sessionStorage.removeItem('tennis.room.v1'); s.auth = {...s.auth, roomCode: undefined, roomToken: undefined}; setRoom(null); notify(message);});
    setSocket(s); s.connect();
    const versionTimer = setInterval(checkVersion, 30_000);
    window.addEventListener('focus', checkVersion); document.addEventListener('visibilitychange', checkVersion);
    return () => {s.disconnect(); clearTimeout(toastTimer.current); clearInterval(versionTimer); window.removeEventListener('focus', checkVersion); document.removeEventListener('visibilitychange', checkVersion);};
  }, [accessToken, visitor]);
  const request = async <T,>(event: string, data: unknown = {}): Promise<T | undefined> => {
    if (!socket?.connected) {notify('Conectando ao servidor. Aguarde um instante.'); return;}
    try {const ack = await socket.timeout(12000).emitWithAck(event, data) as Ack<T>; if (!ack.ok) {notify(ack.error ?? 'Não foi possível concluir.'); return;} return ack.data;}
    catch {notify('O servidor não respondeu. Confira sua conexão.');}
  };
  async function openRoom(mode: RoomView['mode'], scenarioId?: string) {
    setBusy(true); const data = await request<{token: string; room: RoomView}>('room:create', {mode, seconds: mode === 'duel' ? seconds || 5 : seconds, scenarioId, botStyle});
    if (data) saveRoom(data); setBusy(false);
  }
  function saveRoom(data: {token: string; room: RoomView}) {
    sessionStorage.setItem('tennis.room.v1', JSON.stringify({code: data.room.code, token: data.token}));
    if (socket) socket.auth = {...socket.auth, roomCode: data.room.code, roomToken: data.token};
    setRoom(data.room); offset.current = data.room.serverTime - Date.now();
  }
  async function joinRoom() {setBusy(true); const data = await request<{token: string; room: RoomView}>('room:join', {code: joinCode.replace(/\s/g, '').toUpperCase()}); if (data) saveRoom(data); setBusy(false);}
  async function leave() {if (!await request<boolean>('room:leave')) return; setRoom(null); setReplay(null); sessionStorage.removeItem('tennis.room.v1'); if (socket) socket.auth = {...socket.auth, roomCode: undefined, roomToken: undefined};}
  async function saveProfile(value: Profile) {
    const saved = await request<Profile>('profile:update', {nickname: value.nickname, audience: value.audience, level: value.level, color: value.color});
    if (saved) {setProfile(saved); setSeconds(LEVEL_SECONDS[saved.level]); setProfileOpen(false); notify(account.session ? 'Perfil salvo na sua conta. Bons pontos!' : 'Perfil salvo neste navegador. Bons pontos!');}
  }
  function navigate(value: Page) {if (!room) setPage(value);}
  function enterGuest(name: string) {pendingNickname.current = name; writeLocal('ace.nickname.v1', name); writeLocal('ace.entry.v1', 'guest'); setVisitor(true);}
  async function signOut() {
    if (room) {notify('Saia da quadra antes de trocar de acesso.'); return;}
    setVisitor(false);
    if (!await account.signOut()) {setVisitor(true); return;}
    writeLocal('tennis.profile.v1'); writeLocal('ace.entry.v1'); sessionStorage.removeItem('tennis.room.v1');
    setRoom(null); setProfile(DEFAULT_PROFILE); setProgress({...EMPTY_PROGRESS, profile: DEFAULT_PROFILE});
  }
  if (!visitor && !accessToken) return <Welcome onGuest={enterGuest} onGoogle={() => {void account.signIn();}} googleEnabled={account.enabled} loading={account.loading} error={account.error} onRetry={account.retry} invitation={new URLSearchParams(location.search).has('sala')}/>;
  const inGame = !!room?.state;
  return <>
    <header className={inGame ? 'app-header game-header' : 'app-header'}>
      <button className="brand" onClick={() => navigate('home')} aria-label="Tennis Tático — início"><span className="brand-icon"><span/></span><span>TENNIS<span className="brand-light">TÁTICO</span><small>ARENA DE ESTRATÉGIAS</small></span></button>
      <nav aria-label="Navegação principal">{([{id: 'home', label: 'Visão geral', icon: Home}, {id: 'academy', label: 'Academia', icon: Layers3}, {id: 'duel', label: 'Duelo', icon: Users}, {id: 'progress', label: 'Meu progresso', icon: TrendingUp}] as const).map(item => <button key={item.id} className={!room && page === item.id ? 'active' : ''} disabled={!!room} onClick={() => navigate(item.id)}><item.icon size={17}/><span>{item.label}</span></button>)}</nav>
      <div className="header-end"><span className={`network-dot ${online ? 'connected' : ''}`} title={online ? 'Servidor conectado' : 'Reconectando'}/><button className="icon-button settings-button" onClick={() => setProfileOpen(true)} aria-label="Configurações" disabled={!!room}><Settings2 size={19}/></button><button className="profile-button" disabled={!!room} onClick={() => setProfileOpen(true)}><span className="avatar" style={{background: profile.color}}>{profile.nickname.slice(0, 1).toUpperCase()}</span><span>{profile.nickname}<small>{profile.audience === 'child' ? 'Perfil infantil' : 'Seu espaço de treino'}</small></span></button></div>
    </header>
    {!room && <div className="account-bar"><span><ShieldCheck size={15}/>{account.session ? 'Conta conectada · ' + (account.session.user.email ?? profile.nickname) : 'Visitante · progresso neste navegador'}</span>{account.session ? <button className="text-button" onClick={() => {void signOut();}}>Sair da conta <LogOut size={15}/></button> : <button className="text-button" disabled={!account.enabled || account.loading} onClick={() => {void account.signIn();}}><GoogleMark/> Salvar com Google</button>}</div>}
    {account.error && <div className="account-error" role="status">{account.error}</div>}
    {!online && <div className="connection-banner" role="status"><Wifi size={16}/> {room ? 'Reconectando… sua partida fica pausada por até 30 segundos.' : connectionError || 'Conectando à quadra… o primeiro acesso pode levar cerca de um minuto.'}</div>}
    <main className={inGame ? 'main game-main' : 'main'}>
      {needsUpdate || hasUnknownShot(room?.state ?? null) ? <RecoveryPanel update/> : room ? room.state ? <Game room={room} profile={profile} request={request} leave={leave} offset={offset.current} notify={notify} replay={replay} setReplay={setReplay}/> : <Lobby room={room} request={request} leave={leave} notify={notify} inviteOrigin={inviteOrigin}/> : <>
        {page === 'home' && <>
          <div className="page-heading"><div><p className="eyebrow"><span/> SUA QUADRA DE APRENDIZADO</p><h1>Bom jogo começa com boas decisões.</h1><p>Treine o olhar. Encontre o espaço. Pense no próximo ponto.</p></div><button className="text-button" onClick={() => setHelp(true)}><CircleHelp size={17}/> Como funciona <ArrowUpRight size={16}/></button></div>
          <section className="hero">
            <div className="hero-copy"><div className="pill"><span className="tiny-ball"/> MENOS FORÇA. MAIS ESTRATÉGIA.</div><h2>O próximo ponto<br/>começa na<br/><em>sua cabeça.</em></h2><p>Escolha seu golpe, encontre sua posição e descubra como cada decisão muda o jogo.</p><button className="button lime" onClick={() => setPage('academy')}>Entrar na academia <ArrowUpRight size={19}/></button><div className="hero-meta"><span><Check size={14}/> No seu ritmo</span><span><Check size={14}/> Aprenda jogando</span></div></div>
            <div className="hero-visual"><div className="court-overline"><span className="live-dot"/> O JOGO É SEU. A DECISÃO TAMBÉM.</div><HeroCourt/><div className="court-caption"><span className="caption-icon"><Crosshair size={20}/></span><span><strong>Enxergue além da bola.</strong><small>O espaço também faz parte da jogada.</small></span><span className="mini-coordinates">23,77 × 8,23 m</span></div></div>
          </section>
          <div className="section-heading"><h2>Escolha como entrar em quadra</h2><span>Três formas de evoluir seu jogo</span></div>
          <div className="mode-grid">
            <ModeCard number="01" icon={<Layers3/>} label="APRENDA NO SEU RITMO" title="Academia Tática" description="12 situações reais de jogo. Teste escolhas e entenda o porquê de cada resultado." badge="INDIVIDUAL" tone="green" onClick={() => setPage('academy')} footer="Começar um treino"/>
            <ModeCard number="02" icon={<Zap/>} label="COLOQUE EM PRÁTICA" title="Desafie o computador" description="Três estilos de adversário para você construir pontos e afinar sua estratégia." badge="CONTRA A MÁQUINA" tone="orange" onClick={() => setPage('computer')} footer="Escolher adversário"/>
            <ModeCard number="03" icon={<Users/>} label="DOIS JOGADORES. UMA QUADRA." title="Duelo Tático" description="Compartilhe um convite e dispute um tie-break de decisões em tempo real." badge="DUELO PRIVADO" tone="purple" onClick={() => setPage('duel')} footer="Criar ou entrar em sala"/>
          </div>
          <section className="bottom-strip"><div className="strip-label"><TrendingUp size={20}/><span>SEU JOGO, EM EVOLUÇÃO</span></div><div><strong>{progress.completed.length}<small> / 12</small></strong><span>treinos concluídos</span></div><div><strong>{progress.shotIQ ?? '—'}<small>{progress.shotIQ !== null ? '/100' : ''}</small></strong><span>QI de Golpes</span></div><div><strong>{progress.positionIQ ?? '—'}<small>{progress.positionIQ !== null ? '/100' : ''}</small></strong><span>QI de Posicionamento</span></div><button className="text-button" onClick={() => setPage('progress')}>Ver meu progresso <ArrowRight size={17}/></button></section>
        </>}
        {page === 'academy' && <>
          <PageTitle eyebrow="UM PONTO DE CADA VEZ" title="Sua inteligência entra em quadra." description="Leia a situação, escolha o golpe e toque na quadra para planejar sua recuperação."/>
          <div className="academy-toolbar"><div><BookOpen size={20}/><strong>Academia Tática</strong><span className="tag">{progress.completed.length} de 12 concluídos</span></div><TimeSelect seconds={seconds} setSeconds={setSeconds}/></div>
          <div className="scenario-grid">{SCENARIOS.map((s, i) => <button className="scenario-card" key={s.id} onClick={() => openRoom('academy', s.id)} disabled={busy || !online}><div className="scenario-top"><span className="scenario-number">{String(i + 1).padStart(2, '0')}</span><span className="scenario-category">{s.category}</span>{progress.completed.includes(s.id) ? <CheckCheck className="completed-icon" size={20}/> : <span className="difficulty">{Array.from({length: 3}, (_, n) => <i key={n} className={n < s.difficulty ? 'on' : ''}/>)}</span>}</div><MiniCourt scenario={s}/><h3>{s.title}</h3><p>{s.objective}</p><div className="scenario-footer"><span>{['', 'Fundamentos', 'Intermediário', 'Avançado'][s.difficulty]}</span><span>Treinar <ArrowUpRight size={16}/></span></div></button>)}</div>
        </>}
        {page === 'computer' && <>
          <PageTitle eyebrow="LABORATÓRIO DE ESTRATÉGIA" title="Um rival. Três jeitos de pensar." description="Dispute um tie-break até 7, com dois pontos de vantagem. Seu adversário segue as mesmas regras que você."/>
          <div className="bot-grid">{([{id: 'consistent', name: 'Alex', style: 'Consistente', description: 'Profundidade, margem e paciência. Construa a vantagem antes de acelerar.', icon: ShieldCheck, color: 'green'}, {id: 'aggressive', name: 'Ícaro', style: 'Agressivo', description: 'Ângulos e iniciativa. Explore o espaço que ele deixa ao buscar o winner.', icon: Zap, color: 'orange'}, {id: 'defensive', name: 'Lia', style: 'Defensiva', description: 'Altura e recuperação. Prepare-se para ganhar o mesmo ponto mais de uma vez.', icon: Target, color: 'purple'}] as const).map(bot => <button className={`bot-card ${bot.color} ${botStyle === bot.id ? 'selected' : ''}`} key={bot.id} onClick={() => setBotStyle(bot.id)} aria-pressed={botStyle === bot.id}><span className="bot-avatar"><bot.icon size={44}/></span><small>SEU ADVERSÁRIO</small><h2>{bot.name}</h2><span className="tag">{bot.style}</span><p>{bot.description}</p><span className="select-circle">{botStyle === bot.id && <Check size={16}/>}</span></button>)}</div>
          <div className="start-bar"><TimeSelect seconds={seconds} setSeconds={setSeconds}/><button className="button dark" disabled={busy || !online} onClick={() => openRoom('computer')}>Entrar em quadra <ArrowRight size={18}/></button></div>
        </>}
        {page === 'duel' && <>
          <PageTitle eyebrow="ESTRATÉGIA A DOIS" title="Seu parceiro está a um convite." description="Uma sala privada, dois jogadores e um tie-break até 7. Compartilhe o link com seu amigo."/>
          <div className="duel-grid"><section className="duel-card create-card"><Users size={32}/><p className="eyebrow">SEJA O ANFITRIÃO</p><h2>Chame alguém<br/>para a quadra.</h2><p>Crie uma sala e compartilhe o código. A partida começa quando os dois estiverem prontos.</p><TimeSelect seconds={seconds || 5} setSeconds={setSeconds} duel/><button className="button lime" disabled={busy || !online} onClick={() => openRoom('duel')}><Plus size={18}/> Criar duelo privado</button></section><section className="duel-card join-card"><div className="outlined-icon"><Flag size={28}/></div><p className="eyebrow">JÁ RECEBEU UM CONVITE?</p><h2>Sua vaga está<br/>reservada.</h2><p>Digite o código de 10 caracteres que aparece na tela de quem criou a sala.</p><label htmlFor="room-code">CÓDIGO DA SALA</label><input id="room-code" className="code-input" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 10))} placeholder="A1B2C3D4E5" autoComplete="off" autoCapitalize="characters"/><button className="button dark" disabled={busy || joinCode.length !== 10 || !online} onClick={joinRoom}>Entrar no duelo <ArrowRight size={18}/></button></section></div>
          <div className="privacy-note"><ShieldCheck size={18}/><span>Seu amigo pode entrar como visitante. Só o apelido e os dados desta partida aparecem no duelo.</span></div>
        </>}
        {page === 'progress' && <>
          <PageTitle eyebrow="CADA DECISÃO DEIXA UM APRENDIZADO" title="O seu jogo está tomando forma." description="Indicadores calculados a partir dos seus pontos. São pistas para treinar, não medidas científicas de inteligência."/>
          <div className="stat-grid"><Stat icon={<Layers3/>} label="Treinos concluídos" value={`${progress.completed.length} / 12`}/><Stat icon={<Crosshair/>} label="QI de Golpes" value={progress.shotIQ === null ? '—' : `${progress.shotIQ}/100`}/><Stat icon={<Target/>} label="QI de Posicionamento" value={progress.positionIQ === null ? '—' : `${progress.positionIQ}/100`}/><Stat icon={<Flag/>} label="Pontos registrados" value={String(progress.points)}/></div>
          {progress.points === 0 ? <div className="empty-state"><span className="empty-icon"><TrendingUp size={38}/></span><h2>Seu primeiro ponto é o ponto de partida.</h2><p>Faça um exercício para começar a descobrir como você escolhe golpes e ocupa a quadra.</p><button className="button dark" onClick={() => setPage('academy')}>Começar na academia <ArrowRight size={17}/></button></div> : <div className="progress-columns"><section className="panel"><h2>Seu próximo foco</h2><p className="muted">Situações com mais espaço para evoluir</p>{progress.weaknesses.map(w => <div className="weakness" key={w.label}><span>{SCENARIOS.find(s => s.id === w.label)?.title ?? w.label}<small>{w.count} decisões registradas</small></span><strong>{w.score}<small>/100</small></strong></div>)}</section><section className="panel"><h2>Histórico da quadra</h2><p className="muted">Treinos e partidas finalizadas · últimos 30</p>{progress.history.length === 0 && <p>Finalize um ponto da academia ou um tie-break para registrar uma sessão.</p>}{progress.history.map(h => <button className="history-row" key={h.id} onClick={async () => {const points = await request<any[]>('replay:get', {id: h.id}); if (points?.length) {setReplay(points.flatMap(p => p.decisions)); setHelp(true);}}}><span className="history-icon">{h.mode === 'academy' ? <BookOpen size={18}/> : <Trophy size={18}/>}</span><span><strong>{MODE_LABEL[h.mode]}</strong><small>{new Date(h.createdAt).toLocaleString('pt-BR')} · média de {h.rallies} golpes</small></span><b>{h.score.join(' : ')}</b><Play size={16}/></button>)}</section></div>}
        </>}
      </>}
    </main>
    {!room && progress.points > 0 && <aside className="beta-invite"><div><p className="eyebrow">DA ESTRATÉGIA PARA A QUADRA</p><strong>Quer conhecer melhor suas partidas reais?</strong><p>Conheça os apps Ace Stats para celular e relógio e participe dos testes, se quiser.</p></div><a className="button outline" href={SITE_URL + '/android?origem=jogo'}>App Android <ArrowUpRight size={16}/></a><a className="text-button" href={SITE_URL + '/watch?origem=jogo'}>Tenho relógio Wear OS <ArrowUpRight size={16}/></a></aside>}
    {!inGame && <footer className="app-footer"><span><span className="mini-ball"/> TENNIS TÁTICO <span className="footer-divider">/</span> Uma experiência Ace Stats.</span><span><a href={SITE_URL + "/jogo"}>Sobre o jogo</a> · <a href={SITE_URL + "/privacy"}>Privacidade</a></span></footer>}
    {profileOpen && <ProfileModal profile={profile} onClose={() => setProfileOpen(false)} save={saveProfile}/>}
    {help && <div className="modal-backdrop"><section className={`modal ${replay ? 'replay-modal' : ''}`} role="dialog" aria-modal="true" aria-label={replay ? 'Replay da sessão' : 'Como jogar'}><button className="close-button" onClick={() => {setHelp(false); setReplay(null);}} aria-label="Fechar"><X/></button>{replay ? <><p className="eyebrow">HISTÓRICO REAL DA SESSÃO</p><h2>Veja o ponto de novo.</h2><Suspense fallback={<p>Preparando quadra…</p>}><Court room={null} target={null} onSelect={() => {}} replay={replay} replayKey={0}/></Suspense><p className="muted">{replay.length} decisões · trajetórias e posições registradas pelo servidor</p></> : <><span className="modal-icon"><Crosshair size={30}/></span><h2>Pense. Bata. Recupere.</h2><p>Você controla a estratégia. A execução e o movimento são calculados pelo motor do jogo.</p><ol className="help-steps"><li><b>Leia a bola.</b> Observe a posição do rival, a direção e a dificuldade.</li><li><b>Escolha o golpe.</b> As opções mudam conforme a situação.</li><li><b>Toque na quadra.</b> Marque sua recuperação ou use um dos destinos sugeridos.</li><li><b>Confirme e aprenda.</b> Ao fim do ponto, veja a cobertura, os riscos e uma alternativa.</li></ol><p className="info-note">Os indicadores e riscos são parâmetros educacionais do jogo, sem pretensão científica.</p><button className="button dark" onClick={() => setHelp(false)}>Entendi. Vamos jogar <ArrowRight size={17}/></button></>}</section></div>}
    {toast && <div className="toast" role="status">{toast}<button onClick={() => setToast('')} aria-label="Dispensar aviso"><X size={16}/></button></div>}
  </>;
}
function PageTitle({eyebrow, title, description}: {eyebrow: string; title: string; description: string}) {return <div className="page-heading large"><div><p className="eyebrow"><span/>{eyebrow}</p><h1>{title}</h1><p>{description}</p></div></div>;}
function Stat({icon, label, value}: {icon: React.ReactNode; label: string; value: string}) {return <div className="stat-card"><span>{icon}</span><small>{label}</small><strong>{value}</strong></div>;}
function ModeCard(props: {number: string; icon: React.ReactNode; label: string; title: string; description: string; badge: string; tone: string; onClick: () => void; footer: string}) {return <button className={`mode-card ${props.tone}`} onClick={props.onClick}><div className="mode-card-top"><span className="mode-icon">{props.icon}</span><span className="mode-number">/{props.number}</span></div><small>{props.label}</small><h3>{props.title}</h3><p>{props.description}</p><div className="mode-card-bottom"><span className="mode-badge">{props.badge}</span><span className="mode-arrow" aria-label={props.footer}><ArrowUpRight size={22}/></span></div></button>;}
function TimeSelect({seconds, setSeconds, duel = false}: {seconds: number; setSeconds: (n: number) => void; duel?: boolean}) {return <label className="time-select"><Clock3 size={17}/><span>Tempo por decisão</span><select aria-label="Tempo por decisão" value={seconds} onChange={e => setSeconds(Number(e.target.value))}>{!duel && <option value={0}>Livre · modo estudo</option>}<option value={8}>8s · iniciante</option><option value={5}>5s · intermediário</option><option value={3}>3s · avançado</option></select></label>;}
function ProfileModal({profile, save, onClose}: {profile: Profile; save: (p: Profile) => void; onClose: () => void}) {
  const [draft, setDraft] = useState(profile);
  return <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="profile-title"><button className="close-button" onClick={onClose} aria-label="Fechar configurações"><X/></button><p className="eyebrow">SEU JEITO DE ENTRAR EM QUADRA</p><h2 id="profile-title">Vamos personalizar?</h2><form onSubmit={e => {e.preventDefault(); save(draft);}}><label className="field">Como podemos chamar você?<input value={draft.nickname} onChange={e => setDraft({...draft, nickname: e.target.value})} maxLength={20} minLength={1} required autoComplete="nickname"/></label><label className="field">Linguagem do treinador<select value={draft.audience} onChange={e => setDraft({...draft, audience: e.target.value as Profile['audience']})}><option value="adult">Adulto · análise tática</option><option value="child">Infantil · aprender brincando</option></select></label><label className="field">Seu ritmo de decisão<select value={draft.level} onChange={e => setDraft({...draft, level: e.target.value as Profile['level']})}><option value="study">Modo estudo · sem cronômetro</option><option value="beginner">Iniciante · 8 segundos</option><option value="intermediate">Intermediário · 5 segundos</option><option value="advanced">Avançado · 3 segundos</option></select></label><span className="field-label">Sua cor na quadra</span><div className="color-options">{['#ddeb78', '#f0a878', '#86c9ef', '#cca7ef', '#f2a9c0'].map((color, index) => <button type="button" key={color} className={draft.color === color ? 'chosen' : ''} style={{background: color}} onClick={() => setDraft({...draft, color})} aria-label={['Verde', 'Laranja', 'Azul', 'Roxo', 'Rosa'][index]} aria-pressed={draft.color === color}>{draft.color === color && <Check size={19}/>}</button>)}</div><p className="info-note"><ShieldCheck size={17}/> Seu histórico é privado e fica associado ao seu acesso. No duelo, seu amigo vê seu apelido, sua cor e os dados daquela partida.</p><button className="button dark full-width" type="submit">Salvar meu perfil <Check size={17}/></button></form></section></div>;
}
function Lobby({room, request, leave, notify, inviteOrigin}: {room: RoomView; request: (event: string, data?: unknown) => Promise<unknown>; leave: () => void; notify: (s: string) => void; inviteOrigin: string}) {
  const link = `${inviteOrigin}/?sala=${room.code}`;
  async function copy(text: string) {try {await navigator.clipboard.writeText(text); notify('Convite copiado.');} catch {notify('Neste navegador, selecione e copie o link exibido abaixo.');}}
  return <div className="lobby"><button className="text-button" onClick={leave}><ArrowLeft size={17}/> Sair da sala</button><div className="lobby-content"><p className="eyebrow">DUELO TÁTICO · SALA PRIVADA</p><h1>A quadra está reservada.</h1><p>Compartilhe o convite. Prepare sua melhor estratégia.</p><div className="room-code-display"><small>CÓDIGO DA SALA</small><strong>{room.code}</strong><button className="icon-button" onClick={() => copy(room.code)} aria-label="Copiar código"><Copy size={20}/></button></div><div className="invite-box"><input readOnly value={link} aria-label="Link de convite" onFocus={e => e.target.select()}/><button onClick={() => copy(link)}><Copy size={17}/> Copiar link</button></div>{location.hostname === 'localhost' && <p className="info-note">No iPad, use o IP do computador no lugar de localhost. O terminal mostra o endereço da rede.</p>}<div className="lobby-players">{[0, 1].map(i => {const m = room.members[i]; return <div key={i} className={`lobby-player ${!m ? 'waiting' : ''}`}><span className="lobby-player-avatar" style={{background: m?.color}}>{m ? m.name[0].toUpperCase() : <Plus size={25}/>}</span><strong>{m?.name ?? 'Aguardando rival'}</strong><small>{m ? m.connected ? m.ready ? 'Pronto para jogar' : 'Escolhendo estratégia…' : 'Reconectando…' : 'Compartilhe o código da sala'}</small>{m?.ready && <CheckCheck size={20}/>}</div>;})}</div><TimeSelect seconds={room.seconds} setSeconds={n => {if (room.me === 0) request('room:settings', {seconds: n});}} duel/>{room.me !== 0 && <p className="muted">O anfitrião configura o tempo da sala.</p>}<div className="lobby-actions"><button className="button outline" onClick={() => request('room:ready', {ready: !room.members[room.me].ready})}>{room.members[room.me].ready ? 'Retirar pronto' : 'Estou pronto'} <Check size={17}/></button>{room.me === 0 && <button className="button dark" disabled={room.members.length < 2 || !room.members.every(m => m.ready && m.connected)} onClick={() => request('match:start')}>Iniciar tie-break <Play size={17}/></button>}</div></div></div>;
}
function Game({room, profile, request, leave, offset, notify, replay, setReplay}: {room: RoomView; profile: Profile; request: <T>(event: string, data?: unknown) => Promise<T | undefined>; leave: () => void; offset: number; notify: (s: string) => void; replay: Decision[] | null; setReplay: (v: Decision[] | null) => void}) {
  const s = room.state!, mine = room.me, me = s.players[mine];
  const [target, setTarget] = useState<Vec | null>(null), [shot, setShot] = useState<ShotId | null>(null), [serveType, setServeType] = useState('kick'), [now, setNow] = useState(Date.now()), [sending, setSending] = useState(false), [replayKey, setReplayKey] = useState(0), [showHistory, setShowHistory] = useState(false);
  useEffect(() => {const timer = setInterval(() => setNow(Date.now()), 80); return () => clearInterval(timer);}, []);
  useEffect(() => {setTarget(null); setShot(null); setSending(false); setReplay(null);}, [s.turnId]);
  const review = s.phase === 'POINT_REVIEW' || s.phase === 'MATCH_FINISHED';
  const myTurn = s.turn === mine && ['RECEIVER_POSITION', 'SERVE_DECISION', 'SHOT_DECISION'].includes(s.phase) && !room.paused;
  const remaining = s.deadline ? Math.max(0, (s.deadline - (now + offset)) / 1000) : null;
  const scenario = SCENARIOS.find(x => x.id === s.scenarioId);
  const myDecisions = s.decisions.filter(d => d.player === mine), decision = myDecisions.find(d => d.shot.startsWith('volley-') && !d.automatic) ?? myDecisions.find(d => !d.automatic) ?? myDecisions[0];
  const mean = (field: 'shotIQ' | 'positionIQ') => myDecisions.length ? Math.round(myDecisions.reduce((n, d) => n + d[field], 0) / myDecisions.length) : null;
  const allDecisions = s.points.flatMap(p => p.decisions).filter(d => d.player === mine);
  const matchMean = (field: 'shotIQ' | 'positionIQ') => allDecisions.length ? Math.round(allDecisions.reduce((n, d) => n + d[field], 0) / allDecisions.length) : '—';
  const serve = s.phase === 'SERVE_DECISION', setup = s.phase === 'RECEIVER_POSITION', moving = s.phase === 'BALL_ANIMATION';
  const decisionTitle = scenario && s.rally === 1 ? scenario.title
    : setup ? myTurn ? 'Onde você espera a bola?' : 'O rival está se posicionando.'
    : serve ? myTurn ? 'Comece com intenção.' : 'Prepare-se para o saque.'
    : myTurn ? 'Qual é a sua próxima bola?' : 'Antecipe o próximo espaço.';
  const decisionDescription = setup
    ? 'Toque no seu lado da quadra, inclusive atrás da linha de fundo, e confirme.'
    : serve
      ? `${s.serveAttempt === 1 ? 'Primeiro' : 'Segundo'} serviço · lado de ${s.serveSide === 'deuce' ? 'igualdade' : 'vantagem'}. ${s.serveAttempt === 2 ? 'Uma nova falta encerra o ponto.' : 'Escolha direção, efeito e recuperação.'}`
      : myTurn
        ? scenario?.objective ?? 'Escolha o golpe e a posição que deseja proteger depois de bater.'
        : 'Observe onde o adversário está e como ele constrói a jogada.';
  async function confirm() {
    if (!target || (!setup && !shot)) return;
    setSending(true);
    const result = await request(setup ? 'receiver:position' : serve ? 'serve:commit' : 'shot:commit', {id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, turnId: s.turnId, target, ...(shot ? {shot} : {}), ...(serve ? {serveType} : {})});
    if (!result) setSending(false);
  }
  return <>
    <div className={review && !room.paused ? 'game-stage game-review' : 'game-stage'}>
    <div className="game-top"><button className="text-button" onClick={leave}><LogOut size={16}/><span>Sair da quadra</span></button><span className="game-mode"><span className="live-dot"/>{MODE_LABEL[room.mode]}<b>{scenario?.category ?? `TIE-BREAK ATÉ 7 · SALA ${room.code}`}</b></span><button className={`text-button ${showHistory ? 'selected' : ''}`} aria-expanded={showHistory} onClick={() => setShowHistory(!showHistory)}><Layers3 size={16}/> Histórico</button></div>
    <div className="scoreboard"><div className="score-player"><span className="player-dot" style={{background: s.players[0].color}}/><span>{s.players[0].name}<small>{mine === 0 ? 'VOCÊ' : 'ADVERSÁRIO'}</small></span>{s.server === 0 && <span className="serve-ball" title="Sacador"/>}</div><div className="score-numbers"><strong>{s.score[0]}</strong><span>:</span><strong>{s.score[1]}</strong></div><div className="score-player right">{s.server === 1 && <span className="serve-ball" title="Sacador"/>}<span>{s.players[1].name}<small>{mine === 1 ? 'VOCÊ' : 'ADVERSÁRIO'}</small></span><span className="player-dot" style={{background: s.players[1].color}}/></div></div>
    <p className="rotation-tip"><Smartphone size={15} aria-hidden="true"/> Vire o celular para ver a quadra ao lado dos controles.</p>
    <div className="game-layout"><section className="court-panel"><div className="court-panel-top"><span><i/> {review ? 'REVISÃO DO PONTO' : moving ? 'BOLA EM JOGO' : myTurn ? 'SUA DECISÃO' : 'VEZ DO ADVERSÁRIO'}</span><span>PONTO {s.pointNumber + (review ? 0 : 1)} <b>·</b> {s.rally} GOLPES</span></div><Suspense fallback={<div className="court-loading">Preparando sua quadra…</div>}><Court room={room} target={target} onSelect={p => {if (myTurn) setTarget(p);}} replay={replay} replayKey={replayKey}/></Suspense><div className="court-legend"><span><i className="legend-you"/> Você</span><span><i className="legend-destination"/> Recuperação</span><span><i className="legend-ball"/> Bola</span></div><div className="court-instruction">{review ? 'Tracejado claro: cobertura sugerida · região vermelha: espaço exposto' : myTurn ? 'Toque no seu lado da quadra para marcar a posição desejada' : 'Observe a trajetória e antecipe a próxima resposta'}</div></section>
      <aside className="decision-panel">
        {room.paused ? <div className="paused-content"><Wifi size={34}/><p className="eyebrow">PARTIDA PAUSADA</p><h2>Esperando reconexão.</h2><p>O cronômetro e a simulação estão pausados.</p><strong>{room.canAbandon ? 'Prazo encerrado' : `${Math.max(0, Math.ceil(((room.reconnectUntil ?? 0) - now - offset) / 1000))}s para retornar`}</strong>{room.canAbandon && <button className="button dark" onClick={() => request('match:abandon')}>Encerrar sala</button>}</div> : review ? <>
          <div className="review-result"><span className="result-icon">{s.winner === mine ? <Trophy size={27}/> : <Flag size={27}/>}</span><p className="eyebrow">{s.phase === 'MATCH_FINISHED' ? 'TIE-BREAK ENCERRADO' : 'PONTO ENCERRADO'}</p><h2>{s.phase === 'MATCH_FINISHED' ? s.score[mine] > s.score[mine === 0 ? 1 : 0] ? 'A partida é sua.' : 'Um jogo de aprendizado.' : s.winner === mine ? 'Esse ponto é seu.' : `Ponto de ${s.players[s.winner!].name.split(' · ')[0]}.`}</h2><p>{s.reason} <span>·</span> {s.rally} golpes</p></div>
          <div className="review-details">
          {s.phase === 'MATCH_FINISHED' && <div className="match-totals"><span><b>{s.points.length}</b>pontos</span><span><b>{(s.points.reduce((n, p) => n + p.decisions.length, 0) / Math.max(1, s.points.length)).toFixed(1)}</b>golpes / rally</span></div>}
          <div className="iq-row"><div><small>QI DE GOLPES</small><strong>{s.phase === 'MATCH_FINISHED' ? matchMean('shotIQ') : mean('shotIQ') ?? '—'}<span>/100</span></strong></div><div><small>QI DE POSICIONAMENTO</small><strong>{s.phase === 'MATCH_FINISHED' ? matchMean('positionIQ') : mean('positionIQ') ?? '—'}<span>/100</span></strong></div></div>
          <section className="coach-note"><div><Sparkles size={17}/><strong>{profile.audience === 'child' ? 'Dica do treinador' : 'Uma leitura do ponto'}</strong></div>{decision ? <><p>{profile.audience === 'child' ? TacticalCoach.child(decision) : decision.explanation}</p><span className="coach-alternative"><ArrowUpRight size={16}/>{profile.audience === 'child' ? 'Jogue de novo e teste uma posição diferente!' : decision.alternative}</span></> : <p>O ponto terminou antes de você bater. Observe o saque e experimente ajustar a posição de devolução no próximo ponto.</p>}</section>
          <small className="heuristic-note">Indicadores educacionais: uma boa escolha também pode terminar em erro de execução.</small>
          </div>
          <button className="button outline full-width" onClick={() => {setReplay(s.decisions); setReplayKey(n => n + 1);}} disabled={!s.decisions.length}><RotateCcw size={16}/> Rever trajetórias</button>
          {mine === 0 ? <button className="button dark full-width" onClick={() => request(s.phase === 'MATCH_FINISHED' ? 'match:rematch' : 'point:next')}>{s.phase === 'MATCH_FINISHED' ? 'Jogar revanche' : room.mode === 'academy' ? 'Repetir e experimentar' : 'Próximo ponto'}<ArrowRight size={17}/></button> : <p className="waiting-text">Aguardando o anfitrião continuar.</p>}
          {room.mode === 'academy' && <button className="text-button full-width" onClick={leave}>Escolher outro exercício <ChevronRight size={16}/></button>}
        </> : <>
          <div className="decision-header"><p className="eyebrow">{setup ? '01 · PREPARE A DEVOLUÇÃO' : serve ? `0${s.serveAttempt} · ESCOLHA O SAQUE` : 'LEIA. ESCOLHA. RECUPERE.'}</p><div className={`timer ${remaining !== null && remaining < 2 ? 'urgent' : ''}`}><Clock3 size={17}/>{moving ? 'Em jogo' : remaining === null ? 'Livre' : `${remaining.toFixed(1)}s`}</div>{myTurn && <details className="decision-help" key={s.turnId}>
            <summary>Dicas</summary>
            <div>
              <strong>{decisionTitle}</strong>
              <p>{decisionDescription}</p>
              {scenario && <p>{scenario.tip}</p>}
              {shot && <p>{SHOTS[shot].description}</p>}
            </div>
          </details>}</div>
          <h2>{decisionTitle}</h2>
          <p className="decision-description">{decisionDescription}</p>
          {s.ball && !setup && !serve && <div className="incoming-info"><Activity size={17}/><span>Recebendo <b>{SHOTS[s.ball.shot]?.label.toLowerCase() ?? 'bola recebida'}</b><small>{s.ball.contactType === 'volley' ? 'Antes do quique · voleio disponível' : s.ball.height === 'high' ? 'Trajetória alta' : s.ball.height === 'low' ? 'Trajetória baixa' : 'Altura média'} · {Math.round(s.ball.speed * 3.6)} km/h simulados</small></span><span className={`pressure ${s.ball.difficulty > .55 ? 'hard' : ''}`}>{s.ball.difficulty > .55 ? 'Sob pressão' : 'Com margem'}</span></div>}
          {myTurn && !setup && <div className="shot-options" role="group" aria-label="Escolha seu golpe">{s.options.map(id => {const def = SHOTS[id]; return <button key={id} className={`shot-option ${shot === id ? 'selected' : ''}`} onClick={() => setShot(id)} aria-pressed={shot === id}><span className="shot-option-icon">{def.height === 'high' ? <ArrowUpRight size={18}/> : <Crosshair size={18}/>}</span><span><strong>{profile.audience === 'child' ? def.childLabel : def.label}</strong><small>{def.description}</small></span><span className={`risk ${def.risk > .1 ? 'high-risk' : ''}`}>{def.risk > .1 ? 'Ousado' : 'Margem'}</span></button>;})}</div>}
          {myTurn && serve && <label className="serve-type">Tipo de saque<select value={serveType} onChange={e => setServeType(e.target.value)}><option value="kick">Kick · altura e margem</option><option value="slice">Slice · efeito lateral</option><option value="flat">Chapado · potência</option></select></label>}
          {myTurn ? <><div className="recovery-heading"><span><Target size={17}/>{setup ? 'Sua posição inicial' : 'Sua recuperação'}</span><small>{target ? `${target.x.toFixed(1)} / ${Math.abs(target.y).toFixed(1)} m` : 'Toque na quadra'}</small></div><div className="suggested-positions" role="group" aria-label="Destinos de recuperação">{[{label: 'Esquerda', x: -2.2, y: 12.6}, {label: 'Fundo', x: 0, y: 13.4}, {label: 'Direita', x: 2.2, y: 12.6}, ...(!setup ? [{label: 'À rede', x: (target?.x ?? me.position.x) * .4, y: 3.6}] : [])].map(p => <button key={p.label} onClick={() => setTarget({x: p.x * side(mine), y: p.y * side(mine)})}>{p.label}</button>)}</div><button className="button dark full-width confirm-button" disabled={sending || !target || (!setup && !shot)} onClick={confirm}>{setup ? 'Confirmar posição' : 'Confirmar jogada'}<Check size={18}/></button><p className="decision-footnote">{target ? 'O destino é seu plano. A velocidade limita até onde você chega.' : 'Marque uma posição para continuar.'} {room.seconds > 0 ? 'Sem resposta: defesa automática com penalidade.' : ''}</p></> : <div className="opponent-wait"><span className="waiting-orbit"><span className="tiny-ball"/></span><p>{moving ? 'Golpe e deslocamento em andamento…' : `${s.players[s.turn].name.split(' · ')[0]} está decidindo…`}</p><small>A próxima decisão pode ser sua.</small></div>}
          {scenario && <div className="scenario-tip"><Sparkles size={16}/><p>{scenario.tip}</p></div>}
        </>}
      </aside>
    </div>
    </div>
    {showHistory && <section className="point-history panel"><h2>O caminho da partida</h2>{s.points.length ? s.points.map(p => <button key={p.number} onClick={() => {setReplay(p.decisions); setReplayKey(n => n + 1); setShowHistory(false);}}><span>Ponto {p.number}</span><strong>{s.players[p.winner].name}</strong><span>{p.reason} · {p.decisions.length} golpes</span><b>{p.score.join(' : ')}</b><Play size={15}/></button>) : <p className="muted">O primeiro ponto está sendo construído.</p>}</section>}
  </>;
}
createRoot(document.getElementById('root')!).render(<RecoveryBoundary><App/></RecoveryBoundary>);
