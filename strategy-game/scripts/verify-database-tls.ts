import assert from 'node:assert/strict';
import net from 'node:net';
import tls, {type ConnectionOptions} from 'node:tls';
import {postgresPool} from '../apps/server/src/database';

const host = 'aws-1-us-west-2.pooler.supabase.com';
const pool = postgresPool('postgresql://tls-check@' + host + ':5432/postgres');
const options = pool.options.ssl as ConnectionOptions;
await pool.end();
assert.equal(options.rejectUnauthorized, true);

async function handshake(ssl: ConnectionOptions) {
  return new Promise<{authorized: boolean; protocol: string | null}>((resolve, reject) => {
    const socket = net.createConnection({host, port: 5432});
    let secure: tls.TLSSocket | undefined;
    const deadline = setTimeout(() => finish(new Error('Tempo limite ao verificar o TLS público do Supabase.')), 12_000);
    function finish(error?: Error, result?: {authorized: boolean; protocol: string | null}) {
      clearTimeout(deadline);
      secure?.destroy(); socket.destroy();
      if (error) reject(error); else resolve(result!);
    }
    socket.once('error', error => finish(error));
    socket.once('connect', () => {
      // PostgreSQL SSLRequest only: no database startup, password or SQL is sent.
      const request = Buffer.alloc(8);
      request.writeInt32BE(8, 0); request.writeInt32BE(80877103, 4);
      socket.write(request);
    });
    socket.once('data', response => {
      if (response.length !== 1 || response[0] !== 83) {finish(new Error('O servidor não aceitou PostgreSQL TLS.')); return;}
      secure = tls.connect({...ssl, socket, servername: ssl.servername ?? host});
      secure.once('error', error => finish(error));
      secure.once('secureConnect', () => finish(undefined, {authorized: secure!.authorized, protocol: secure!.getProtocol()}));
    });
  });
}
const verified = await handshake(options);
assert.equal(verified.authorized, true);
await assert.rejects(handshake({...options, ca: tls.rootCertificates}), (error: NodeJS.ErrnoException) =>
  ['SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'DEPTH_ZERO_SELF_SIGNED_CERT'].includes(error.code ?? ''));
await assert.rejects(handshake({...options, servername: 'wrong-host.invalid'}), {code: 'ERR_TLS_CERT_ALTNAME_INVALID'});
console.log('TLS Supabase validado: cadeia oficial e hostname corretos aceitos; CA ausente e hostname incorreto rejeitados. Nenhuma senha ou consulta enviada. Protocolo: ' + verified.protocol);
