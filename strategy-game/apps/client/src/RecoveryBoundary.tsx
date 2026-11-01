import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
export function RecoveryPanel({update = false}: {update?: boolean}) {
  return <section className="recovery-panel panel" role="alert">
    <span className="empty-icon"><RotateCcw size={32}/></span>
    <p className="eyebrow">TENNIS TÁTICO</p>
    <h1>{update ? 'Atualização do jogo disponível' : 'Vamos recuperar a quadra'}</h1>
    <p>{update ? 'Esta aba está com uma versão anterior do jogo. Atualize para carregar os golpes e a interface atuais.' : 'Ocorreu uma falha de exibição. Atualize a página para tentar retomar a sala.'}</p>
    <button className="button dark" onClick={() => location.reload()}><RotateCcw size={17}/>Atualizar e continuar</button>
    <small>Seu perfil e progresso salvo serão mantidos. A retomada da sala depende do prazo de reconexão.</small>
  </section>;
}
export class RecoveryBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() {return {failed: true};}
  componentDidCatch(error: Error, info: ErrorInfo) {console.error('Falha de exibição do jogo', error, info.componentStack);}
  render() {return this.state.failed ? <RecoveryPanel/> : this.props.children;}
}
