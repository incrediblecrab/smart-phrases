# Change Log

All notable changes to the "Smart Phrases" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.1] - 2024-01-31

### Initial Release

#### Added
- Basic text replacement functionality
- Support for custom phrase definitions via settings
- Toggle command to enable/disable the extension
- Input validation for security
- Performance optimizations with Map-based storage
- Comprehensive error handling and logging
- Output channel for debugging
- Default replacements (brb, ty, np, btw)
- Case-insensitive phrase matching
- Multiple trigger characters (space, tab, newline, punctuation)

#### Security
- Input validation to prevent code injection
- Character limits on phrases (50) and replacements (500)
- Control character filtering
- Maximum replacements limit (100)