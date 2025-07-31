# Smart Phrases

Auto-complete smart phrases with trigger words for efficient typing in VS Code.

## Features

- **Trigger Word Expansion**: Type a trigger word and expand it to a full phrase
- **Multiple Trigger Options**: Choose between space, tab, or enter to trigger expansions
- **Easy Management**: Add, edit, and delete phrases through a clean UI
- **JSON File Editing**: Direct access to edit the phrases JSON file
- **Auto-completion Suggestions**: See available phrases as you type

## Usage

### Adding Phrases

1. Open Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux)
2. Run `Smart Phrases: Manage Smart Phrases`
3. Click "Add Phrase" 
4. Enter your trigger word (e.g., `addr`)
5. Enter the full phrase (e.g., `123 Main Street, City, State 12345`)
6. Click Save

### Using Phrases

Simply type your trigger word followed by your configured trigger key:
- **Space**: Type `addr ` → `123 Main Street, City, State 12345 `
- **Tab**: Type `addr[Tab]` → `123 Main Street, City, State 12345`
- **Enter**: Type `addr[Enter]` → `123 Main Street, City, State 12345`

### Managing Phrases

- **Edit**: Click the edit icon next to any phrase to modify it
- **Delete**: Click the delete icon to remove a phrase
- **Edit JSON**: Click "Edit JSON" to directly modify the phrases file

## Configuration

Configure trigger keys in VS Code settings:

- `smartPhrases.triggerOnSpace`: Trigger expansion with space (default: `true`)
- `smartPhrases.triggerOnTab`: Trigger expansion with tab (default: `true`)
- `smartPhrases.triggerOnEnter`: Trigger expansion with enter (default: `false`)

## Examples

Common use cases for smart phrases:

- **Addresses**: `addr` → `123 Main Street, City, State 12345`
- **Email Signatures**: `sig` → `Best regards,\nJohn Doe\njohn@example.com`
- **Code Snippets**: `lorem` → `Lorem ipsum dolor sit amet...`
- **URLs**: `gh` → `https://github.com/`
- **Phone Numbers**: `ph` → `+1 (555) 123-4567`

## Storage

Phrases are stored in a JSON file in your VS Code global storage directory. You can access this file directly through the "Edit JSON" button in the phrase manager.

## Requirements

- VS Code 1.74.0 or higher

## License

MIT License - see LICENSE file for details

## Author

Max Marquardt  
[https://mlot.ai](https://mlot.ai)