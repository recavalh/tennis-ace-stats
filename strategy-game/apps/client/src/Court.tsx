import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { COURT, side, type Decision, type RoomView, type Vec } from '../../../packages/shared/src/index';
import { validPosition } from '../../../packages/game-engine/src/geometry';
import { COURT_LINES } from './courtDrawing';
type Props = {room: RoomView | null; target: Vec | null; onSelect: (v: Vec) => void; replay: Decision[] | null; replayKey: number};
const W = 540, H = 860, SX = 35, SY = 22.5;
class TacticalScene extends Phaser.Scene {
  props: () => Props;
  court!: Phaser.GameObjects.Graphics; overlays!: Phaser.GameObjects.Graphics; trail!: Phaser.GameObjects.Graphics;
  players: Phaser.GameObjects.Container[] = []; ball!: Phaser.GameObjects.Arc;
  lastDecision = ''; signature = ''; lastTarget = ''; replaySignature = ''; ready = false;
  replayTimers: Phaser.Time.TimerEvent[] = [];
  constructor(props: () => Props) {super('tactical-court'); this.props = props;}
  xy(p: Vec) {const flip = this.props().room?.me === 1 ? -1 : 1; return {x: W / 2 + p.x * SX * flip, y: H / 2 + p.y * SY * flip};}
  world(x: number, y: number): Vec {const flip = this.props().room?.me === 1 ? -1 : 1; return {x: (x - W / 2) / SX * flip, y: (y - H / 2) / SY * flip};}
  create() {
    this.cameras.main.setBackgroundColor('#244b3e');
    this.court = this.add.graphics(); this.overlays = this.add.graphics(); this.trail = this.add.graphics();
    this.drawCourt();
    for (let id = 0; id < 2; id++) this.players.push(this.person(id));
    this.ball = this.add.circle(W / 2, H / 2, 5.5, 0xeaf48f).setStrokeStyle(1.5, 0xfaffd1).setDepth(8);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const {room, onSelect} = this.props(); if (!room) return;
      const p = this.world(pointer.x, pointer.y);
      if (validPosition(p, room.me)) {
        onSelect(p);
        const ripple = this.add.circle(pointer.x, pointer.y, 8).setStrokeStyle(2, 0xe5f59a).setDepth(10);
        this.tweens.add({targets: ripple, radius: 28, alpha: 0, duration: 450, onComplete: () => ripple.destroy()});
      }
    });
    this.ready = true; this.sync();
  }
  person(id: number) {
    const color = Phaser.Display.Color.HexStringToColor(this.props().room?.state?.players[id].color ?? (id === 0 ? '#ddeb78' : '#f0a878')).color;
    const shadow = this.add.ellipse(2, 7, 31, 15, 0x102c24, .4);
    const halo = this.add.circle(0, 0, 23).setStrokeStyle(1.2, color, .25);
    const body = this.add.ellipse(0, 2, 24, 18, color).setStrokeStyle(2, 0x15392e);
    const head = this.add.circle(0, -5, 7, 0xf3d8b2).setStrokeStyle(2, 0x27483a);
    const cap = this.add.arc(0, -7, 7, 180, 360, false, 0xf8f5e7);
    const racket = this.add.ellipse(19, -4, 11, 15).setStrokeStyle(2, 0xe9eed9);
    const handle = this.add.line(0, 0, 10, 7, 16, 1, 0xe9eed9).setOrigin(0, 0);
    const group = this.add.container(0, 0, [shadow, halo, body, head, cap, handle, racket]).setDepth(6);
    return group;
  }
  drawCourt() {
    const g = this.court;
    g.clear();
    // O piso é simétrico e fixo; só os jogadores e as trajetórias giram na perspectiva.
    const origin = {x:W/2-5.15*SX,y:H/2-COURT.baseline*SY};
    g.fillStyle(0x386950).fillRoundedRect(origin.x - 8, origin.y - 10, 10.3 * SX + 16, COURT.length * SY + 20, 3);
    g.fillStyle(0x45795b).fillRect(origin.x, origin.y, 10.3 * SX, COURT.length * SY);
    for (let i = 0; i < 12; i++) if (i % 2 === 0) g.fillStyle(0xffffff, .018).fillRect(origin.x, origin.y + i * COURT.length * SY / 12, 10.3 * SX, COURT.length * SY / 12);
    // Linhas de simples e quadrados de serviço em coordenadas regulamentares.
    const line = (a: Vec, b: Vec, width = 2) => {const p = this.xy(a), q = this.xy(b); g.lineStyle(width, 0xf2f1d9, .85).lineBetween(p.x, p.y, q.x, q.y);};
    COURT_LINES.forEach(({from,to}) => line(from,to));
    const a = {x:W/2-5.25*SX,y:H/2}, b = {x:W/2+5.25*SX,y:H/2};
    g.lineStyle(7, 0x102f26, .55).lineBetween(a.x, a.y + 5, b.x, b.y + 5);
    for (let x = a.x; x < b.x; x += 9) g.lineStyle(.6, 0xd9e4ce, .4).lineBetween(x, a.y - 4, x, a.y + 5);
    g.lineStyle(1, 0xb0c7b2, .4).lineBetween(a.x, a.y + 4, b.x, b.y + 4);
    g.lineStyle(2.5, 0xf6f0da).lineBetween(a.x - 3, a.y - 5, b.x + 3, b.y - 5);
    g.fillStyle(0xe3e8ce).fillCircle(a.x - 4, a.y, 4).fillCircle(b.x + 4, b.y, 4);
    this.add.text(W / 2, 20, 'T E N N I S  T Á T I C O', {fontFamily: 'Arial', fontSize: '11px', color: '#a2b9a3'}).setOrigin(.5);
    this.add.text(W / 2, H - 25, 'P E N S E  N O  P R Ó X I M O  P O N T O', {fontFamily: 'Arial', fontSize: '9px', color: '#91ab94'}).setOrigin(.5);
  }
  movePlayers(positions: Vec[], duration: number) {
    positions.forEach((p, i) => {
      const target = this.xy(p), sprite = this.players[i]; this.tweens.killTweensOf(sprite);
      const moving = Math.hypot(sprite.x - target.x, sprite.y - target.y) > 4;
      this.tweens.add({targets: sprite, x: target.x, y: target.y, duration, ease: 'Linear', onUpdate: tween => {sprite.rotation = moving ? Math.sin(tween.progress * Math.PI * 14) * .09 : 0;}, onComplete: () => {sprite.rotation = 0;}});
    });
  }
  path(d: Decision, alpha = .5) {
    const from = this.xy(d.ball.from), to = this.xy(d.ball.contactType === 'volley' ? d.ball.contact : d.ball.to), g = this.trail;
    g.lineStyle(1.8, d.player === (this.props().room?.me ?? 0) ? 0xe4ee98 : 0xf2bd91, alpha);
    for (let t = 0; t < 1; t += .055) {
      const tt = Math.min(1, t + .029); g.lineBetween(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, from.x + (to.x - from.x) * tt, from.y + (to.y - from.y) * tt);
    }
    if (d.ball.contactType !== 'volley') g.strokeCircle(to.x, to.y, 5);
    d.before.forEach((p, i) => {const a = this.xy(p), b = this.xy(d.after[i]); g.lineStyle(1, i === 0 ? 0xd9ed8b : 0xecb494, .2).lineBetween(a.x, a.y, b.x, b.y);});
  }
  animate(d: Decision, duration: number) {
    this.movePlayers(d.after, duration);
    const from = this.xy(d.ball.from), to = this.xy(d.ball.contactType === 'volley' ? d.ball.contact : d.ball.to);
    this.tweens.killTweensOf(this.ball); this.ball.setPosition(from.x, from.y).setAlpha(1);
    const progress = {t: 0};
    this.tweens.add({targets: progress, t: 1, duration, ease: 'Linear', onUpdate: () => {
      const t = progress.t, lift = Math.sin(Math.PI * t) * (d.ball.height === 'high' ? 42 : 15);
      this.ball.setPosition(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t - lift).setScale(1 + lift / 70);
    }, onComplete: () => {this.ball.setScale(1); this.path(d); if (d.ball.outcome !== 'Em jogo') {const pulse = this.add.circle(to.x, to.y, 10).setStrokeStyle(2, d.ball.outcome === 'Bola fora' || d.ball.outcome === 'Bola na rede' ? 0xf5a18b : 0xeaf48f); this.tweens.add({targets: pulse, radius: 29, alpha: 0, duration: 650, onComplete: () => pulse.destroy()});}}});
    const volley = d.shot.startsWith('volley-');
    const hitter = this.players[d.player]; this.tweens.add({targets: hitter, scaleX: volley ? 1.07 : 1.15, scaleY: volley ? 1.02 : .9, yoyo: true, duration: volley ? 90 : 130});
    if (volley) {
      const contact = this.add.circle(from.x, from.y, 12).setStrokeStyle(2, 0xeaf3b1, .7).setDepth(7);
      this.tweens.add({targets: contact, radius: 24, alpha: 0, duration: 300, onComplete: () => contact.destroy()});
    }
  }
  drawOverlay() {
    const {target, room} = this.props(), s = room?.state, g = this.overlays; g.clear();
    if (!s) return;
    const review = ['POINT_REVIEW', 'MATCH_FINISHED'].includes(s.phase);
    if (review) {
      const d = s.decisions.find(d => d.player === room!.me);
      if (d) {
        const v = this.xy(d.vulnerability), r = this.xy(d.recommended);
        g.fillStyle(0xf6a18c, .13).fillEllipse(v.x, v.y, 125, 95);
        g.fillStyle(0xd8ef97, .1).fillEllipse(r.x, r.y, 160, 70);
        this.dashedCircle(g, r, 19, 0xd9ebac);
      }
    }
    if (target) {
      const t = this.xy(target), p = this.players[room!.me];
      const dx = t.x - p.x, dy = t.y - p.y;
      const count = Math.max(1, Math.floor(Math.hypot(dx, dy) / 10)); g.lineStyle(1.5, 0xe9f3b4, .55);
      for (let i = 0; i < count; i += 2) g.lineBetween(p.x + dx * i / count, p.y + dy * i / count, p.x + dx * Math.min(1, (i + 1) / count), p.y + dy * Math.min(1, (i + 1) / count));
      this.dashedCircle(g, t, 18, 0xe8f5a1); g.fillStyle(0xe8f5a1, .18).fillCircle(t.x, t.y, 12); g.fillStyle(0xe8f5a1).fillCircle(t.x, t.y, 3);
    }
  }
  dashedCircle(g: Phaser.GameObjects.Graphics, center: {x: number; y: number}, radius: number, color: number) {
    g.lineStyle(1.7, color, .9);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 7) g.beginPath().arc(center.x, center.y, radius, angle, angle + .23).strokePath();
  }
  sync() {
    if (!this.ready) return;
    const {room, replay, replayKey} = this.props(), s = room?.state;
    if (replay?.length) {
      const key = `${replayKey}:${replay[0].id}:${replay.length}`;
      if (key !== this.replaySignature) {
        this.replaySignature = key; this.replayTimers.forEach(t => t.remove()); this.replayTimers = []; this.tweens.killAll(); this.trail.clear();
        replay[0].before.forEach((p, i) => {const xy = this.xy(p); this.players[i].setPosition(xy.x, xy.y);});
        replay.forEach((d, i) => this.replayTimers.push(this.time.delayedCall(i * 900 + 100, () => this.animate(d, 800))));
      }
      return;
    }
    if (this.replaySignature) {this.replayTimers.forEach(t => t.remove()); this.replaySignature = ''; this.tweens.killAll();}
    if (!s) return;
    if (this.signature !== `${s.id}:${s.pointNumber}:${s.revision}`) {
      const initial = this.signature === ''; this.signature = `${s.id}:${s.pointNumber}:${s.revision}`;
      if (!s.decisions.length) {
        this.trail.clear(); this.lastDecision = '';
        if (s.ball) {
          const a = this.xy(s.ball.from), b = this.xy(s.ball.contactType === 'volley' ? s.ball.contact : s.ball.to);
          this.trail.lineStyle(1.5, 0xe6f19f, .5);
          for (let t = 0; t < 1; t += .055) this.trail.lineBetween(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.x + (b.x - a.x) * (t + .025), a.y + (b.y - a.y) * (t + .025));
          if (s.ball.contactType !== 'volley') this.trail.strokeCircle(b.x, b.y, 5);
        }
      }
      const d = s.decisions.at(-1);
      const duration = room.paused ? 0 : s.phase === 'BALL_ANIMATION' ? Math.max(50, (s.animationUntil ?? room.serverTime) - room.serverTime) : 300;
      if (d && this.lastDecision !== d.id && s.phase === 'BALL_ANIMATION') {
        this.lastDecision = d.id; this.animate(d, duration);
      } else {
        if (initial) s.players.forEach((p, i) => {const xy = this.xy(p.position); this.players[i].setPosition(xy.x, xy.y);});
        else this.movePlayers(s.players.map(p => p.position), duration);
        if (!d || s.phase !== 'BALL_ANIMATION') {const p = this.xy(s.ball?.contact ?? s.players[s.server].position); this.ball.setPosition(p.x, p.y);}
        if (['POINT_REVIEW', 'MATCH_FINISHED'].includes(s.phase)) {this.trail.clear(); s.decisions.forEach(d => this.path(d, .45));}
      }
    }
    this.drawOverlay();
  }
  update() {this.sync();}
}
export default function Court(props: Props) {
  const parent = useRef<HTMLDivElement>(null), current = useRef(props); current.current = props;
  useEffect(() => {
    const scene = new TacticalScene(() => current.current);
    const game = new Phaser.Game({type: Phaser.CANVAS, width: W, height: H, parent: parent.current!, backgroundColor: '#244b3e', scene, banner: false, render: {antialias: true}, scale: {mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH}, input: {activePointers: 2}, audio: {noAudio: true}});
    const resize = new ResizeObserver(() => game.scale.refresh()); resize.observe(parent.current!);
    return () => {resize.disconnect(); game.destroy(true);};
  }, []);
  return <div ref={parent} className="phaser-court" role="img" aria-label="Quadra interativa de tênis. Toque no seu lado para escolher a recuperação. Use também os botões de posições sugeridas."/>;
}
