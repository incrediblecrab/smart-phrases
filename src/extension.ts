import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Constants
const triggerChars = [' ', '\t', '\n'];
const maxTriggerLength = 50;
const maxPhraseLength = 1000;
const jsonFilename = 'smart-phrase.json';

// Interfaces
interface TriggerPhrase {
    trigger: string;
    phrase: string;
}

interface TriggersData {
    [key: string]: string;
}

// Global state
let triggers: Map<string, string> = new Map();
let panel: vscode.WebviewPanel | undefined = undefined;
let outputChannel: vscode.OutputChannel;
let lastTextChangeTime = 0;
const TEXT_CHANGE_THROTTLE_MS = 50; // Throttle text changes to prevent performance issues

export function activate(context: vscode.ExtensionContext): void {
    // Initialize output channel for debugging
    outputChannel = vscode.window.createOutputChannel('Smart Phrases');
    outputChannel.appendLine('Smart Phrases extension activated');
    
    try {
        // Load triggers from JSON file
        loadTriggersFromFile();
        
        // Show the simple panel immediately when extension activates
        showSimplePanel();
        
        // Register commands
        const openPanelCommand = vscode.commands.registerCommand('smartPhrases.openPanel', () => {
            showSimplePanel();
        });
        
        // Listen for text changes to do auto-replacement
        const textChangeDisposable = vscode.workspace.onDidChangeTextDocument(handleTextChange);
        
        // Register disposables
        context.subscriptions.push(
            openPanelCommand,
            textChangeDisposable,
            outputChannel
        );
        
        outputChannel.appendLine('Smart Phrases extension fully initialized');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        outputChannel.appendLine(`ERROR: Failed to activate extension - ${errorMessage}`);
        vscode.window.showErrorMessage(`Smart Phrases: Failed to activate - ${errorMessage}`);
    }
}
// Event handlers
function handleTextChange(event: vscode.TextDocumentChangeEvent): void {
    try {
        // Performance: Throttle rapid text changes
        const now = Date.now();
        if (now - lastTextChangeTime < TEXT_CHANGE_THROTTLE_MS) {
            return;
        }
        lastTextChangeTime = now;
        
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || event.document !== activeEditor.document) {
            return;
        }
        
        // Performance: Skip non-text documents
        if (event.document.languageId === 'log' || event.document.uri.scheme !== 'file') {
            return;
        }
        
        if (event.contentChanges.length === 0) {
            return;
        }
        
        const change = event.contentChanges[0];
        const changedText = change.text;
        
        // Check if user typed a trigger character
        if (triggerChars.includes(changedText)) {
            checkAndReplace(activeEditor, change.range.start);
        }
    } catch (error) {
        handleError('Error in text change handler', error);
    }
}

function checkAndReplace(editor: vscode.TextEditor, position: vscode.Position): void {
    try {
        const document = editor.document;
        const lineText = document.lineAt(position.line).text;
        const textBeforeCursor = lineText.substring(0, position.character);
        
        // Find the word before the cursor (before the trigger character)
        const words = textBeforeCursor.split(/\s+/);
        const lastWord = words[words.length - 1];
        
        if (lastWord && triggers.has(lastWord.toLowerCase())) {
            const replacement = triggers.get(lastWord.toLowerCase())!;
            
            // Calculate the range to replace (the trigger word)
            const startPos = new vscode.Position(position.line, position.character - lastWord.length);
            const endPos = position;
            const range = new vscode.Range(startPos, endPos);
            
            // Replace the trigger with the phrase
            editor.edit(editBuilder => {
                editBuilder.replace(range, replacement);
            }, { undoStopBefore: false, undoStopAfter: false });
            
            outputChannel.appendLine(`Replaced "${lastWord}" with "${replacement}"`);
        }
    } catch (error) {
        handleError('Error during text replacement', error);
    }
}

// File operations
function getJsonFilePath(): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        return path.join(workspaceFolder.uri.fsPath, jsonFilename);
    }
    // Fallback to user's home directory
    return path.join(os.homedir(), jsonFilename);
}

function loadTriggersFromFile(): void {
    const filePath = getJsonFilePath();
    
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            
            // Security: Check file size (max 1MB)
            if (stats.size > 1048576) {
                throw new Error('Triggers file too large (max 1MB)');
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            if (!content.trim()) {
                throw new Error('File is empty');
            }
            
            // Security: Parse JSON safely
            let data: TriggersData;
            try {
                data = JSON.parse(content);
            } catch (parseError) {
                throw new Error('Invalid JSON format');
            }
            
            if (typeof data !== 'object' || data === null || Array.isArray(data)) {
                throw new Error('Invalid JSON format - expected object');
            }
            
            triggers.clear();
            let loadedCount = 0;
            let skippedCount = 0;
            
            // Security: Limit number of triggers (max 1000)
            const entries = Object.entries(data);
            if (entries.length > 1000) {
                outputChannel.appendLine('Warning: Limiting to first 1000 triggers');
                entries.length = 1000;
            }
            
            for (const [trigger, phrase] of entries) {
                if (isValidTrigger(trigger) && isValidPhrase(phrase)) {
                    triggers.set(trigger.toLowerCase(), phrase);
                    loadedCount++;
                } else {
                    skippedCount++;
                    if (skippedCount <= 10) { // Limit log spam
                        outputChannel.appendLine(`Skipped invalid trigger: "${trigger}" -> "${phrase}"`);
                    }
                }
            }
            
            if (skippedCount > 10) {
                outputChannel.appendLine(`... and ${skippedCount - 10} more invalid triggers`);
            }
            
            outputChannel.appendLine(`Loaded ${loadedCount} triggers from ${filePath}`);
        } else {
            createDefaultTriggersFile(filePath);
        }
    } catch (error) {
        handleError(`Error loading triggers from ${filePath}`, error);
        createDefaultTriggersFile(filePath);
    }
}

function createDefaultTriggersFile(filePath: string): void {
    try {
        const defaultTriggers: TriggersData = {
            "test": "This is a test replacement!",
            "addr": "123 Main Street, City, State 12345",
            "email": "your.email@example.com",
            "sig": "Best regards,\\nYour Name"
        };
        
        fs.writeFileSync(filePath, JSON.stringify(defaultTriggers, null, 2), 'utf8');
        
        triggers.clear();
        for (const [trigger, phrase] of Object.entries(defaultTriggers)) {
            triggers.set(trigger.toLowerCase(), phrase);
        }
        
        outputChannel.appendLine(`Created default ${jsonFilename} at ${filePath}`);
        vscode.window.showInformationMessage(`Created default ${jsonFilename} with sample triggers`);
    } catch (error) {
        handleError(`Error creating default triggers file at ${filePath}`, error);
    }
}

function saveTriggersToFile(): void {
    const filePath = getJsonFilePath();
    
    try {
        const data: TriggersData = {};
        for (const [trigger, phrase] of triggers) {
            data[trigger] = phrase;
        }
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        outputChannel.appendLine(`Saved ${triggers.size} triggers to ${filePath}`);
    } catch (error) {
        handleError(`Error saving triggers to ${filePath}`, error);
    }
}

// Validation functions
function isValidTrigger(trigger: string): boolean {
    return typeof trigger === 'string' && 
           trigger.length > 0 && 
           trigger.length <= maxTriggerLength &&
           /^[a-zA-Z0-9_-]+$/.test(trigger);
}

function isValidPhrase(phrase: string): boolean {
    return typeof phrase === 'string' && 
           phrase.length > 0 && 
           phrase.length <= maxPhraseLength &&
           !containsControlCharacters(phrase);
}

function containsControlCharacters(text: string): boolean {
    // Check for control characters except newline and tab
    return /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text);
}

function sanitizeInput(input: string): string {
    return input.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Error handling
function handleError(message: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`ERROR: ${message} - ${errorMessage}`);
    console.error(message, error);
}

// UI functions
function showSimplePanel(): void {
    try {
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (panel) {
            panel.reveal(columnToShowIn);
            return;
        }

        panel = vscode.window.createWebviewPanel(
            'smartPhrases',
            'Smart Phrases - Add Triggers & Phrases',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: []
            }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(
            message => {
                try {
                    switch (message.command) {
                        case 'addTrigger':
                            addTriggerPhrase(message.trigger, message.phrase);
                            break;
                        case 'showTriggers':
                            showSavedTriggers();
                            break;
                        case 'loadTriggers':
                            sendTriggersToWebview();
                            break;
                        case 'deleteTrigger':
                            deleteTrigger(message.trigger);
                            break;
                        case 'editTrigger':
                            editTrigger(message.oldTrigger, message.newTrigger, message.newPhrase);
                            break;
                        case 'getAllTriggers':
                            sendAllTriggersToWebview();
                            break;
                        default:
                            outputChannel.appendLine(`Unknown webview command: ${message.command}`);
                    }
                } catch (error) {
                    handleError('Error handling webview message', error);
                }
            }
        );

        panel.onDidDispose(() => {
            panel = undefined;
        });
        
        // Send current triggers to webview
        setTimeout(() => sendTriggersToWebview(), 100);
        
        outputChannel.appendLine('Smart Phrases panel opened');
    } catch (error) {
        handleError('Error opening panel', error);
    }
}

function addTriggerPhrase(trigger: string, phrase: string): void {
    try {
        // Sanitize inputs
        const cleanTrigger = sanitizeInput(trigger);
        const cleanPhrase = sanitizeInput(phrase);
        
        // Validate inputs
        if (!isValidTrigger(cleanTrigger)) {
            vscode.window.showErrorMessage(
                `Invalid trigger: Must be 1-${maxTriggerLength} characters, alphanumeric/underscore/hyphen only`
            );
            return;
        }
        
        if (!isValidPhrase(cleanPhrase)) {
            vscode.window.showErrorMessage(
                `Invalid phrase: Must be 1-${maxPhraseLength} characters, no control characters`
            );
            return;
        }
        
        triggers.set(cleanTrigger.toLowerCase(), cleanPhrase);
        saveTriggersToFile();
        
        vscode.window.showInformationMessage(`Added trigger: "${cleanTrigger}" → "${cleanPhrase}"`);
        outputChannel.appendLine(`Added trigger: "${cleanTrigger}" → "${cleanPhrase}"`);
        
        if (panel) {
            panel.webview.postMessage({ 
                command: 'triggerAdded', 
                trigger: cleanTrigger, 
                phrase: cleanPhrase,
                total: triggers.size
            });
        }
    } catch (error) {
        handleError('Error adding trigger phrase', error);
    }
}

function sendTriggersToWebview(): void {
    try {
        if (panel) {
            panel.webview.postMessage({
                command: 'updateCount',
                total: triggers.size
            });
        }
    } catch (error) {
        handleError('Error sending triggers to webview', error);
    }
}

function deleteTrigger(trigger: string): void {
    try {
        const lowerTrigger = trigger.toLowerCase();
        if (triggers.has(lowerTrigger)) {
            triggers.delete(lowerTrigger);
            saveTriggersToFile();
            
            vscode.window.showInformationMessage(`Deleted trigger: "${trigger}"`);
            outputChannel.appendLine(`Deleted trigger: "${trigger}"`);
            
            if (panel) {
                panel.webview.postMessage({ 
                    command: 'triggerDeleted', 
                    trigger: trigger,
                    total: triggers.size
                });
            }
        } else {
            outputChannel.appendLine(`Trigger not found for deletion: "${trigger}" (lowercase: "${lowerTrigger}")`);
        }
    } catch (error) {
        handleError('Error deleting trigger', error);
    }
}

function editTrigger(oldTrigger: string, newTrigger: string, newPhrase: string): void {
    try {
        // Sanitize inputs
        const cleanNewTrigger = sanitizeInput(newTrigger);
        const cleanNewPhrase = sanitizeInput(newPhrase);
        
        // Validate inputs
        if (!isValidTrigger(cleanNewTrigger)) {
            vscode.window.showErrorMessage(
                `Invalid trigger: Must be 1-${maxTriggerLength} characters, alphanumeric/underscore/hyphen only`
            );
            return;
        }
        
        if (!isValidPhrase(cleanNewPhrase)) {
            vscode.window.showErrorMessage(
                `Invalid phrase: Must be 1-${maxPhraseLength} characters, no control characters`
            );
            return;
        }
        
        // Delete old trigger if it exists (check lowercase)
        const lowerOldTrigger = oldTrigger.toLowerCase();
        if (triggers.has(lowerOldTrigger)) {
            triggers.delete(lowerOldTrigger);
        }
        
        // Add new trigger
        triggers.set(cleanNewTrigger.toLowerCase(), cleanNewPhrase);
        saveTriggersToFile();
        
        vscode.window.showInformationMessage(`Updated trigger: "${oldTrigger}" → "${cleanNewTrigger}"`);
        outputChannel.appendLine(`Updated trigger: "${oldTrigger}" → "${cleanNewTrigger}"`);
        
        if (panel) {
            panel.webview.postMessage({ 
                command: 'triggerEdited', 
                oldTrigger: oldTrigger,
                newTrigger: cleanNewTrigger,
                newPhrase: cleanNewPhrase,
                total: triggers.size
            });
        }
    } catch (error) {
        handleError('Error editing trigger', error);
    }
}

function sendAllTriggersToWebview(): void {
    try {
        if (panel) {
            const triggersArray = Array.from(triggers.entries()).map(([trigger, phrase]) => ({
                trigger: trigger,
                phrase: phrase
            }));
            
            panel.webview.postMessage({
                command: 'allTriggers',
                triggers: triggersArray,
                total: triggers.size
            });
        }
    } catch (error) {
        handleError('Error sending all triggers to webview', error);
    }
}

function showSavedTriggers(): void {
    try {
        if (triggers.size === 0) {
            vscode.window.showInformationMessage('No triggers saved yet!');
            return;
        }
        
        const items = Array.from(triggers.entries()).map(([trigger, phrase]) => ({
            label: trigger,
            description: phrase.length > 50 ? phrase.substring(0, 47) + '...' : phrase,
            detail: phrase
        }));
        
        vscode.window.showQuickPick(items, {
            placeHolder: `Your ${triggers.size} saved triggers and phrases`
        });
    } catch (error) {
        handleError('Error showing saved triggers', error);
    }
}
function getWebviewContent(): string {
    const nonce = getNonce();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${panel.webview.cspSource} https:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Smart Phrases</title>
    <style>
        /* Apple-inspired CSS Variables */
        :root {
            --system-background: var(--vscode-editor-background);
            --secondary-background: var(--vscode-sideBar-background);
            --tertiary-background: var(--vscode-input-background);
            --quaternary-background: var(--vscode-panel-background);
            
            /* Apple's actual light gray colors */
            --apple-gray-1: #f2f2f7; /* Light mode card background */
            --apple-gray-2: #e5e5ea; /* Light mode border */
            --apple-gray-3: #d1d1d6; /* Darker gray for borders */
            --apple-gray-dark: #1c1c1e; /* Dark mode card background */
            
            --label-primary: var(--vscode-foreground);
            --label-secondary: var(--vscode-descriptionForeground);
            --label-tertiary: color-mix(in srgb, var(--vscode-foreground) 60%, transparent);
            
            /* Apple's signature blue */
            --apple-blue: #007AFF;
            --apple-blue-hover: #0051D5;
            --accent-color: var(--apple-blue);
            --accent-hover: var(--apple-blue-hover);
            --destructive-color: #FF3B30; /* Apple red */
            
            --border-primary: var(--vscode-input-border);
            --border-secondary: color-mix(in srgb, var(--vscode-input-border) 50%, transparent);
            
            --success-color: var(--vscode-terminal-ansiGreen);
            --success-background: color-mix(in srgb, var(--vscode-terminal-ansiGreen) 10%, var(--system-background));
            
            /* Apple spacing system - 8pt base grid */
            --spacing-xs: 4px;   /* 0.5 units */
            --spacing-sm: 8px;   /* 1 unit */
            --spacing-md: 16px;  /* 2 units */
            --spacing-lg: 24px;  /* 3 units */
            --spacing-xl: 32px;  /* 4 units */
            --spacing-xxl: 48px; /* 6 units */
            
            /* Apple typography scale */
            --text-large-title: 34px;
            --text-title-1: 28px;
            --text-title-2: 22px;
            --text-title-3: 20px;
            --text-headline: 17px;
            --text-body: 17px;
            --text-callout: 16px;
            --text-subhead: 15px;
            --text-footnote: 13px;
            --text-caption-1: 12px;
            --text-caption-2: 11px;
            
            /* Apple corner radius */
            --radius-sm: 6px;
            --radius-md: 8px;
            --radius-lg: 12px;
            --radius-xl: 16px;
            --radius-full: 50px;
            
            /* Shadows for depth */
            --shadow-sm: 0 1px 3px color-mix(in srgb, var(--vscode-widget-shadow) 12%, transparent);
            --shadow-md: 0 4px 12px color-mix(in srgb, var(--vscode-widget-shadow) 15%, transparent);
            --shadow-lg: 0 8px 24px color-mix(in srgb, var(--vscode-widget-shadow) 20%, transparent);
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            padding: var(--spacing-xl);
            color: var(--label-primary);
            background: var(--system-background);
            line-height: 1.47; /* Apple's preferred line height */
            font-size: var(--text-body);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .container {
            max-width: 720px; /* Desktop-optimized width */
            margin: 0 auto;
        }
        
        /* Apple-style header with better hierarchy */
        .header {
            text-align: center;
            margin-bottom: var(--spacing-xxl);
        }
        
        .app-icon {
            font-size: 48px;
            margin-bottom: var(--spacing-md);
            display: block;
            filter: drop-shadow(var(--shadow-sm));
        }
        
        h1 {
            font-size: var(--text-title-1);
            font-weight: 600;
            color: var(--label-primary);
            margin: 0 0 var(--spacing-sm) 0;
            letter-spacing: -0.02em; /* Apple's title letter spacing */
        }
        
        .subtitle {
            font-size: var(--text-callout);
            color: var(--label-secondary);
            font-weight: 400;
            margin: 0;
        }
        
        /* Apple-style information card */
        .info-card {
            background: var(--apple-gray-1);
            border: none;
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            margin-bottom: var(--spacing-xl);
            box-shadow: var(--shadow-sm);
        }
        
        /* VS Code dark theme detection */
        body[class*="vscode-dark"] .info-card,
        body[class*="vscode-high-contrast"] .info-card {
            background: #3a3a3c; /* Lighter Apple dark gray */
            color: #ffffff;
        }
        
        body[class*="vscode-light"] .info-card {
            background: #f9f9f9; /* Lighter Apple gray - almost white */
            color: #000000;
        }
        
        .info-card h3 {
            font-size: var(--text-headline);
            font-weight: 600;
            color: var(--label-primary);
            margin: 0 0 var(--spacing-md) 0;
        }
        
        .info-item {
            margin-bottom: var(--spacing-md);
        }
        
        .info-item:last-child {
            margin-bottom: 0;
        }
        
        .info-label {
            font-weight: 600;
            color: var(--label-primary);
        }
        
        .info-description {
            color: var(--label-secondary);
            margin-top: var(--spacing-xs);
            font-size: var(--text-subhead);
        }
        
        /* Apple-style form */
        .form-container {
            background: var(--apple-gray-1);
            border: none;
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            margin-bottom: var(--spacing-lg);
            box-shadow: var(--shadow-sm);
        }
        
        body[class*="vscode-dark"] .form-container,
        body[class*="vscode-high-contrast"] .form-container {
            background: #3a3a3c; /* Lighter Apple dark gray */
        }
        
        body[class*="vscode-light"] .form-container {
            background: #f9f9f9; /* Lighter Apple gray - almost white */
        }
        
        .form-group {
            margin-bottom: var(--spacing-lg);
        }
        
        .form-group:last-of-type {
            margin-bottom: var(--spacing-xl);
        }
        
        label {
            display: block;
            font-size: var(--text-callout);
            font-weight: 500;
            color: var(--label-primary);
            margin-bottom: var(--spacing-sm);
        }
        
        /* Apple-style input fields */
        input, textarea {
            width: 100%;
            padding: var(--spacing-md);
            border: 1.5px solid var(--border-primary);
            background-color: var(--system-background);
            color: var(--label-primary);
            font-family: inherit;
            font-size: var(--text-body);
            border-radius: var(--radius-md);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            min-height: 44px; /* Apple minimum touch target */
        }
        
        input::placeholder, textarea::placeholder {
            color: var(--label-tertiary);
            font-weight: 400;
        }
        
        input:focus, textarea:focus {
            outline: none;
            border-color: var(--accent-color);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 20%, transparent);
            transform: translateY(-1px);
        }
        
        textarea {
            min-height: 88px; /* 2x touch target for multiline */
            resize: vertical;
            font-family: inherit;
        }
        
        /* Apple-style button system */
        .button-group {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
        }
        
        button {
            min-height: 44px; /* Apple touch target */
            padding: var(--spacing-md) var(--spacing-lg);
            border: none;
            border-radius: var(--radius-full); /* Apple's capsule buttons */
            font-size: var(--text-callout);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        /* Primary button - Apple blue */
        .primary-btn {
            background: var(--accent-color);
            color: var(--vscode-button-foreground);
            box-shadow: var(--shadow-sm);
        }
        
        .primary-btn:hover {
            background: var(--accent-hover);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }
        
        .primary-btn:active {
            transform: translateY(0);
            box-shadow: var(--shadow-sm);
        }
        
        /* Secondary button - subtle */
        .secondary-btn {
            background: var(--secondary-background);
            color: var(--label-primary);
            border: 1px solid var(--border-secondary);
        }
        
        .secondary-btn:hover {
            background: var(--quaternary-background);
            transform: translateY(-1px);
            box-shadow: var(--shadow-sm);
        }
        
        .secondary-btn:active {
            transform: translateY(0);
        }
        
        /* Success message with Apple-style treatment */
        .success-message {
            background: var(--success-background);
            color: var(--success-color);
            border: 1px solid color-mix(in srgb, var(--success-color) 30%, transparent);
            padding: var(--spacing-md);
            border-radius: var(--radius-md);
            margin-top: var(--spacing-lg);
            display: none;
            text-align: center;
            font-weight: 500;
            font-size: var(--text-callout);
            box-shadow: var(--shadow-sm);
            animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-8px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        
        /* Responsive adjustments */
        @media (max-width: 480px) {
            body {
                padding: var(--spacing-lg);
            }
            
            .container {
                max-width: 100%;
            }
            
            h1 {
                font-size: var(--text-title-2);
            }
        }
        
        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
        
        /* Focus indicators for keyboard navigation */
        button:focus-visible,
        input:focus-visible,
        textarea:focus-visible {
            outline: 2px solid var(--accent-color);
            outline-offset: 2px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <span class="app-icon">⚡</span>
            <h1>Smart Phrases</h1>
            <p class="subtitle">Expand your productivity with smart text shortcuts</p>
        </header>
        
        <div class="info-card">
            <h3>How it works</h3>
            <div class="info-item">
                <div class="info-label">Trigger</div>
                <div class="info-description">Type a short keyword like "addr", "sig", or "meeting"</div>
            </div>
            <div class="info-item">
                <div class="info-label">Auto-expand</div>
                <div class="info-description">Press space, tab, or enter to expand into your full phrase</div>
            </div>
        </div>
        
        <div class="form-container">
            <form id="triggerForm">
                <div class="form-group">
                    <label for="trigger">Trigger keyword</label>
                    <input type="text" id="trigger" placeholder="addr" required maxlength="50">
                </div>
                
                <div class="form-group">
                    <label for="phrase">Replacement phrase</label>
                    <textarea id="phrase" placeholder="123 Main Street, Anytown, ST 12345" required maxlength="1000"></textarea>
                </div>
                
                <div class="button-group">
                    <button type="submit" class="primary-btn">Add Smart Phrase</button>
                    <button type="button" id="showTriggers" class="secondary-btn">View All Phrases</button>
                </div>
            </form>
        </div>
        
        <div id="successMessage" class="success-message"></div>
        
        <!-- Triggers List Section -->
        <div id="triggersListSection" class="triggers-list-section" style="display: none;">
            <h2 class="section-title">Your Smart Phrases</h2>
            <div id="triggersList" class="triggers-list"></div>
        </div>
        
        <!-- Edit Modal -->
        <div id="editModal" class="modal" style="display: none;">
            <div class="modal-content">
                <h3>Edit Smart Phrase</h3>
                <form id="editForm">
                    <input type="hidden" id="originalTrigger">
                    <div class="form-group">
                        <label for="editTrigger">Trigger keyword</label>
                        <input type="text" id="editTrigger" required maxlength="50">
                    </div>
                    <div class="form-group">
                        <label for="editPhrase">Replacement phrase</label>
                        <textarea id="editPhrase" required maxlength="1000"></textarea>
                    </div>
                    <div class="button-group modal-buttons">
                        <button type="submit" class="primary-btn">Save Changes</button>
                        <button type="button" class="secondary-btn" id="cancelEditBtn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <style>
        /* Additional styles for triggers list */
        .triggers-list-section {
            margin-top: var(--spacing-xl);
        }
        
        .section-title {
            font-size: var(--text-title-2);
            font-weight: 600;
            color: var(--label-primary);
            margin-bottom: var(--spacing-lg);
            text-align: center;
        }
        
        .triggers-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        
        .trigger-item {
            background: var(--apple-gray-1);
            border: none;
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            display: flex;
            justify-content: space-between;
            align-items: start;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: var(--shadow-sm);
        }
        
        body[class*="vscode-dark"] .trigger-item,
        body[class*="vscode-high-contrast"] .trigger-item {
            background: #3a3a3c; /* Lighter Apple dark gray */
        }
        
        body[class*="vscode-light"] .trigger-item {
            background: #f9f9f9; /* Lighter Apple gray - almost white */
        }
        
        .trigger-item:hover {
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }
        
        .trigger-content {
            flex: 1;
            margin-right: var(--spacing-lg);
        }
        
        .trigger-keyword {
            font-weight: 600;
            color: var(--accent-color);
            font-size: var(--text-callout);
            margin-bottom: var(--spacing-xs);
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
        }
        
        .trigger-phrase {
            color: var(--label-secondary);
            font-size: var(--text-subhead);
            line-height: 1.5;
            word-break: break-word;
        }
        
        .trigger-actions {
            display: flex;
            gap: var(--spacing-sm);
        }
        
        .icon-btn {
            width: 36px;
            height: 36px;
            border-radius: var(--radius-md);
            border: none;
            background: rgba(142, 142, 147, 0.12); /* Apple system gray */
            color: var(--label-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 16px;
        }
        
        body[class*="vscode-dark"] .icon-btn,
        body[class*="vscode-high-contrast"] .icon-btn {
            background: rgba(142, 142, 147, 0.24); /* Lighter on dark background */
        }
        
        .icon-btn:hover {
            background: rgba(142, 142, 147, 0.3);
            transform: scale(1.05);
        }
        
        .icon-btn.delete {
            color: var(--destructive-color);
        }
        
        .icon-btn.delete:hover {
            background: rgba(255, 59, 48, 0.2); /* Apple red with transparency */
        }
        
        /* Modal styles */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: color-mix(in srgb, var(--vscode-editor-background) 80%, transparent);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .modal-content {
            background: var(--apple-gray-1);
            border: none;
            border-radius: var(--radius-xl);
            padding: var(--spacing-xl);
            max-width: 500px;
            width: 90%;
            box-shadow: var(--shadow-lg);
        }
        
        body[class*="vscode-dark"] .modal-content,
        body[class*="vscode-high-contrast"] .modal-content {
            background: #3a3a3c; /* Lighter Apple dark gray */
        }
        
        body[class*="vscode-light"] .modal-content {
            background: #f9f9f9; /* Lighter Apple gray - almost white */
        }
        
        .modal-content h3 {
            font-size: var(--text-title-3);
            font-weight: 600;
            margin-bottom: var(--spacing-lg);
            color: var(--label-primary);
        }
        
        .modal-buttons {
            flex-direction: row;
            margin-top: var(--spacing-lg);
        }
        
        .modal-buttons button {
            flex: 1;
        }
        
        /* Empty state */
        .empty-state {
            text-align: center;
            padding: var(--spacing-xxl);
            color: var(--label-tertiary);
        }
        
        .empty-state-icon {
            font-size: 48px;
            margin-bottom: var(--spacing-md);
            opacity: 0.5;
        }
        
        .empty-state-text {
            font-size: var(--text-callout);
        }
    </style>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        
        document.getElementById('triggerForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const trigger = document.getElementById('trigger').value.trim();
            const phrase = document.getElementById('phrase').value.trim();
            
            if (!trigger || !phrase) {
                return;
            }
            
            vscode.postMessage({
                command: 'addTrigger',
                trigger: trigger,
                phrase: phrase
            });
        });
        
        document.getElementById('showTriggers').addEventListener('click', function() {
            // Instead of QuickPick, request all triggers and show in UI
            vscode.postMessage({
                command: 'getAllTriggers'
            });
        });
        
        document.getElementById('editForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const originalTrigger = document.getElementById('originalTrigger').value;
            const newTrigger = document.getElementById('editTrigger').value.trim();
            const newPhrase = document.getElementById('editPhrase').value.trim();
            
            if (!newTrigger || !newPhrase) {
                return;
            }
            
            vscode.postMessage({
                command: 'editTrigger',
                oldTrigger: originalTrigger,
                newTrigger: newTrigger,
                newPhrase: newPhrase
            });
            
            closeEditModal();
        });
        
        document.getElementById('cancelEditBtn').addEventListener('click', function() {
            closeEditModal();
        });
        
        // Global functions for edit/delete
        window.editTrigger = function(trigger, phrase) {
            document.getElementById('originalTrigger').value = trigger;
            document.getElementById('editTrigger').value = trigger;
            document.getElementById('editPhrase').value = phrase;
            document.getElementById('editModal').style.display = 'flex';
            document.getElementById('editTrigger').focus();
        };
        
        window.deleteTrigger = function(trigger) {
            // Direct delete without confirmation for better UX in VS Code
            vscode.postMessage({
                command: 'deleteTrigger',
                trigger: trigger
            });
        };
        
        window.closeEditModal = function() {
            document.getElementById('editModal').style.display = 'none';
        };
        
        // Function to render triggers list
        function renderTriggersList(triggers) {
            const listContainer = document.getElementById('triggersList');
            const listSection = document.getElementById('triggersListSection');
            
            if (triggers.length === 0) {
                listContainer.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">📝</div>
                        <div class="empty-state-text">No smart phrases yet. Add your first one above!</div>
                    </div>
                \`;
                listSection.style.display = 'block';
                return;
            }
            
            listContainer.innerHTML = triggers.map(({trigger, phrase}) => \`
                <div class="trigger-item" data-trigger="\${escapeHtml(trigger)}">
                    <div class="trigger-content">
                        <div class="trigger-keyword">\${escapeHtml(trigger)}</div>
                        <div class="trigger-phrase">\${escapeHtml(phrase)}</div>
                    </div>
                    <div class="trigger-actions">
                        <button class="icon-btn edit-btn" data-trigger="\${escapeHtml(trigger)}" data-phrase="\${escapeHtml(phrase)}" title="Edit">
                            ✏️
                        </button>
                        <button class="icon-btn delete delete-btn" data-trigger="\${escapeHtml(trigger)}" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            \`).join('');
            
            // Add event listeners to buttons
            listContainer.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const trigger = this.getAttribute('data-trigger');
                    const phrase = this.getAttribute('data-phrase');
                    editTrigger(trigger, phrase);
                });
            });
            
            listContainer.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const trigger = this.getAttribute('data-trigger');
                    deleteTrigger(trigger);
                });
            });
            
            listSection.style.display = 'block';
        }
        
        // Helper function to escape HTML and prevent XSS
        function escapeHtml(unsafe) {
            if (typeof unsafe !== 'string') return '';
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;")
                .replace(/\//g, "&#x2F;"); // Also escape forward slash
        }
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'triggerAdded':
                    // Clear form with smooth animation
                    const triggerInput = document.getElementById('trigger');
                    const phraseInput = document.getElementById('phrase');
                    
                    triggerInput.value = '';
                    phraseInput.value = '';
                    triggerInput.focus(); // Return focus for better UX
                    
                    // Show success message
                    const successDiv = document.getElementById('successMessage');
                    successDiv.textContent = \`✅ Added "\${message.trigger}" → "\${message.phrase.length > 30 ? message.phrase.substring(0, 30) + '...' : message.phrase}"\`;
                    successDiv.style.display = 'block';
                    
                    
                    // Hide success message after 4 seconds
                    setTimeout(() => {
                        successDiv.style.display = 'none';
                    }, 4000);
                    
                    // Request updated triggers list
                    vscode.postMessage({ command: 'getAllTriggers' });
                    break;
                    
                case 'updateCount':
                    // Count removed, no action needed
                    break;
                    
                case 'allTriggers':
                    renderTriggersList(message.triggers);
                    break;
                    
                case 'triggerDeleted':
                    // Show success message
                    const deleteMsg = document.getElementById('successMessage');
                    deleteMsg.textContent = \`🗑️ Deleted trigger: "\${message.trigger}"\`;
                    deleteMsg.style.display = 'block';
                    setTimeout(() => {
                        deleteMsg.style.display = 'none';
                    }, 3000);
                    
                    
                    // Request updated triggers list
                    vscode.postMessage({ command: 'getAllTriggers' });
                    break;
                    
                case 'triggerEdited':
                    // Show success message
                    const editMsg = document.getElementById('successMessage');
                    editMsg.textContent = \`✏️ Updated trigger: "\${message.oldTrigger}" → "\${message.newTrigger}"\`;
                    editMsg.style.display = 'block';
                    setTimeout(() => {
                        editMsg.style.display = 'none';
                    }, 3000);
                    
                    
                    // Request updated triggers list
                    vscode.postMessage({ command: 'getAllTriggers' });
                    break;
            }
        });
        
        // Request current trigger count and list on load
        setTimeout(() => {
            vscode.postMessage({ command: 'loadTriggers' });
            vscode.postMessage({ command: 'getAllTriggers' });
        }, 100);
        
        // Add subtle hover effects for better interactivity
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-1px)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.getElementById('editModal').style.display === 'flex') {
                closeEditModal();
            }
        });
    </script>
</body>
</html>`;
}

// Utility functions
function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function deactivate(): void {
    try {
        // Clean up resources
        if (outputChannel) {
            outputChannel.appendLine('Smart Phrases extension deactivating...');
            outputChannel.dispose();
        }
        
        if (panel) {
            panel.dispose();
            panel = undefined;
        }
        
        // Clear triggers from memory
        triggers.clear();
        
        // Force garbage collection hint
        if (global.gc) {
            global.gc();
        }
    } catch (error) {
        console.error('Error during deactivation:', error);
    }
}