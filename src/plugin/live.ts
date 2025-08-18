import type { LiveServerOptions } from './types';

export interface LiveServer {
  send(msg: any): void;
  close(): void;
}

function makeNoop(): LiveServer {
  return {
    send: () => {},
    close: () => {},
  };
}

/**
 * Create a lightweight WebSocket broadcast server for live reporting.
 *
 * When enabled, the server emits lifecycle, timeline, task, and summary
 * messages to connected clients (e.g., the HTML report opened with ?live=1).
 * If the optional `ws` dependency is not available, a noop server is returned.
 *
 * @param opts - LiveServerOptions (enabled flag, host, port).
 * @returns LiveServer instance or null if not enabled.
 */
export function createLiveServer(opts?: LiveServerOptions): LiveServer | null {
  if (!opts?.enabled) return null;
  const host = opts.host || '127.0.0.1';
  const port = opts.port || 9777;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const WS = require('ws');
    const wss = new WS.Server({ host, port });
    const clients = new Set<any>();
    wss.on('connection', (ws: any) => {
      clients.add(ws);
      ws.on('close', () => clients.delete(ws));
    });
    // eslint-disable-next-line no-console
    console.log(`[CyNova] Live server listening ws://${host}:${port}`);
    return {
      send(msg: any) {
        const data = JSON.stringify(msg);
        for (const ws of clients) {
          try { ws.readyState === 1 && ws.send(data); } catch {}
        }
      },
      close() {
        try { wss.close(); } catch {}
      },
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[CyNova] Live server not started (ws module not available).');
    return makeNoop();
  }
}
