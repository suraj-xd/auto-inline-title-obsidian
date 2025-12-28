import type { Plugin, TFile } from 'obsidian';
import type { AutoTitleSettings } from '../settings';
import { UntitledDetector } from './untitledDetector';

export class ContentMonitor {
	private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
	private processedFiles: Set<string> = new Set();
	private inProgressFiles: Set<string> = new Set();
	private untitledDetector: UntitledDetector;

	constructor(
		private plugin: Plugin,
		private settings: AutoTitleSettings,
		private onThresholdReached: (file: TFile, content: string) => void
	) {
		this.untitledDetector = new UntitledDetector(settings.untitledPatterns);
	}

	/**
	 * Start monitoring file modifications
	 */
	start(): void {
		this.plugin.registerEvent(
			this.plugin.app.vault.on('modify', (file) => {
				if (file instanceof Object && 'extension' in file) {
					const tFile = file as TFile;
					if (tFile.extension === 'md') {
						this.handleFileModification(tFile);
					}
				}
			})
		);
	}

	/**
	 * Handle a file modification event with debouncing
	 */
	private handleFileModification(file: TFile): void {
		// Skip if auto-generation is disabled
		if (!this.settings.autoGenerateEnabled) {
			return;
		}

		// Skip if already processed (title already generated or user dismissed)
		if (this.processedFiles.has(file.path)) {
			return;
		}

		// Skip if generation is already in progress for this file
		if (this.inProgressFiles.has(file.path)) {
			return;
		}

		// Skip if not an untitled file
		if (!this.untitledDetector.isUntitled(file.basename)) {
			return;
		}

		// Clear existing debounce timer for this file
		const existingTimer = this.debounceTimers.get(file.path);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		// Set new debounce timer
		const timer = setTimeout(async () => {
			await this.checkThreshold(file);
			this.debounceTimers.delete(file.path);
		}, this.settings.debounceDelayMs);

		this.debounceTimers.set(file.path, timer);
	}

	/**
	 * Check if file content meets the threshold for title generation
	 */
	private async checkThreshold(file: TFile): Promise<void> {
		try {
			// Re-check if file still exists and is untitled
			const currentFile = this.plugin.app.vault.getAbstractFileByPath(file.path);
			if (!currentFile || !(currentFile instanceof Object && 'extension' in currentFile)) {
				return;
			}

			const tFile = currentFile as TFile;
			if (!this.untitledDetector.isUntitled(tFile.basename)) {
				return;
			}

			const content = await this.plugin.app.vault.cachedRead(tFile);

			// Skip if frontmatter already has a title
			if (this.hasFrontmatterTitle(content)) {
				this.processedFiles.add(file.path);
				return;
			}

			const contentWithoutFrontmatter = this.stripFrontmatter(content);

			if (!this.meetsThreshold(contentWithoutFrontmatter)) {
				return;
			}

			// Threshold met - trigger callback
			this.onThresholdReached(tFile, contentWithoutFrontmatter);
		} catch (error) {
			console.error('Auto Title: Error checking threshold', error);
		}
	}

	/**
	 * Check if content has a title in frontmatter
	 */
	private hasFrontmatterTitle(content: string): boolean {
		const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
		if (!frontmatterMatch) {
			return false;
		}
		// Check if frontmatter contains a title field with a non-empty value
		const frontmatter = frontmatterMatch[1];
		const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
		return titleMatch !== null && titleMatch[1].trim().length > 0;
	}

	/**
	 * Check if content meets the word count threshold
	 */
	private meetsThreshold(content: string): boolean {
		const words = content.split(/\s+/).filter((w) => w.length > 0).length;
		return words >= this.settings.contentThresholdWords;
	}

	/**
	 * Strip YAML frontmatter from content
	 */
	private stripFrontmatter(content: string): string {
		const frontmatterRegex = /^---\s*\n[\s\S]*?\n---\s*\n?/;
		return content.replace(frontmatterRegex, '').trim();
	}

	/**
	 * Mark a file as processed (title already generated or user dismissed)
	 */
	markAsProcessed(filePath: string): void {
		this.processedFiles.add(filePath);
		this.inProgressFiles.delete(filePath);
	}

	/**
	 * Clear the processed flag for a file
	 */
	clearProcessed(filePath: string): void {
		this.processedFiles.delete(filePath);
		this.inProgressFiles.delete(filePath);
	}

	/**
	 * Mark a file as currently being processed (API call in flight)
	 */
	markInProgress(filePath: string): void {
		this.inProgressFiles.add(filePath);
	}

	/**
	 * Check if a file is currently being processed
	 */
	isInProgress(filePath: string): boolean {
		return this.inProgressFiles.has(filePath);
	}

	/**
	 * Update the untitled detector patterns
	 */
	updatePatterns(patterns: string[]): void {
		this.untitledDetector = new UntitledDetector(patterns);
	}

	/**
	 * Stop monitoring and clear all timers
	 */
	stop(): void {
		this.debounceTimers.forEach((timer) => clearTimeout(timer));
		this.debounceTimers.clear();
		this.inProgressFiles.clear();
	}
}
