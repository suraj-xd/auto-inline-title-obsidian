import { BaseProvider } from './baseProvider';
import type { TitleGenerationRequest, TitleGenerationResponse } from './types';

export class OpenAIProvider extends BaseProvider {
	name = 'OpenAI';

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
			'https://api.openai.com/v1/chat/completions',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.apiKey}`,
				},
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
			}
		);

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
