import type { AutoTitleSettings } from '../settings';
import type { AIProvider } from '../providers/types';
import { createProvider } from '../providers/providerFactory';

export class TitleGenerator {
	private provider: AIProvider;

	constructor(private settings: AutoTitleSettings) {
		this.provider = createProvider(settings);
	}

	/**
	 * Update the provider when settings change
	 */
	updateProvider(): void {
		this.provider = createProvider(this.settings);
	}

	/**
	 * Generate title suggestions for the given content
	 */
	async generateTitles(content: string): Promise<string[]> {
		if (!this.provider.isConfigured()) {
			throw new Error(
				`${this.provider.name} is not configured. Please add your API key in settings.`
			);
		}

		const response = await this.provider.generateTitles({
			content,
			numberOfSuggestions: this.settings.numberOfSuggestions,
			maxLength: this.settings.maxTitleLength,
			style: this.settings.titleStyle,
		});

		if (response.error) {
			throw new Error(response.error);
		}

		if (response.suggestions.length === 0) {
			throw new Error('No title suggestions generated. Try adding more content.');
		}

		return response.suggestions;
	}

	/**
	 * Test if the current provider configuration works
	 */
	async testConnection(): Promise<boolean> {
		return this.provider.testConnection();
	}

	/**
	 * Get the name of the current provider
	 */
	getProviderName(): string {
		return this.provider.name;
	}
}
