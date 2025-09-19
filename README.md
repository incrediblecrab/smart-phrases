# Smart Phrases

![Version](https://img.shields.io/badge/version-0.0.3-blue.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-1.74.0+-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Boost your productivity with Smart Phrases - the intelligent text expansion extension for Visual Studio Code. Transform short trigger words into full phrases, signatures, code snippets, and more with just a keystroke.

## ✨ Features

- **⚡ Instant Text Expansion**: Type a trigger word and expand it to a full phrase
- **🎯 Flexible Triggers**: Choose between space, tab, or enter to trigger expansions
- **🎨 Intuitive Management UI**: Add, edit, and delete phrases through a clean, VS Code-native interface
- **📝 Direct JSON Editing**: Advanced users can directly edit the phrases JSON file
- **💡 IntelliSense Integration**: See available phrases as you type with auto-completion suggestions
- **🔒 Secure Storage**: All phrases stored securely in VS Code's global storage
- **🚀 Zero Configuration**: Works out of the box with sensible defaults

## 🚀 Getting Started

### Installation

1. Open VS Code
2. Press `Cmd+P` (macOS) or `Ctrl+P` (Windows/Linux)
3. Type `ext install maxs-lab-of-things.smart-phrases`
4. Press Enter to install

## 📖 Usage

### Adding Phrases

1. Open Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux)
2. Run `Smart Phrases: Manage Smart Phrases`
3. Click "Add Phrase" 
4. Enter your trigger word (e.g., `addr`)
5. Enter the full phrase (e.g., `123 Main Street, City, State 12345`)
6. Click Save

### Using Phrases

Simply type your trigger word followed by your configured trigger key:
- **Space**: Type `addr ` -> `123 Main Street, City, State 12345 `
- **Tab**: Type `addr[Tab]` -> `123 Main Street, City, State 12345`
- **Enter**: Type `addr[Enter]` -> `123 Main Street, City, State 12345`

### Managing Phrases

- **Edit**: Click the edit icon next to any phrase to modify it
- **Delete**: Click the delete icon to remove a phrase
- **Edit JSON**: Click "Edit JSON" to directly modify the phrases file

## Configuration

Configure trigger keys in VS Code settings:

- `smartPhrases.triggerOnSpace`: Trigger expansion with space (default: `true`)
- `smartPhrases.triggerOnTab`: Trigger expansion with tab (default: `true`)
- `smartPhrases.triggerOnEnter`: Trigger expansion with enter (default: `false`)

## 💡 Examples

Common use cases for smart phrases:

- **Addresses**: `addr` -> `123 Main Street, City, State 12345`
- **Email Signatures**: `sig` -> `Best regards,\nJohn Doe\njohn@example.com`
- **Code Snippets**: `lorem` -> `Lorem ipsum dolor sit amet...`
- **URLs**: `gh` -> `https://github.com/`
- **Phone Numbers**: `ph` -> `+1 (555) 123-4567`

## 📁 Storage

Phrases are stored securely in a JSON file within VS Code's global storage directory. You can access this file directly through the "Edit JSON" button in the phrase manager.

### Storage Location
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/maxs-lab-of-things.smart-phrases/`
- **Windows**: `%APPDATA%\Code\User\globalStorage\maxs-lab-of-things.smart-phrases\`
- **Linux**: `~/.config/Code/User/globalStorage/maxs-lab-of-things.smart-phrases/`

## 📋 Requirements

- Visual Studio Code 1.74.0 or higher
- No additional dependencies required

## 🔧 Troubleshooting

### Phrases not expanding?
1. Check that the trigger key is enabled in settings
2. Ensure there are no trailing spaces in your trigger word
3. Verify the phrase exists in the manager

### Can't see IntelliSense suggestions?
- Make sure you have at least 2 characters typed
- Check that VS Code's IntelliSense is enabled

## 🤝 Contributing

This is a private extension. For feature requests or bug reports, please contact the author.

## 🔐 Privacy

Smart Phrases respects your privacy:
- All data is stored locally on your machine
- No telemetry or usage data is collected
- No network requests are made

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Max Marquardt**  
🌐 [https://mlot.ai](https://mlot.ai)  
📧 Contact: Available at mlot.ai

---

**Publisher**: Max's Lab of Things (`maxs-lab-of-things`)  
**Version**: 0.0.3  
**Last Updated**: 2025