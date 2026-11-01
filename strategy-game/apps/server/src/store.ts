import {createHash, randomBytes, randomUUID} from 'node:crypto';
import type {Decision, GameState, Mode, PointRecord, Profile, Progress} from '../../../packages/shared/src/index';
import {postgresDatabase, sqliteDatabase, type Database} from './database';
const hash = (token: string) => createHash('sha256').update(token).digest('hex');
const parse = <T>(body: unknown): T => JSON.parse(String(body)) as T;
type StoredPoint = {decisions: Decision[]; won: boolean; seed: number; point: PointRecord};

export async function openStore(options: {path: string; databaseUrl?: string}) {
  const database = options.databaseUrl ? await postgresDatabase(options.databaseUrl) : sqliteDatabase(options.path);
  return new Store(database, !options.databaseUrl || process.env.LOG_GAME_EVENTS === 'true');
}

export class Store {
  constructor(private db: Database, private recordEvents = true) {}
  private defaultProfile(): Profile {return {id: randomUUID(), nickname: 'Tenista', audience: 'adult', level: 'study', color: '#ddeb78'};}
  async authenticate(token?: string): Promise<{profile: Profile; token: string}> {
    if (token && token.length <= 128) {
      const [found] = await this.db.all('SELECT body FROM profiles WHERE token=? AND user_id IS NULL', [hash(token)]);
      if (found) return {profile: parse<Profile>(found.body), token};
    }
    const next = randomBytes(32).toString('hex');
    const profile = this.defaultProfile();
    await this.db.run('INSERT INTO profiles(id,token,body) VALUES (?,?,?)', [profile.id, hash(next), JSON.stringify(profile)]);
    return {profile, token: next};
  }

  async authenticateAccount(userId: string, guestToken?: string): Promise<{profile: Profile; retiredGuestProfileId?: string}> {
    return this.db.transaction(async db => {
      // Serialize simultaneous logins to the same account across devices.
      if (db.postgres) await db.all('SELECT pg_advisory_xact_lock(hashtextextended(?,0))', [userId]);
      const [account] = await db.all('SELECT id,body FROM profiles WHERE user_id=?', [userId]);
      const [guest] = guestToken && guestToken.length <= 128
        ? await db.all('SELECT id,body FROM profiles WHERE token=? AND user_id IS NULL' + (db.postgres ? ' FOR UPDATE' : ''), [hash(guestToken)])
        : [];
      if (!account && guest) {
        await db.run('UPDATE profiles SET user_id=?,token=? WHERE id=?', [userId, hash(randomBytes(32).toString('hex')), guest.id]);
        return {profile: parse<Profile>(guest.body), retiredGuestProfileId: String(guest.id)};
      }
      let profile: Profile;
      if (account) profile = parse<Profile>(account.body);
      else {
        profile = this.defaultProfile();
        await db.run('INSERT INTO profiles(id,token,body,user_id) VALUES (?,?,?,?)', [profile.id, hash(randomBytes(32).toString('hex')), JSON.stringify(profile), userId]);
      }
      if (guest) {
        await db.run('UPDATE points SET profile_id=? WHERE profile_id=?', [profile.id, guest.id]);
        await db.run('INSERT INTO matches(id,profile_id,body,created_at) SELECT id,?,body,created_at FROM matches WHERE profile_id=? ON CONFLICT(id,profile_id) DO NOTHING', [profile.id, guest.id]);
        await db.run('DELETE FROM matches WHERE profile_id=?', [guest.id]);
        await db.run('DELETE FROM profiles WHERE id=? AND user_id IS NULL', [guest.id]);
      }
      return {profile, retiredGuestProfileId: guest ? String(guest.id) : undefined};
    });
  }

  async profile(id: string): Promise<Profile> {
    const [row] = await this.db.all('SELECT body FROM profiles WHERE id=?', [id]);
    if (!row) throw new Error('Perfil não encontrado. Entre novamente.');
    return parse<Profile>(row.body);
  }
  async update(profile: Profile) {await this.db.run('UPDATE profiles SET body=? WHERE id=?', [JSON.stringify(profile), profile.id]);}
  async event(matchId: string, kind: string, body: unknown) {
    if (!this.recordEvents) return;
    try {await this.db.run('INSERT INTO events(match_id,kind,body) VALUES (?,?,?)', [matchId, kind, JSON.stringify(body)]);}
    catch {console.error('Não foi possível registrar um evento de diagnóstico.');}
  }
  async savePoint(state: GameState, profiles: (string | null)[]) {
    const point = state.points.at(-1);
    if (!point) return;
    await this.db.transaction(async db => {
      for (const [i, profileId] of profiles.entries()) {
        if (!profileId) continue;
        const decisions = point.decisions.filter(d => d.player === i);
        await db.run('INSERT INTO points(id,profile_id,scenario,mode,body) VALUES (?,?,?,?,?) ON CONFLICT(id) DO NOTHING',
          [state.id + ':' + point.number + ':' + i, profileId, state.scenarioId ?? null, state.mode, JSON.stringify({decisions, won: point.winner === i, seed: point.seed, point})]);
      }
    });
  }
  async saveMatch(state: GameState, profiles: (string | null)[]) {
    await this.db.transaction(async db => {
      for (const [i, profileId] of profiles.entries()) {
        if (!profileId) continue;
        const decisions = state.points.flatMap(p => p.decisions).filter(d => d.player === i);
        const average = (field: 'shotIQ' | 'positionIQ') => decisions.length ? Math.round(decisions.reduce((n, d) => n + d[field], 0) / decisions.length) : 0;
        const body = {id: state.id, mode: state.mode, createdAt: new Date().toISOString(), score: state.score, won: state.score[i] > state.score[i === 0 ? 1 : 0], rallies: state.points.length ? +(state.points.reduce((n, p) => n + p.decisions.length, 0) / state.points.length).toFixed(1) : 0, shotIQ: average('shotIQ'), positionIQ: average('positionIQ')};
        const conflict = state.mode === 'academy' ? 'DO UPDATE SET body=excluded.body' : 'DO NOTHING';
        await db.run('INSERT INTO matches(id,profile_id,body) VALUES (?,?,?) ON CONFLICT(id,profile_id) ' + conflict, [state.id, profileId, JSON.stringify(body)]);
      }
    });
  }
  async progress(profileId: string): Promise<Progress> {
    const rows = await this.db.all('SELECT scenario,mode,body FROM points WHERE profile_id=? ORDER BY created_at DESC LIMIT 2000', [profileId]);
    const points = rows.map(row => ({scenario: row.scenario as string | null, mode: row.mode as Mode, ...parse<StoredPoint>(row.body)}));
    const decisions = points.flatMap(p => p.decisions);
    const mean = (field: 'shotIQ' | 'positionIQ') => decisions.length ? Math.round(decisions.reduce((n, d) => n + d[field], 0) / decisions.length) : null;
    const completed = [...new Set(points.filter(p => p.scenario && p.decisions.some(d => d.shotIQ >= 65 && d.positionIQ >= 55 && !d.automatic)).map(p => p.scenario!))];
    const groups = new Map<string, {total: number; count: number}>();
    for (const point of points) {
      const label = point.scenario ?? 'Duelos e desafios';
      for (const decision of point.decisions) {
        const old = groups.get(label) ?? {total: 0, count: 0};
        old.total += (decision.shotIQ + decision.positionIQ) / 2;
        old.count++;
        groups.set(label, old);
      }
    }
    const history = (await this.db.all('SELECT body FROM matches WHERE profile_id=? ORDER BY created_at DESC LIMIT 30', [profileId])).map(row => parse<Progress['history'][number]>(row.body));
    return {profile: await this.profile(profileId), completed, attempts: points.filter(p => p.scenario).length, matches: history.filter(h => h.mode !== 'academy').length, points: points.length, shotIQ: mean('shotIQ'), positionIQ: mean('positionIQ'), weaknesses: [...groups].map(([label, group]) => ({label, score: Math.round(group.total / group.count), count: group.count})).sort((a, b) => a.score - b.score).slice(0, 4), history};
  }
  async replay(profileId: string, matchId: string): Promise<PointRecord[]> {
    return (await this.db.all('SELECT body FROM points WHERE profile_id=? AND id LIKE ? ORDER BY created_at', [profileId, matchId + ':%'])).map(row => parse<StoredPoint>(row.body).point);
  }
  async close() {await this.db.close();}
}
