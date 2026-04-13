import { DEFAULT_CONFIG, Config } from './default';
import { ProtocolFamily } from '../types/provider';

export interface ResolvedProvider {
	name: string;
	provider: any;
}

export function getConfig(env: any): Config {
	return env.API_CONFIG ? JSON.parse(env.API_CONFIG) : DEFAULT_CONFIG;
}

export function resolveProvider(config: Config, model: string, family?: ProtocolFamily): ResolvedProvider {
	let fallbackProviderName: string | null = null;

	for (const [name, p] of Object.entries(config.providers)) {
		if (p.models && p.models.includes(model)) {
			if (!fallbackProviderName) fallbackProviderName = name;
			if (family && p.family === family) {
				return { name, provider: p };
			}
		}
	}

	const finalName = fallbackProviderName || config.default_provider;
	return { name: finalName, provider: config.providers[finalName] };
}

export const ConfigManager = {
	getConfig,
	resolveProvider,
};
