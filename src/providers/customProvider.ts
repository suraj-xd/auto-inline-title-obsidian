import { BaseProvider } from './baseProvider';
import type { TitleGenerationRequest, TitleGenerationResponse } from './types';

export class CustomProvider extends BaseProvider {
	name = 'Custom';

	constructor(
		private endpoint: string,
		private apiKey: string,
		private model: string
	) {
		super();
	}

	isConfigured(): boolean {
		return this.endpoint.length > 0;
	}

	async generateTitles(request: TitleGenerationRequest): Promise<TitleGenerationResponse> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (this.apiKey) {
			headers['Authorization'] = `Bearer ${this.apiKey}`;
		}

		const { json, status } = await this.fetchWithRetry(this.endpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				model: this.model,
				messages: [
					{
						role: 'system',
						content:
							'You are a helpful assistant that generates concise, descriptive note titles.',
					},
					{ role: 'user', content: this.buildPrompt(request) },
				],
				max_tokens: 200,
				temperature: 0.7,
			}),
		});

		const data = json as {
			error?: { message: string };
			choices?: Array<{ message?: { content?: string } }>;
			usage?: { total_tokens?: number };
		};

		if (status !== 200 || data.error) {
			return { suggestions: [], error: data.error?.message || 'Unknown error' };
		}

		const text = data.choices?.[0]?.message?.content || '';
		return {
			suggestions: this.parseTitleResponse(text, request.numberOfSuggestions),
			tokensUsed: data.usage?.total_tokens,
		};
	}
}
