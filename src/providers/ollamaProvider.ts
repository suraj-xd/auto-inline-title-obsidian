import { BaseProvider } from './baseProvider';
import type { TitleGenerationRequest, TitleGenerationResponse } from './types';

export class OllamaProvider extends BaseProvider {
	name = 'Ollama';

	constructor(
		private endpoint: string,
		private model: string
	) {
		super();
	}

	isConfigured(): boolean {
		return this.endpoint.length > 0 && this.model.length > 0;
	}

	async generateTitles(request: TitleGenerationRequest): Promise<TitleGenerationResponse> {
		const baseUrl = this.endpoint.replace(/\/$/, '');

		const { json, status } = await this.fetchWithRetry(`${baseUrl}/api/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: this.model,
				prompt: this.buildPrompt(request),
				stream: false,
			}),
		});

		const data = json as {
			error?: string;
			response?: string;
		};

		if (status !== 200 || data.error) {
			return { suggestions: [], error: data.error || 'Unknown error' };
		}

		return {
			suggestions: this.parseTitleResponse(data.response || '', request.numberOfSuggestions),
		};
	}
}
