/** whitelist allows only listed domains, blacklist blocks listed domains */
export type ACLMode = 'whitelist' | 'blacklist';

/** Configuration resolved from environment variables */
export interface ProxyConfig {
  enabled: boolean;
  username: string;
  password: string;
  aclMode: ACLMode;
  aclDomains: string[];
}

/** Proxy-specific environment variables (subset of Cloudflare.Env) */
export interface ProxyEnv {
  PROXY_ENABLED?: string;
  PROXY_USERNAME?: string;
  PROXY_PASSWORD?: string;
  PROXY_ACL_MODE?: string;
  PROXY_ACL_DOMAINS?: string;
}
