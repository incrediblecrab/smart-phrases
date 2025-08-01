# Smart Phrases Quick Start Guide

## Installation

1. Open VS Code
2. Press `Cmd+Shift+X` (macOS) or `Ctrl+Shift+X` (Windows/Linux) to open Extensions
3. Search for "Smart Phrases"
4. Click Install

## First Steps

### 1. Add Your First Phrase

1. Open Command Palette: `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Smart Phrases: Manage Smart Phrases" and press Enter
3. Click "Add Phrase"
4. Enter a trigger word (e.g., `email`)
5. Enter the full phrase (e.g., `john.doe@example.com`)
6. Click Save

### 2. Use Your Phrase

Type your trigger word followed by:
- **Space**: `email ` -> `john.doe@example.com `
- **Tab**: `email[Tab]` -> `john.doe@example.com`
- **Enter**: `email[Enter]` -> `john.doe@example.com`

### 3. Configure Triggers

1. Open VS Code Settings: `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
2. Search for "Smart Phrases"
3. Toggle your preferred triggers:
   - `smartPhrases.triggerOnSpace`
   - `smartPhrases.triggerOnTab`
   - `smartPhrases.triggerOnEnter`

## Common Use Cases

### Email Signatures
- Trigger: `sig`
- Phrase: `Best regards,\n[Your Name]\n[Your Email]`

### Addresses
- Trigger: `addr`
- Phrase: `123 Main Street, City, State 12345`

### Code Snippets
- Trigger: `console`
- Phrase: `console.log('Debug:', );`

### URLs
- Trigger: `repo`
- Phrase: `https://github.com/yourusername/`

## Tips

- Keep triggers short but memorable
- Use prefixes for categories (e.g., `u-email` for user email, `w-addr` for work address)
- Edit the JSON file directly for bulk changes
- Auto-completion shows available phrases as you type