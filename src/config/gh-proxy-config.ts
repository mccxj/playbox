export interface GhProxyConfig {
  jsdelivrEnabled: boolean;
  redirectMode: 'manual' | 'follow';
}

export function getGhProxyConfig(env: Record<string, string | undefined>): GhProxyConfig {
  return {
    jsdelivrEnabled: env.GH_PROXY_JSD_ENABLE === '1' || env.GH_PROXY_JSD_ENABLE === 'true',
    redirectMode: 'manual',
  };
}
