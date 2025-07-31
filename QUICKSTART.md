# Smart Phrases - Quick Start Guide

## 🚀 Getting Started in 2 Minutes

### 1. Install the Extension
- Open VS Code
- Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
- Search for "Smart Phrases"
- Click Install

### 2. Try It Out
Type any of these phrases followed by a space:
- `brb` → becomes "be right back"
- `ty` → becomes "thank you"
- `btw` → becomes "by the way"

### 3. Add Your Own Phrases
1. Press `Ctrl+,` (Windows/Linux) or `Cmd+,` (Mac) to open Settings
2. Search for "smart phrases"
3. Click "Edit in settings.json"
4. Add your custom replacements:

```json
{
  "smartPhrases.replacements": {
    "@@": "your.email@example.com",
    "addr": "123 Your Street, City, State",
    "sig": "Best regards,\nYour Name"
  }
}
```

### 4. Toggle On/Off
- Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
- Type "Toggle Smart Phrases"
- Press Enter

## 💡 Pro Tips

### Email Signatures
```json
"sig1": "Best regards,\nJohn Doe\nSoftware Engineer",
"sig2": "Thanks!\n- John"
```

### Code Snippets
```json
"clog": "console.log(",
"todo": "// TODO: ",
"fixme": "// FIXME: "
```

### Common Typos
```json
"teh": "the",
"recieve": "receive",
"occured": "occurred"
```

## ⚡ Trigger Characters
Replacements happen after typing:
- Space
- Tab
- Enter
- Punctuation (. , ! ? ; :)

## 🔒 Security Note
- Only alphanumeric characters, underscores, and hyphens allowed in phrases
- Replacements are sanitized to prevent code injection
- All processing happens locally - no data is sent anywhere

Happy typing! 🎉