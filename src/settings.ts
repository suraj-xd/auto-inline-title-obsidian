export type ProviderType = 'openai' | 'anthropic' | 'ollama' | 'custom';
export type TitleStyle = 'concise' | 'descriptive' | 'question' | 'action';

export interface AutoTitleSettings {
	// Provider configuration
	selectedProvider: ProviderType;
	openaiApiKey: string;
	openaiModel: string;
	anthropicApiKey: string;
	anthropicModel: string;
	ollamaEndpoint: string;
	ollamaModel: string;
	customEndpoint: string;
	customApiKey: string;
	customModel: string;

	// Behavior settings
	autoGenerateEnabled: boolean;
	contentThresholdWords: number;
	debounceDelayMs: number;

	// Generation settings
	numberOfSuggestions: number;
	maxTitleLength: number;
	titleStyle: TitleStyle;

	// File handling
	updateFrontmatterTitle: boolean;
	renameFile: boolean;
	untitledPatterns: string[];

	// UI settings
	showStatusBar: boolean;
	showNotifications: boolean;
}

export const DEFAULT_SETTINGS: AutoTitleSettings = {
	// Provider configuration
	selectedProvider: 'openai',
	openaiApiKey: '',
	openaiModel: 'gpt-4o-mini',
	anthropicApiKey: '',
	anthropicModel: 'claude-3-haiku-20240307',
	ollamaEndpoint: 'http://localhost:11434',
	ollamaModel: 'llama2',
	customEndpoint: '',
	customApiKey: '',
	customModel: '',

	// Behavior settings
	autoGenerateEnabled: true,
	contentThresholdWords: 100,
	debounceDelayMs: 3000,

	// Generation settings
	numberOfSuggestions: 3,
	maxTitleLength: 60,
	titleStyle: 'concise',

	// File handling
	updateFrontmatterTitle: true,
	renameFile: true,
	untitledPatterns: ['Untitled', 'Untitled \\d+', 'New Note', 'New Note \\d+'],

	// UI settings
	showStatusBar: true,
	showNotifications: true,
};

export const OPENAI_MODELS = [
	{ value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)' },
	{ value: 'gpt-4o', label: 'GPT-4o' },
	{ value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
	{ value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

export const ANTHROPIC_MODELS = [
	{ value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast)' },
	{ value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
	{ value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
];

export const TITLE_STYLES = [
	{ value: 'concise', label: 'Concise (3-6 words)' },
	{ value: 'descriptive', label: 'Descriptive' },
	{ value: 'question', label: 'Question format' },
	{ value: 'action', label: 'Action-oriented' },
];
