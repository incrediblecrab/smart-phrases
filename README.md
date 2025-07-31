# Smart Phrases - VS Code Extension

Smart Phrases is a powerful VS Code extension that automatically expands text shortcuts as you type, helping you save time and increase productivity with a beautiful, Apple-inspired interface.

![Smart Phrases Logo](Group-21.png)

## ⚡ Features

- **Auto-expansion**: Type a trigger + space/tab/enter to instantly expand into full phrases
- **Beautiful UI**: Clean, Apple-inspired design with light/dark theme support
- **Easy Management**: Add, edit, and delete phrases through an intuitive panel
- **JSON Storage**: Your phrases are stored in a simple `smart-phrase.json` file
- **Secure**: Input validation and sanitization to ensure safety
- **Fast**: Optimized performance with minimal impact on your typing

## 🚀 Getting Started

1. Install the extension
2. The Smart Phrases panel opens automatically when VS Code starts
3. Add your first phrase by filling in the form
4. Start typing your trigger followed by space, tab, or enter to see it expand!

## 📝 Usage

### Adding a Phrase

1. Open the Smart Phrases panel (Command Palette → "Open Smart Phrases Panel")
2. Enter a **trigger keyword** (e.g., "addr")
3. Enter the **replacement phrase** (e.g., "123 Main Street, Anytown, ST 12345")
4. Click "Add Smart Phrase"

### Managing Phrases

- Click **"View All Phrases"** to see your saved phrases
- Click the **✏️ Edit** button to modify a phrase
- Click the **🗑️ Delete** button to remove a phrase

### Default Phrases

The extension comes with helpful defaults:
- `test` → `This is a test replacement!`
- `addr` → `123 Main Street, City, State 12345`
- `email` → `your.email@example.com`
- `sig` → `Best regards,\nYour Name`

## ⚙️ Storage

Your phrases are stored in:
- **Workspace**: `.vscode/smart-phrase.json` (if in a workspace)
- **Global**: `~/smart-phrase.json` (if not in a workspace)

### File Format

```json
{
  "addr": "123 Main Street, City, State 12345",
  "email": "john.doe@example.com",
  "sig": "Best regards,\\nJohn Doe",
  "meeting": "I'd like to schedule a meeting to discuss..."
}
```

## 🔒 Security

- **Trigger validation**: Only alphanumeric characters, hyphens, and underscores
- **Length limits**: Triggers max 50 chars, phrases max 1000 chars
- **XSS protection**: All content is properly escaped
- **File size limit**: Max 1MB for the triggers file
- **Trigger count limit**: Max 1000 triggers

## 💡 Examples

### Personal Information
- `myaddr` → Your full address
- `myphone` → Your phone number
- `myemail` → Your email address

### Common Phrases
- `ty` → `Thank you`
- `np` → `No problem`
- `brb` → `Be right back`
- `omw` → `On my way`

### Professional
- `mtg` → `meeting`
- `followup` → `I wanted to follow up on our previous conversation...`
- `regards` → `Best regards,\n[Your Name]`

### Development
- `lorem` → `Lorem ipsum dolor sit amet...`
- `todo` → `// TODO: `
- `fixme` → `// FIXME: `

## 🎨 Design

The extension features an Apple-inspired design with:
- Clean, minimal interface
- Light gray cards (#f9f9f9) in light theme
- Dark gray cards (#3a3a3c) in dark theme
- Apple blue (#007AFF) accent color
- Smooth animations and transitions
- Proper typography hierarchy

## ⚠️ Limitations

- Triggers must be alphanumeric (plus `-` and `_`)
- Case-insensitive matching (triggers are stored lowercase)
- Maximum 1000 triggers
- Maximum file size 1MB
- Works only in file-based documents (not in output panels, etc.)

## 🐛 Troubleshooting

### Phrases not expanding?
1. Make sure you're typing a space, tab, or enter after the trigger
2. Check that your trigger contains only valid characters
3. Verify the extension is active (panel should be visible)

### Can't see your phrases?
1. Click "View All Phrases" button
2. Check the Output panel for any errors (View → Output → Smart Phrases)

## 👤 Author

**Max Marquardt**  
Website: [https://mlot.ai](https://mlot.ai)

---

**Note**: This is a private extension. For support or questions, please contact the author directly.

Made with ❤️ and ☕ in VS Code