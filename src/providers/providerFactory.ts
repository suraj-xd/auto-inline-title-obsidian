import type { AutoTitleSettings } from '../settings';
import type { AIProvider } from './types';
import { OpenAIProvider } from './openaiProvider';
import { AnthropicProvider } from './anthropicProvider';
import { OllamaProvider } from './ollamaProvider';
import { CustomProvider } from './customProvider';

export function createProvider(settings: AutoTitleSettings): AIProvider {
	switch (settings.selectedProvider) {
		case 'openai':
			return new OpenAIProvider(settings.openaiApiKey, settings.openaiModel);
		case 'anthropic':
			return new AnthropicProvider(settings.anthropicApiKey, settings.anthropicModel);
		case 'ollama':
			return new OllamaProvider(settings.ollamaEndpoint, settings.ollamaModel);
		case 'custom':
			return new CustomProvider(
				settings.customEndpoint,
				settings.customApiKey,
				settings.customModel
			);
		default:
			throw new Error(`Unknown provider: ${settings.selectedProvider}`);
	}
}
