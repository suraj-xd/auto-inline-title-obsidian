# Obsidian Auto Title

An Obsidian plugin that automatically generates note titles using AI based on your content.

## Features

- **Auto-generates titles** when you write in untitled notes
- **Multiple AI providers**: OpenAI, Anthropic (Claude), Ollama (local), or custom endpoints
- **Smart triggering**: Waits for content threshold (default: 100 words) and debounces (3 seconds)
- **Title suggestions modal**: Pick from 3-5 AI-generated titles or type your own
- **YAML frontmatter**: Updates the `title` field automatically
- **Safe file renaming**: Uses Obsidian's API so all links auto-update

## Installation

### Manual Installation

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`)
2. Create folder: `<your-vault>/.obsidian/plugins/auto-title/`
3. Copy the files into that folder
4. Reload Obsidian
5. Enable "Auto Title" in Settings → Community plugins

### From Community Plugins (coming soon)

Search for "Auto Title" in Obsidian's Community Plugins browser.

## Configuration

1. Go to **Settings → Auto Title**
2. Select your AI provider
3. Enter your API key
4. Click "Test Connection" to verify
5. Adjust thresholds and title style as needed

### Supported Providers

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo |
| Anthropic | Claude 3 Haiku, Claude 3.5 Sonnet, Claude 3 Opus |
| Ollama | Any local model (llama2, mistral, etc.) |
| Custom | Any OpenAI-compatible API endpoint |

## Usage

### Automatic Mode
1. Create a new note (it will be named "Untitled")
2. Start writing your content
3. After ~100 words and 3 seconds of pause, a modal appears
4. Select a title or type your own

### Manual Mode
- Press `Cmd/Ctrl + P` → "Generate title from content"
- Or use "Regenerate title (force)" to regenerate for any note

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Auto-generate titles | On | Automatically suggest titles for untitled notes |
| Content threshold | 100 words | Minimum words before triggering |
| Debounce delay | 3 seconds | Wait time after typing stops |
| Number of suggestions | 3 | How many title options to show |
| Title style | Concise | concise, descriptive, question, or action |
| Rename file | On | Rename the file to match the title |
| Update frontmatter | On | Set the `title` property in YAML |

## Development

```bash
# Install dependencies
npm install

# Build (watch mode)
npm run dev

# Build (production)
npm run build
```

## License

MIT
