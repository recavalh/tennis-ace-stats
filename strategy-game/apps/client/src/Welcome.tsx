import {useState, type FormEvent} from 'react';
import {ArrowLeft, ArrowRight, Check, Crosshair, ShieldCheck, TrendingUp, Users} from 'lucide-react';
import {HeroCourt} from './CourtIllustrations';
import {SITE_URL} from './accounts';

export function GoogleMark() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.23-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59A6 6 0 0 1 12 5.96Z"/></svg>;
}

type Props = {onGuest: (name: string) => void; onGoogle: () => void; googleEnabled: boolean; loading: boolean; error: string; onRetry: () => void; invitation: boolean};
export default function Welcome({onGuest, onGoogle, googleEnabled, loading, error, onRetry, invitation}: Props) {
  const [name, setName] = useState('');
  function enter(event: FormEvent) {event.preventDefault(); onGuest(name.trim().slice(0, 20) || 'Tenista');}
  return <div className="welcome-shell">
    <header className="welcome-header"><a href={SITE_URL + '/jogo'} className="welcome-brand"><span className="brand-icon"><span/></span><span>ACE STATS<small>TENNIS TÁTICO</small></span></a><a className="text-button" href={SITE_URL + '/jogo'}><ArrowLeft size={16}/> Conhecer o jogo</a></header>
    <main className="welcome-main">
      <section className="welcome-copy"><p className="eyebrow"><span/> SUA QUADRA ESTÁ ABERTA</p><h1>O próximo ponto<br/>começa na<br/><em>sua cabeça.</em></h1><p className="welcome-description">Treine decisões, explore os espaços da quadra e desafie seu parceiro de tênis.</p><div className="welcome-illustration"><HeroCourt/></div><div className="welcome-benefits"><span><Crosshair size={17}/> Treine sozinho</span><span><Users size={17}/> Convide um amigo</span><span><TrendingUp size={17}/> Acompanhe sua evolução</span></div></section>
      <section className="entry-card" aria-labelledby="entry-title"><span className="entry-pill"><span className="tiny-ball"/> GRÁTIS · DIRETO NO NAVEGADOR</span><h2 id="entry-title">{invitation ? 'Seu amigo chamou. Vamos jogar?' : 'Como você quer entrar?'}</h2><p>{invitation ? 'Seu convite está guardado. Escolha como entrar para ir à sala.' : 'Experimente um treino ou entre com sua conta para continuar de onde parou.'}</p>
        <form onSubmit={enter}><label className="field" htmlFor="guest-name">Seu apelido <span className="optional-label">(opcional)</span><input id="guest-name" name="nickname" autoComplete="nickname" maxLength={20} placeholder="Como podemos chamar você?" value={name} onChange={event => setName(event.target.value)}/></label><button className="button lime full-width" type="submit">Jogar como visitante <ArrowRight size={18}/></button></form>
        <p className="entry-caption"><Check size={14}/> Seu progresso fica associado a este navegador.</p><div className="entry-divider"><span/>ou<span/></div>
        <button className="button google-button full-width" disabled={loading || !googleEnabled} onClick={onGoogle}><GoogleMark/>{loading ? 'Preparando acesso…' : 'Entrar com Google'}</button>
        <p className="entry-caption">Com uma conta, continue seus treinos em outros dispositivos.</p>
        {!loading && !googleEnabled && !error && <p className="entry-notice">O acesso com Google estará disponível em breve. Você já pode jogar como visitante.</p>}
        {error && <div className="entry-error" role="status"><p>{error}</p><button className="text-button" onClick={onRetry}>Tentar conectar novamente</button></div>}
        <div className="entry-privacy"><ShieldCheck size={17}/><p>Seu histórico é privado. No duelo, seu amigo vê seu apelido e os dados daquela partida. <a href={SITE_URL + '/privacy'}>Privacidade</a></p></div>
      </section>
    </main><footer className="welcome-footer">Ace Stats · Um ponto de cada vez.</footer>
  </div>;
}
