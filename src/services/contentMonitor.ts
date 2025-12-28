import type { Plugin, TFile } from 'obsidian';
import type { AutoTitleSettings } from '../settings';
import { UntitledDetector } from './untitledDetector';

export class ContentMonitor {
	private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
	private processedFiles: Set<string> = new Set();
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

		// Skip if already processed (title already generated)
		if (this.processedFiles.has(file.path)) {
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
	 * Mark a file as processed (title already generated)
	 */
	markAsProcessed(filePath: string): void {
		this.processedFiles.add(filePath);
	}

	/**
	 * Clear the processed flag for a file
	 */
	clearProcessed(filePath: string): void {
		this.processedFiles.delete(filePath);
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
	}
}
