import { Notice, Plugin, TFile } from 'obsidian';
import { AutoTitleSettings, DEFAULT_SETTINGS } from './settings';
import { AutoTitleSettingTab } from './settingsTab';
import { ContentMonitor } from './services/contentMonitor';
import { TitleGenerator } from './services/titleGenerator';
import { FileRenamer } from './services/fileRenamer';
import { UntitledDetector } from './services/untitledDetector';
import { TitleSuggestionModal } from './ui/titleModal';
import { StatusIndicator } from './ui/statusIndicator';

export default class AutoTitlePlugin extends Plugin {
	settings: AutoTitleSettings;
	private contentMonitor: ContentMonitor;
	private titleGenerator: TitleGenerator;
	private fileRenamer: FileRenamer;
	private untitledDetector: UntitledDetector;
	private statusIndicator: StatusIndicator;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Initialize services
		this.untitledDetector = new UntitledDetector(this.settings.untitledPatterns);
		this.titleGenerator = new TitleGenerator(this.settings);
		this.fileRenamer = new FileRenamer(this.app);
		this.statusIndicator = new StatusIndicator(this);

		// Initialize content monitor with threshold callback
		this.contentMonitor = new ContentMonitor(this, this.settings, (file, content) =>
			this.handleThresholdReached(file, content)
		);

		// Start monitoring if auto-generation is enabled
		if (this.settings.autoGenerateEnabled) {
			this.contentMonitor.start();
		}

		// Show status bar if enabled
		if (this.settings.showStatusBar) {
			this.statusIndicator.show();
		}

		// Register command: Generate title for current note
		this.addCommand({
			id: 'generate-title',
			name: 'Generate title from content',
			callback: async () => {
				const file = this.app.workspace.getActiveFile();
				if (file) {
					await this.generateTitleForFile(file);
				} else {
					new Notice('No active file');
				}
			},
		});

		// Register command: Force regenerate title (even for non-untitled files)
		this.addCommand({
			id: 'regenerate-title',
			name: 'Regenerate title (force)',
			callback: async () => {
				const file = this.app.workspace.getActiveFile();
				if (file) {
					// Clear processed flag to allow regeneration
					this.contentMonitor.clearProcessed(file.path);
					await this.generateTitleForFile(file, true);
				} else {
					new Notice('No active file');
				}
			},
		});

		// Add settings tab
		this.addSettingTab(new AutoTitleSettingTab(this.app, this));

		console.log('Auto Title plugin loaded');
	}

	/**
	 * Handle when content monitor detects threshold reached for an untitled file
	 */
	private async handleThresholdReached(file: TFile, content: string): Promise<void> {
		// Double-check it's still an untitled file
		if (!this.untitledDetector.isUntitled(file.basename)) {
			return;
		}

		await this.generateTitleForFile(file);
	}

	/**
	 * Generate title suggestions for a file and show selection modal
	 */
	async generateTitleForFile(file: TFile, force = false): Promise<void> {
		// Prevent duplicate API calls
		if (this.contentMonitor.isInProgress(file.path)) {
			return;
		}

		try {
			// Mark as in progress to prevent duplicate triggers
			this.contentMonitor.markInProgress(file.path);
			this.statusIndicator.setProcessing();

			const content = await this.app.vault.cachedRead(file);
			const contentWithoutFrontmatter = this.stripFrontmatter(content);

			if (contentWithoutFrontmatter.length < 50) {
				if (this.settings.showNotifications) {
					new Notice('Not enough content to generate a title. Add more text first.');
				}
				this.statusIndicator.setIdle();
				this.contentMonitor.clearProcessed(file.path); // Clear in-progress flag
				return;
			}

			// Generate suggestions from AI
			const suggestions = await this.titleGenerator.generateTitles(contentWithoutFrontmatter);

			if (suggestions.length === 0) {
				if (this.settings.showNotifications) {
					new Notice('Could not generate title suggestions. Try adding more content.');
				}
				this.statusIndicator.setIdle();
				this.contentMonitor.clearProcessed(file.path); // Clear in-progress flag
				return;
			}

			this.statusIndicator.setIdle();

			// Mark as processed BEFORE showing modal - prevents re-triggering if user dismisses
			this.contentMonitor.markAsProcessed(file.path);

			// Show modal for user to select a title
			new TitleSuggestionModal(this.app, suggestions, async (selectedTitle) => {
				await this.applyTitle(file, selectedTitle);
			}).open();
		} catch (error) {
			const errorMessage = (error as Error).message;
			this.statusIndicator.setError(errorMessage);
			this.contentMonitor.clearProcessed(file.path); // Clear in-progress flag on error

			if (this.settings.showNotifications) {
				new Notice(`Auto Title Error: ${errorMessage}`);
			}

			console.error('Auto Title generation failed:', error);
		}
	}

	/**
	 * Apply the selected title to the file
	 */
	private async applyTitle(file: TFile, title: string): Promise<void> {
		try {
			// Mark as processed to prevent re-triggering auto-generation
			this.contentMonitor.markAsProcessed(file.path);

			if (this.settings.renameFile) {
				// Rename file and optionally update frontmatter
				const renamedFile = await this.fileRenamer.renameWithTitle(
					file,
					title,
					this.settings.updateFrontmatterTitle
				);

				// Update processed tracking with new path
				this.contentMonitor.clearProcessed(file.path);
				this.contentMonitor.markAsProcessed(renamedFile.path);

				if (this.settings.showNotifications) {
					new Notice(`Renamed to: ${title}`);
				}
			} else if (this.settings.updateFrontmatterTitle) {
				// Only update frontmatter, don't rename
				await this.fileRenamer.updateFrontmatterOnly(file, title);

				if (this.settings.showNotifications) {
					new Notice(`Title set to: ${title}`);
				}
			}
		} catch (error) {
			const errorMessage = (error as Error).message;

			if (this.settings.showNotifications) {
				new Notice(`Failed to apply title: ${errorMessage}`);
			}

			// Clear processed flag so user can try again
			this.contentMonitor.clearProcessed(file.path);

			console.error('Auto Title: Failed to apply title', error);
		}
	}

	/**
	 * Strip YAML frontmatter from content
	 */
	private stripFrontmatter(content: string): string {
		const match = content.match(/^---\s*\n[\s\S]*?\n---\s*\n?/);
		return match ? content.slice(match[0].length).trim() : content.trim();
	}

	/**
	 * Test the current AI provider connection
	 */
	async testConnection(): Promise<boolean> {
		return this.titleGenerator.testConnection();
	}

	/**
	 * Load settings from disk
	 */
	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Save settings to disk and update services
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);

		// Update services with new settings
		this.titleGenerator.updateProvider();
		this.untitledDetector = new UntitledDetector(this.settings.untitledPatterns);
		this.contentMonitor.updatePatterns(this.settings.untitledPatterns);

		// Toggle status bar visibility
		if (this.settings.showStatusBar) {
			this.statusIndicator.show();
		} else {
			this.statusIndicator.hide();
		}
	}

	onunload(): void {
		this.contentMonitor.stop();
		this.statusIndicator.hide();
		console.log('Auto Title plugin unloaded');
	}
}
