import type { App, TFile } from 'obsidian';

export class FileRenamer {
	constructor(private app: App) {}

	/**
	 * Rename a file with a new title and optionally update frontmatter
	 */
	async renameWithTitle(
		file: TFile,
		newTitle: string,
		updateFrontmatter: boolean
	): Promise<TFile> {
		const sanitizedTitle = this.sanitizeFilename(newTitle);

		// Update frontmatter first (before rename)
		if (updateFrontmatter) {
			await this.updateFrontmatter(file, newTitle);
		}

		// Calculate new path
		const folder = file.parent?.path || '';
		let newPath = folder ? `${folder}/${sanitizedTitle}.md` : `${sanitizedTitle}.md`;

		// Handle existing file with same name
		newPath = await this.getUniqueFilename(newPath);

		// Rename using Obsidian's API (auto-updates all links)
		await this.app.fileManager.renameFile(file, newPath);

		// Return the renamed file
		const renamedFile = this.app.vault.getAbstractFileByPath(newPath);
		return renamedFile as TFile;
	}

	/**
	 * Update only the frontmatter title without renaming the file
	 */
	async updateFrontmatterOnly(file: TFile, title: string): Promise<void> {
		await this.updateFrontmatter(file, title);
	}

	private async updateFrontmatter(file: TFile, title: string): Promise<void> {
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter.title = title;
		});
	}

	/**
	 * Sanitize a string to be used as a filename
	 */
	private sanitizeFilename(title: string): string {
		return (
			title
				// Remove/replace characters invalid in filenames
				.replace(/[\\/:*?"<>|]/g, '-')
				// Replace multiple spaces/dashes with single dash
				.replace(/[\s-]+/g, ' ')
				// Remove leading/trailing dots and spaces
				.replace(/^[\.\s]+|[\.\s]+$/g, '')
				// Trim to reasonable length
				.trim()
				.slice(0, 200)
		);
	}

	/**
	 * Get a unique filename by adding numeric suffix if needed
	 */
	private async getUniqueFilename(path: string): Promise<string> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!file) {
			return path;
		}

		// File exists, add numeric suffix
		const basePath = path.replace(/\.md$/, '');
		let counter = 1;
		let newPath = `${basePath} ${counter}.md`;

		while (this.app.vault.getAbstractFileByPath(newPath)) {
			counter++;
			newPath = `${basePath} ${counter}.md`;
		}

		return newPath;
	}
}
