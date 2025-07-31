# Smart Phrases - VS Code Extension

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://marketplace.visualstudio.com/items?itemName=maxs-lab-of-things.smart-phrases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Smart Phrases is a VS Code extension that automatically replaces text abbreviations and shortcuts as you type, with a beautiful visual interface for managing your phrases.

## Features

- **Visual Interface**: Manage phrases through an Explorer sidebar view or rich webview panel
- **Auto-replacement**: Automatically expands abbreviations when you type trigger characters (space, tab, newline, punctuation)
- **Tree View**: See all your phrases at a glance in the Explorer sidebar
- **Web Manager**: Beautiful web-based interface for managing phrases
- **Categories**: Organize phrases by category (Common, Business, Personal, Code, Internet)
- **Import/Export**: Share your phrases with others or backup your configuration
- **Search**: Quickly find phrases in the manager
- **Case-insensitive**: Phrases are matched regardless of case
- **Secure**: Input validation prevents malicious code injection
- **Performance optimized**: Minimal impact on typing performance

## Installation

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P` to open the Quick Open dialog
3. Type `ext install maxs-lab-of-things.smart-phrases` and press Enter
4. Reload VS Code when prompted

Or install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=maxs-lab-of-things.smart-phrases).

## Usage

### Managing Phrases

#### Explorer View
1. Click the Smart Phrases icon in the Explorer sidebar
2. View all your phrases in a tree view
3. Click the + button to add new phrases
4. Right-click on any phrase to edit or delete

#### Web Manager
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run "Smart Phrases: Open Phrase Manager"
3. Use the beautiful web interface to:
   - Add new phrases with categories
   - Edit existing phrases
   - Delete phrases
   - Search through your phrases
   - View statistics

### Default Phrases

Smart Phrases comes with useful defaults:

- `brb` → `be right back`
- `ty` → `thank you`
- `np` → `no problem`
- `btw` → `by the way`
- `lol` → `laugh out loud`
- `omg` → `oh my god`
- `fyi` → `for your information`
- `asap` → `as soon as possible`

### Adding Phrases

#### Method 1: Quick Add (Command)
1. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Run "Smart Phrases: Add New Phrase"
3. Enter phrase, replacement, and category

#### Method 2: Explorer View
1. Click the + button in the Smart Phrases view
2. Follow the prompts

#### Method 3: Web Manager
1. Open the Phrase Manager
2. Fill in the form at the top
3. Click "Add Phrase"

### Commands

- **Toggle Smart Phrases**: Enable or disable auto-replacement
- **Open Phrase Manager**: Open the web-based phrase manager
- **Add New Phrase**: Quick add a new phrase
- **Refresh Phrases**: Refresh the phrase list
- **Export Phrases**: Export phrases to JSON file
- **Import Phrases**: Import phrases from JSON file

### Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `smartPhrases.enabled` | boolean | `true` | Enable or disable auto-replacement |

### Import/Export

Share your phrases with team members or backup your configuration:

#### Export
1. Command Palette → "Smart Phrases: Export Phrases"
2. Choose save location
3. Share the JSON file

#### Import
1. Command Palette → "Smart Phrases: Import Phrases"
2. Select a JSON file
3. Phrases will be merged with existing ones

## Security & Privacy

Smart Phrases is designed with security in mind:

- **Input validation**: All phrases and replacements are validated to prevent code injection
- **Character limits**: Phrases are limited to 50 characters, replacements to 500 characters
- **No network access**: The extension works completely offline
- **No data collection**: Your phrases and typing patterns are never collected or transmitted
- **Control character filtering**: Prevents injection of harmful control characters

## Limitations

- Phrases must contain only letters, numbers, underscores, and hyphens
- Maximum 100 custom replacements
- Replacements occur only when followed by trigger characters
- Case-insensitive matching (all phrases are converted to lowercase)

## Examples

### Personal Productivity

```json
{
  "smartPhrases.replacements": {
    "myemail": "john.doe@company.com",
    "myphone": "+1 (555) 123-4567",
    "myaddr": "123 Main St, Suite 100\nNew York, NY 10001",
    "mysig": "Best regards,\nJohn Doe\nSenior Developer"
  }
}
```

### Development Shortcuts

```json
{
  "smartPhrases.replacements": {
    "cl": "console.log(",
    "fn": "function",
    "ret": "return",
    "imp": "import",
    "exp": "export"
  }
}
```

### Common Phrases

```json
{
  "smartPhrases.replacements": {
    "afaik": "as far as I know",
    "imo": "in my opinion",
    "fyi": "for your information",
    "asap": "as soon as possible"
  }
}
```

## Troubleshooting

### Replacements not working?

1. Check that the extension is enabled (run "Toggle Smart Phrases" command)
2. Verify your phrases contain only valid characters (letters, numbers, `_`, `-`)
3. Ensure you're typing a trigger character after the phrase
4. Check the Output panel (View → Output → Smart Phrases) for error messages

### Performance issues?

- Reduce the number of replacements
- Avoid very long replacement texts
- Check for conflicting extensions

## Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/maxs-lab-of-things/smart-phrases).

## License

This extension is licensed under the [MIT License](LICENSE).

## Author

**Max Marquardt**  
Website: [https://mlot.ai](https://mlot.ai)  
Publisher: maxs-lab-of-things

---

Made with ❤️ by Max's Lab of Things