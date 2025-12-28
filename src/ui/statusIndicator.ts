import type { Plugin } from 'obsidian';

export class StatusIndicator {
	private statusBarItem: HTMLElement | null = null;

	constructor(private plugin: Plugin) {}

	/**
	 * Show the status bar item
	 */
	show(): void {
		if (!this.statusBarItem) {
			this.statusBarItem = this.plugin.addStatusBarItem();
			this.statusBarItem.addClass('auto-title-status');
		}
		this.setIdle();
	}

	/**
	 * Set status to idle/ready
	 */
	setIdle(): void {
		if (this.statusBarItem) {
			this.statusBarItem.setText('Auto Title');
			this.statusBarItem.removeClass('auto-title-status-processing');
			this.statusBarItem.removeAttribute('title');
		}
	}

	/**
	 * Set status to processing/generating
	 */
	setProcessing(): void {
		if (this.statusBarItem) {
			this.statusBarItem.setText('Auto Title: Generating...');
			this.statusBarItem.addClass('auto-title-status-processing');
		}
	}

	/**
	 * Set status to error with message
	 */
	setError(message: string): void {
		if (this.statusBarItem) {
			this.statusBarItem.setText('Auto Title: Error');
			this.statusBarItem.setAttr('title', message);
			this.statusBarItem.removeClass('auto-title-status-processing');
		}

		// Reset to idle after 5 seconds
		setTimeout(() => this.setIdle(), 5000);
	}

	/**
	 * Hide the status bar item
	 */
	hide(): void {
		if (this.statusBarItem) {
			this.statusBarItem.remove();
			this.statusBarItem = null;
		}
	}
}
