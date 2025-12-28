import { BaseProvider } from './baseProvider';
import type { TitleGenerationRequest, TitleGenerationResponse } from './types';

export class AnthropicProvider extends BaseProvider {
	name = 'Anthropic';

	constructor(
		private apiKey: string,
		private model: string
	) {
		super();
	}

	isConfigured(): boolean {
		return this.apiKey.length > 0;
	}

	async generateTitles(request: TitleGenerationRequest): Promise<TitleGenerationResponse> {
		const { json, status } = await this.fetchWithRetry(
			'https://api.anthropic.com/v1/messages',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': this.apiKey,
					'anthropic-version': '2023-06-01',
				},
				body: JSON.stringify({
					model: this.model,
					max_tokens: 200,
					messages: [{ role: 'user', content: this.buildPrompt(request) }],
				}),
			}
		);

		const data = json as {
			error?: { message: string };
			content?: Array<{ text?: string }>;
			usage?: { input_tokens?: number; output_tokens?: number };
		};

		if (status !== 200 || data.error) {
			return { suggestions: [], error: data.error?.message || 'Unknown error' };
		}

		const text = data.content?.[0]?.text || '';
		return {
			suggestions: this.parseTitleResponse(text, request.numberOfSuggestions),
			tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
		};
	}
}
