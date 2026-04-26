export interface Logger {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
}

export function createLogger(): Logger {
  const reqId = crypto.randomUUID().slice(0, 4);
  return {
    info: (msg: string, meta?: Record<string, unknown>) => log('INFO', reqId, msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log('WARN', reqId, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log('ERROR', reqId, msg, meta),
  };
}

function log(level: string, reqId: string, msg: string, meta?: Record<string, unknown>) {
  console.log(`[${level}] [${reqId}] ${msg}`, meta ? JSON.stringify(meta) : '');
}

export const Logger = {
  create: createLogger,
};
