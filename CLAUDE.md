# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and GitHub Copilot CLI when working in this repository.

Smart Phrases is a VS Code extension that expands short triggers into saved phrases as you type, with a webview for managing the phrase list. It is published on the Marketplace as `maxs-lab-of-things.smart-phrases`. The repository is public.

## Commands

```bash
npm run compile      # tsc -p ./ -> out/
npm run watch
npm run lint         # eslint src --ext ts
npm test             # compile, lint, then @vscode/test-electron runs src/test/suite/*.test.ts
npx vsce package     # read the printed file list before publishing
```

`npm test` downloads a full VS Code build (about 900 MB) into `.vscode-test/` (gitignored) and on this machine then fails to launch it (`spawn ... Electron ENOENT`), so the suite does not currently run here. Delete `.vscode-test/` afterwards. Run the extension with F5 from VS Code.

## Structure

Expansion works by overriding VS Code's built-in `type` command in `src/extension.ts`: every keystroke in every editor passes through the handler, which forwards it with `default:type` and, on space, tab or enter (per the three `smartPhrases.triggerOn*` settings, overridable per phrase), checks whether the word before the cursor is a trigger and replaces it. Only one extension can own `type` at a time, so this conflicts with Vim-style extensions, and any exception or slow path in the handler is felt on every keypress; keep it fast and always fall through to `default:type`. A completion provider offers the same phrases in IntelliSense.

Phrases are stored by `src/phraseStorage.ts` in `smart-phrases.json` under the extension's `globalStorageUri`, shared across workspaces. `src/webviewPanel.ts` is the manager behind `smartPhrases.managePhrases`. The tracked `smart-phrase.json` is sample data and is not read by the code; it holds the owner's name and email in its `sig` example, so do not copy it into anything that ships.

## Releasing

`.vscodeignore` is the only control over what ships in the `.vsix`; `.gitignore` is ignored by `vsce`. The managed block in it is rewritten by a standardizing script, so add project-specific exclusions outside that block. `.vsce` sets the publisher and the base URLs used to rewrite relative README links. The README states the Marketplace version, so bump it with `package.json` and `CHANGELOG.md`. `PRODUCTION_READINESS.md` is a dated audit; the publishing procedure is in `../README.md`.
