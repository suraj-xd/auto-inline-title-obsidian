import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type AutoTitlePlugin from './main';
import {
	OPENAI_MODELS,
	ANTHROPIC_MODELS,
	TITLE_STYLES,
	type ProviderType,
	type TitleStyle,
} from './settings';

export class AutoTitleSettingTab extends PluginSettingTab {
	plugin: AutoTitlePlugin;

	constructor(app: App, plugin: AutoTitlePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h1', { text: 'Auto Title Settings' });

		// AI Provider Section
		containerEl.createEl('h2', { text: 'AI Provider' });

		new Setting(containerEl)
			.setName('AI Provider')
			.setDesc('Select which AI service to use for title generation')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('openai', 'OpenAI')
					.addOption('anthropic', 'Anthropic (Claude)')
					.addOption('ollama', 'Ollama (Local)')
					.addOption('custom', 'Custom Endpoint')
					.setValue(this.plugin.settings.selectedProvider)
					.onChange(async (value: ProviderType) => {
						this.plugin.settings.selectedProvider = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show relevant settings
					})
			);

		// Provider-specific settings
		this.displayProviderSettings(containerEl);

		// Behavior Section
		containerEl.createEl('h2', { text: 'Behavior' });

		new Setting(containerEl)
			.setName('Auto-generate titles')
			.setDesc(
				'Automatically suggest titles for untitled notes when content threshold is reached'
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoGenerateEnabled)
					.onChange(async (value) => {
						this.plugin.settings.autoGenerateEnabled = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Content threshold (words)')
			.setDesc('Minimum number of words before auto-generating a title')
			.addSlider((slider) =>
				slider
					.setLimits(50, 500, 10)
					.setValue(this.plugin.settings.contentThresholdWords)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.contentThresholdWords = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Debounce delay (seconds)')
			.setDesc('Wait time after typing stops before generating title')
			.addSlider((slider) =>
				slider
					.setLimits(1, 10, 0.5)
					.setValue(this.plugin.settings.debounceDelayMs / 1000)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.debounceDelayMs = value * 1000;
						await this.plugin.saveSettings();
					})
			);

		// Generation Section
		containerEl.createEl('h2', { text: 'Title Generation' });

		new Setting(containerEl)
			.setName('Number of suggestions')
			.setDesc('How many title options to show')
			.addSlider((slider) =>
				slider
					.setLimits(1, 5, 1)
					.setValue(this.plugin.settings.numberOfSuggestions)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.numberOfSuggestions = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Max title length')
			.setDesc('Maximum number of characters for generated titles')
			.addSlider((slider) =>
				slider
					.setLimits(30, 100, 5)
					.setValue(this.plugin.settings.maxTitleLength)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.maxTitleLength = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Title style')
			.setDesc('The style of generated titles')
			.addDropdown((dropdown) => {
				TITLE_STYLES.forEach((style) => {
					dropdown.addOption(style.value, style.label);
				});
				return dropdown
					.setValue(this.plugin.settings.titleStyle)
					.onChange(async (value: TitleStyle) => {
						this.plugin.settings.titleStyle = value;
						await this.plugin.saveSettings();
					});
			});

		// File Handling Section
		containerEl.createEl('h2', { text: 'File Handling' });

		new Setting(containerEl)
			.setName('Rename file')
			.setDesc('Rename the file to match the selected title')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.renameFile)
					.onChange(async (value) => {
						this.plugin.settings.renameFile = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Update frontmatter title')
			.setDesc('Set the title property in YAML frontmatter')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.updateFrontmatterTitle)
					.onChange(async (value) => {
						this.plugin.settings.updateFrontmatterTitle = value;
						await this.plugin.saveSettings();
					})
			);

		// UI Section
		containerEl.createEl('h2', { text: 'Interface' });

		new Setting(containerEl)
			.setName('Show status bar')
			.setDesc('Display plugin status in the status bar')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showStatusBar)
					.onChange(async (value) => {
						this.plugin.settings.showStatusBar = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Show notifications')
			.setDesc('Display notifications for title generation events')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showNotifications)
					.onChange(async (value) => {
						this.plugin.settings.showNotifications = value;
						await this.plugin.saveSettings();
					})
			);

		// Test Connection Section
		containerEl.createEl('h2', { text: 'Test' });

		new Setting(containerEl)
			.setName('Test connection')
			.setDesc('Verify your API configuration works')
			.addButton((button) =>
				button.setButtonText('Test Connection').onClick(async () => {
					button.setDisabled(true);
					button.setButtonText('Testing...');

					try {
						const success = await this.plugin.testConnection();
						new Notice(
							success
								? 'Connection successful!'
								: 'Connection failed. Check your settings.'
						);
					} catch (error) {
						new Notice(`Error: ${(error as Error).message}`);
					}

					button.setDisabled(false);
					button.setButtonText('Test Connection');
				})
			);
	}

	private displayProviderSettings(containerEl: HTMLElement): void {
		const provider = this.plugin.settings.selectedProvider;

		switch (provider) {
			case 'openai':
				new Setting(containerEl)
					.setName('OpenAI API Key')
					.setDesc('Your OpenAI API key (starts with sk-)')
					.addText((text) =>
						text
							.setPlaceholder('sk-...')
							.setValue(this.plugin.settings.openaiApiKey)
							.onChange(async (value) => {
								this.plugin.settings.openaiApiKey = value;
								await this.plugin.saveSettings();
							})
					);

				new Setting(containerEl).setName('Model').addDropdown((dropdown) => {
					OPENAI_MODELS.forEach((model) => {
						dropdown.addOption(model.value, model.label);
					});
					return dropdown
						.setValue(this.plugin.settings.openaiModel)
						.onChange(async (value) => {
							this.plugin.settings.openaiModel = value;
							await this.plugin.saveSettings();
						});
				});
				break;

			case 'anthropic':
				new Setting(containerEl)
					.setName('Anthropic API Key')
					.setDesc('Your Anthropic API key')
					.addText((text) =>
						text
							.setPlaceholder('sk-ant-...')
							.setValue(this.plugin.settings.anthropicApiKey)
							.onChange(async (value) => {
								this.plugin.settings.anthropicApiKey = value;
								await this.plugin.saveSettings();
							})
					);

				new Setting(containerEl).setName('Model').addDropdown((dropdown) => {
					ANTHROPIC_MODELS.forEach((model) => {
						dropdown.addOption(model.value, model.label);
					});
					return dropdown
						.setValue(this.plugin.settings.anthropicModel)
						.onChange(async (value) => {
							this.plugin.settings.anthropicModel = value;
							await this.plugin.saveSettings();
						});
				});
				break;

			case 'ollama':
				new Setting(containerEl)
					.setName('Ollama Endpoint')
					.setDesc('URL of your Ollama server')
					.addText((text) =>
						text
							.setPlaceholder('http://localhost:11434')
							.setValue(this.plugin.settings.ollamaEndpoint)
							.onChange(async (value) => {
								this.plugin.settings.ollamaEndpoint = value;
								await this.plugin.saveSettings();
							})
					);

				new Setting(containerEl)
					.setName('Model')
					.setDesc('Name of the Ollama model to use')
					.addText((text) =>
						text
							.setPlaceholder('llama2, mistral, etc.')
							.setValue(this.plugin.settings.ollamaModel)
							.onChange(async (value) => {
								this.plugin.settings.ollamaModel = value;
								await this.plugin.saveSettings();
							})
					);
				break;

			case 'custom':
				new Setting(containerEl)
					.setName('Custom Endpoint')
					.setDesc('OpenAI-compatible API endpoint')
					.addText((text) =>
						text
							.setPlaceholder('https://api.example.com/v1/chat/completions')
							.setValue(this.plugin.settings.customEndpoint)
							.onChange(async (value) => {
								this.plugin.settings.customEndpoint = value;
								await this.plugin.saveSettings();
							})
					);

				new Setting(containerEl)
					.setName('API Key')
					.setDesc('API key for the custom endpoint')
					.addText((text) =>
						text
							.setValue(this.plugin.settings.customApiKey)
							.onChange(async (value) => {
								this.plugin.settings.customApiKey = value;
								await this.plugin.saveSettings();
							})
					);

				new Setting(containerEl)
					.setName('Model')
					.setDesc('Model identifier')
					.addText((text) =>
						text
							.setValue(this.plugin.settings.customModel)
							.onChange(async (value) => {
								this.plugin.settings.customModel = value;
								await this.plugin.saveSettings();
							})
					);
				break;
		}
	}
}
