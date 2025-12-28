import { App, SuggestModal } from 'obsidian';

interface TitleOption {
	title: string;
	index: number;
	isCustom: boolean;
}

export class TitleSuggestionModal extends SuggestModal<TitleOption> {
	private suggestions: string[];
	private onSelect: (title: string) => void;
	private customQuery: string = '';

	constructor(app: App, suggestions: string[], onSelect: (title: string) => void) {
		super(app);
		this.suggestions = suggestions;
		this.onSelect = onSelect;

		this.setPlaceholder('Select a title or type your own...');
		this.setInstructions([
			{ command: 'Enter', purpose: 'Select title' },
			{ command: 'Esc', purpose: 'Cancel' },
		]);

		// Add custom class for styling
		this.modalEl.addClass('auto-title-modal');
	}

	getSuggestions(query: string): TitleOption[] {
		this.customQuery = query.trim();
		const options: TitleOption[] = [];

		// If user typed something, add it as custom option first
		if (this.customQuery.length > 0) {
			options.push({
				title: this.customQuery,
				index: -1,
				isCustom: true,
			});
		}

		// Add AI-generated suggestions
		this.suggestions.forEach((title, index) => {
			// Filter based on query if provided
			if (
				this.customQuery.length === 0 ||
				title.toLowerCase().includes(this.customQuery.toLowerCase())
			) {
				options.push({
					title,
					index,
					isCustom: false,
				});
			}
		});

		return options;
	}

	renderSuggestion(option: TitleOption, el: HTMLElement): void {
		const container = el.createDiv({ cls: 'suggestion-content' });

		if (option.isCustom) {
			container.createDiv({
				text: `"${option.title}"`,
				cls: 'suggestion-title auto-title-custom',
			});
			container.createDiv({
				text: 'Use custom title',
				cls: 'suggestion-note',
			});
		} else {
			container.createDiv({
				text: option.title,
				cls: 'suggestion-title',
			});
			container.createDiv({
				text: `Suggestion ${option.index + 1}`,
				cls: 'suggestion-note',
			});
		}
	}

	onChooseSuggestion(option: TitleOption, _evt: MouseEvent | KeyboardEvent): void {
		this.onSelect(option.title);
	}

	// Allow cancellation without selecting
	onClose(): void {
		// Modal closed without selection - do nothing
	}
}
