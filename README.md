# smart-phrases

![Version](https://img.shields.io/visual-studio-marketplace/v/maxs-lab-of-things.smart-phrases) ![MLoT](https://img.shields.io/badge/MLoT-ai-blue)

Smart Phrases is a VS Code extension for expanding short trigger words into saved phrases while typing. It is published on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=maxs-lab-of-things.smart-phrases) as `maxs-lab-of-things.smart-phrases`; the published version is 1.5.1, matching this repository.

![Demo](https://raw.githubusercontent.com/incrediblecrab/mlot-developer-media/main/gifs/smart-phrases.gif)

**Objective:** make repeated text, signatures and snippets available through a local phrase manager and completion provider.

**Inputs:** VS Code 1.74.0 or later. Phrases are stored locally in VS Code global storage as `smart-phrases.json` under this extension's global storage directory.

**Files:**

- [`src/`](src/): the TypeScript extension source, phrase storage, completion provider, webview panel and tests
- [`media/`](media/): JavaScript and CSS loaded by the phrase manager webview
- [`package.json`](package.json): extension metadata, command, settings and npm scripts
- [`smart-phrase.json`](smart-phrase.json): sample phrase data
- [`QUICKSTART.md`](QUICKSTART.md): quick-start documentation
- [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md): production-readiness notes
- [`CHANGELOG.md`](CHANGELOG.md): release history
- [`Group-21.png`](Group-21.png): Marketplace image asset
- [`tsconfig.json`](tsconfig.json): TypeScript compiler settings

**Try it:** install the published build with `ext install maxs-lab-of-things.smart-phrases`. For local development, run `npm install`, then `npm run compile`, and launch the extension host from VS Code.

## Usage

Run `Smart Phrases: Manage Smart Phrases` from the Command Palette to open the manager. Add a trigger, enter the phrase text and choose whether that phrase expands on space, tab or enter.

To use a phrase, type its trigger and press an enabled trigger key. Space and tab are enabled by default; enter is disabled by default. Phrase-specific trigger choices override the global settings when they are present.

The extension also registers a completion provider for file-backed documents. As you type a non-whitespace word, matching phrase triggers appear as snippet completions and insert the phrase text.

The phrase manager can add, edit, delete and refresh phrases. Its "Edit JSON" button opens the local storage file directly for advanced edits.

## Commands

| Command | Title | Where it appears |
| --- | --- | --- |
| `smartPhrases.managePhrases` | Manage Smart Phrases | Command Palette |

## Settings

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `smartPhrases.triggerOnSpace` | boolean | `true` | Expand a phrase when space is typed |
| `smartPhrases.triggerOnTab` | boolean | `true` | Expand a phrase when tab is typed |
| `smartPhrases.triggerOnEnter` | boolean | `false` | Expand a phrase when enter is typed |

## Storage and privacy

Phrases are read from and written to a JSON file in VS Code global storage. The extension code does not make network requests or send phrase data to a service.

Typical storage roots are `~/Library/Application Support/Code/User/globalStorage/maxs-lab-of-things.smart-phrases/` on macOS, `%APPDATA%\Code\User\globalStorage\maxs-lab-of-things.smart-phrases\` on Windows and `~/.config/Code/User/globalStorage/maxs-lab-of-things.smart-phrases/` on Linux.

## Development

- `npm run compile`: compile TypeScript with `tsc -p ./`
- `npm run watch`: compile in watch mode
- `npm run lint`: run ESLint on `src`
- `npm run test`: run the VS Code extension test runner from `out/test/runTest.js`

Do not publish from this repository unless the package metadata and Marketplace release are intentionally being updated. This package does not define `package` or `publish` npm scripts.

## Links

- [Marketplace listing](https://marketplace.visualstudio.com/items?itemName=maxs-lab-of-things.smart-phrases)
- [Demo video](https://youtu.be/jB53t0MyVI8)
- [MLoT product page](https://mlot.ai/smart-phrases/)
- [Privacy policy](https://mlot.ai/privacy/)
- Publisher: [Max's Lab of Things](https://mlot.ai/)

## License

MIT. See [`LICENSE`](LICENSE).
