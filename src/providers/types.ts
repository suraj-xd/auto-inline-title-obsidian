import type { TitleStyle } from '../settings';

export interface TitleGenerationRequest {
	content: string;
	numberOfSuggestions: number;
	maxLength: number;
	style: TitleStyle;
}

export interface TitleGenerationResponse {
	suggestions: string[];
	tokensUsed?: number;
	error?: string;
}

export interface AIProvider {
	name: string;
	isConfigured(): boolean;
	generateTitles(request: TitleGenerationRequest): Promise<TitleGenerationResponse>;
	testConnection(): Promise<boolean>;
}
