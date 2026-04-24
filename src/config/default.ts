/**
 * Default configuration for the AI API Gateway Worker
 *
 * Config is loaded from providers.json (generated from providers.jsonc).
 * Edit providers.jsonc for human-friendly config with comments.
 * The build script generate-config-json.mjs strips comments and produces providers.json.
 */

import { Provider } from '../types/provider';
import providersJson from './providers.json';

export interface Config {
  providers: Provider;
  default_provider: string;
}

export const DEFAULT_CONFIG: Config = {
  providers: providersJson.providers as Provider,
  default_provider: providersJson.default_provider,
};
