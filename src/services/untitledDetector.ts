import type { TFile } from 'obsidian';

export class UntitledDetector {
	private patterns: RegExp[];

	constructor(patternStrings: string[]) {
		this.patterns = patternStrings.map((p) => new RegExp(`^${p}$`, 'i'));
	}

	/**
	 * Check if a filename matches the untitled patterns
	 */
	isUntitled(filename: string): boolean {
		const nameWithoutExt = filename.replace(/\.md$/i, '');
		return this.patterns.some((pattern) => pattern.test(nameWithoutExt));
	}

	/**
	 * Check if a file is likely untitled (matches pattern or recently created with generic name)
	 */
	isLikelyUntitled(file: TFile): boolean {
		if (this.isUntitled(file.basename)) {
			return true;
		}

		// Check if created in last 5 minutes and has very short/generic name
		const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
		if (file.stat.ctime > fiveMinutesAgo) {
			// Avoid touching daily notes (date patterns)
			const datePattern = /^\d{4}-\d{2}-\d{2}/;
			if (!datePattern.test(file.basename)) {
				// Check for very short or numeric names that might be auto-generated
				if (file.basename.length <= 3 || /^\d+$/.test(file.basename)) {
					return true;
				}
			}
		}

		return false;
	}
}
