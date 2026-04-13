export interface Logger {
  info: (msg: string, meta?: any) => void;
  warn: (msg: string, meta?: any) => void;
  error: (msg: string, meta?: any) => void;
}

export function createLogger(): Logger {
  const reqId = crypto.randomUUID().slice(0, 4);
  return {
    info: (msg: string, meta?: any) => log('INFO', reqId, msg, meta),
    warn: (msg: string, meta?: any) => log('WARN', reqId, msg, meta),
    error: (msg: string, meta?: any) => log('ERROR', reqId, msg, meta),
  };
}

function log(level: string, reqId: string, msg: string, meta?: any) {
  console.log(`[${level}] [${reqId}] ${msg}`, meta ? JSON.stringify(meta) : '');
}

export const Logger = {
  create: createLogger,
};
