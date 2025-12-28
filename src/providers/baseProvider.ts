import { requestUrl } from 'obsidian';
import type { AIProvider, TitleGenerationRequest, TitleGenerationResponse } from './types';

interface FetchOptions {
	method: string;
	headers: Record<string, string>;
	body: string;
}

export abstract class BaseProvider implements AIProvider {
	abstract name: string;
	abstract isConfigured(): boolean;
	abstract generateTitles(request: TitleGenerationRequest): Promise<TitleGenerationResponse>;

	protected async fetchWithRetry(
		url: string,
		options: FetchOptions,
		maxRetries = 3
	): Promise<{ json: unknown; status: number }> {
		let lastError: Error | null = null;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				const response = await requestUrl({
					...options,
					url,
					throw: false,
				});

				if (response.status === 429) {
					// Rate limited - exponential backoff
					const delay = Math.pow(2, attempt) * 1000;
					await this.sleep(delay);
					continue;
				}

				if (response.status === 401) {
					throw new Error('Invalid API key. Please check your credentials.');
				}

				if (response.status >= 500) {
					const delay = Math.pow(2, attempt) * 1000;
					await this.sleep(delay);
					continue;
				}

				return { json: response.json, status: response.status };
			} catch (error) {
				lastError = error as Error;
				if ((error as Error).message.includes('Invalid API key')) {
					throw error;
				}
			}
		}

		throw lastError || new Error('Failed after multiple retries');
	}

	protected buildPrompt(request: TitleGenerationRequest): string {
		const styleInstructions: Record<string, string> = {
			concise: 'Create short, punchy titles (3-6 words)',
			descriptive: 'Create detailed titles that summarize the main topic',
			question: 'Create titles as questions that the content answers',
			action: 'Create action-oriented titles starting with verbs',
		};

		return `Generate ${request.numberOfSuggestions} title suggestions for the following note content.

Requirements:
- ${styleInstructions[request.style]}
- Maximum ${request.maxLength} characters each
- Return ONLY the titles, one per line, numbered 1-${request.numberOfSuggestions}
- No markdown formatting, no quotes around titles
- Titles should be suitable as file names (avoid special characters like : / \\ ? * " < > |)

Content:
${request.content.slice(0, 4000)}`;
	}

	protected parseTitleResponse(text: string, expectedCount: number): string[] {
		const lines = text
			.split('\n')
			.map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
			.map((line) => line.replace(/^["']|["']$/g, '')) // Remove quotes
			.filter((line) => line.length > 0 && line.length <= 100);

		return lines.slice(0, expectedCount);
	}

	protected sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async testConnection(): Promise<boolean> {
		try {
			const result = await this.generateTitles({
				content: 'This is a test note about testing connections to AI services.',
				numberOfSuggestions: 1,
				maxLength: 50,
				style: 'concise',
			});
			return result.suggestions.length > 0 && !result.error;
		} catch {
			return false;
		}
	}
}
