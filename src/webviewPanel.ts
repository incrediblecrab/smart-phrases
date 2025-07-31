import * as vscode from 'vscode';
import { SmartPhrase } from './phraseProvider';
import { PhraseStorage } from './phraseStorage';

export class PhraseManagerPanel {
    public static currentPanel: PhraseManagerPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, storage: PhraseStorage) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (PhraseManagerPanel.currentPanel) {
            PhraseManagerPanel.currentPanel._panel.reveal(column);
            PhraseManagerPanel.currentPanel.update(storage);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'phraseManager',
            'Smart Phrases Manager',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        PhraseManagerPanel.currentPanel = new PhraseManagerPanel(panel, extensionUri, storage);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, private storage: PhraseStorage) {
        this._panel = panel;
        this.update(storage);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'addPhrase':
                        this.addPhrase(message.phrase);
                        break;
                    case 'editPhrase':
                        this.editPhrase(message.oldPhrase, message.newPhrase);
                        break;
                    case 'deletePhrase':
                        this.deletePhrase(message.phrase);
                        break;
                    case 'refresh':
                        this.update(this.storage);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async addPhrase(phrase: SmartPhrase) {
        const success = await this.storage.addPhrase(phrase);
        if (success) {
            vscode.window.showInformationMessage(`Added phrase: ${phrase.phrase}`);
            this.update(this.storage);
        } else {
            vscode.window.showErrorMessage('Failed to add phrase. Please check the format.');
        }
    }

    private async editPhrase(oldPhrase: string, newPhrase: SmartPhrase) {
        const success = await this.storage.updatePhrase(oldPhrase, newPhrase);
        if (success) {
            vscode.window.showInformationMessage(`Updated phrase: ${newPhrase.phrase}`);
            this.update(this.storage);
        } else {
            vscode.window.showErrorMessage('Failed to update phrase. Please check the format.');
        }
    }

    private async deletePhrase(phrase: string) {
        const success = await this.storage.deletePhrase(phrase);
        if (success) {
            vscode.window.showInformationMessage(`Deleted phrase: ${phrase}`);
            this.update(this.storage);
        }
    }

    public dispose() {
        PhraseManagerPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private update(storage: PhraseStorage) {
        const phrases = storage.getAllPhrases();
        this._panel.webview.html = this.getHtmlForWebview(this._panel.webview, phrases);
    }

    private getHtmlForWebview(webview: vscode.Webview, phrases: SmartPhrase[]) {
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <title>Smart Phrases Manager</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 {
                        color: var(--vscode-foreground);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 10px;
                    }
                    .add-form {
                        margin-bottom: 30px;
                        padding: 20px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 5px;
                    }
                    .form-group {
                        margin-bottom: 15px;
                    }
                    label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: bold;
                    }
                    input, select {
                        width: 100%;
                        padding: 8px;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 3px;
                    }
                    button {
                        padding: 8px 16px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        margin-right: 10px;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .phrase-list {
                        margin-top: 20px;
                    }
                    .phrase-item {
                        padding: 15px;
                        margin-bottom: 10px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 5px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .phrase-content {
                        flex-grow: 1;
                    }
                    .phrase-key {
                        font-weight: bold;
                        color: var(--vscode-symbolIcon-keywordForeground);
                    }
                    .phrase-replacement {
                        margin-top: 5px;
                        color: var(--vscode-descriptionForeground);
                    }
                    .phrase-category {
                        font-size: 0.9em;
                        color: var(--vscode-textPreformat-foreground);
                        margin-left: 10px;
                    }
                    .phrase-actions {
                        display: flex;
                        gap: 10px;
                    }
                    .search-box {
                        width: 100%;
                        padding: 10px;
                        margin-bottom: 20px;
                        font-size: 16px;
                    }
                    .stats {
                        padding: 10px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 5px;
                        margin-bottom: 20px;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Smart Phrases Manager</h1>
                    
                    <div class="stats">
                        Total Phrases: <strong>${phrases.length}</strong>
                    </div>

                    <div class="add-form">
                        <h2>Add New Phrase</h2>
                        <div class="form-group">
                            <label for="phrase">Phrase (letters, numbers, _, - only):</label>
                            <input type="text" id="phrase" placeholder="e.g., addr" pattern="[a-zA-Z0-9_-]+" maxlength="50">
                        </div>
                        <div class="form-group">
                            <label for="replacement">Replacement:</label>
                            <input type="text" id="replacement" placeholder="e.g., 123 Main Street" maxlength="500">
                        </div>
                        <div class="form-group">
                            <label for="category">Category (optional):</label>
                            <select id="category">
                                <option value="">None</option>
                                <option value="Common">Common</option>
                                <option value="Business">Business</option>
                                <option value="Personal">Personal</option>
                                <option value="Code">Code</option>
                                <option value="Internet">Internet</option>
                            </select>
                        </div>
                        <button onclick="addPhrase()">Add Phrase</button>
                    </div>

                    <input type="text" class="search-box" id="search" placeholder="Search phrases..." onkeyup="filterPhrases()">

                    <div class="phrase-list" id="phraseList">
                        ${phrases.map(p => `
                            <div class="phrase-item" data-phrase="${p.phrase}">
                                <div class="phrase-content">
                                    <div>
                                        <span class="phrase-key">${p.phrase}</span>
                                        ${p.category ? `<span class="phrase-category">[${p.category}]</span>` : ''}
                                    </div>
                                    <div class="phrase-replacement">${p.replacement}</div>
                                </div>
                                <div class="phrase-actions">
                                    <button onclick="editPhrase('${p.phrase}', '${p.replacement.replace(/'/g, "\\'")}', '${p.category || ''}')">Edit</button>
                                    <button onclick="deletePhrase('${p.phrase}')">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();

                    function addPhrase() {
                        const phrase = document.getElementById('phrase').value.trim();
                        const replacement = document.getElementById('replacement').value.trim();
                        const category = document.getElementById('category').value;

                        if (!phrase || !replacement) {
                            alert('Please fill in both phrase and replacement');
                            return;
                        }

                        if (!/^[a-zA-Z0-9_-]+$/.test(phrase)) {
                            alert('Phrase can only contain letters, numbers, underscores, and hyphens');
                            return;
                        }

                        vscode.postMessage({
                            command: 'addPhrase',
                            phrase: { phrase, replacement, category: category || undefined }
                        });

                        // Clear form
                        document.getElementById('phrase').value = '';
                        document.getElementById('replacement').value = '';
                        document.getElementById('category').value = '';
                    }

                    function editPhrase(phrase, replacement, category) {
                        const newPhrase = prompt('Edit phrase:', phrase);
                        if (!newPhrase) return;

                        const newReplacement = prompt('Edit replacement:', replacement);
                        if (!newReplacement) return;

                        const newCategory = prompt('Edit category (optional):', category) || undefined;

                        if (!/^[a-zA-Z0-9_-]+$/.test(newPhrase)) {
                            alert('Phrase can only contain letters, numbers, underscores, and hyphens');
                            return;
                        }

                        vscode.postMessage({
                            command: 'editPhrase',
                            oldPhrase: phrase,
                            newPhrase: { phrase: newPhrase, replacement: newReplacement, category: newCategory }
                        });
                    }

                    function deletePhrase(phrase) {
                        if (confirm(\`Delete phrase "\${phrase}"?\`)) {
                            vscode.postMessage({
                                command: 'deletePhrase',
                                phrase: phrase
                            });
                        }
                    }

                    function filterPhrases() {
                        const search = document.getElementById('search').value.toLowerCase();
                        const items = document.querySelectorAll('.phrase-item');
                        
                        items.forEach(item => {
                            const phrase = item.getAttribute('data-phrase').toLowerCase();
                            const content = item.textContent.toLowerCase();
                            if (phrase.includes(search) || content.includes(search)) {
                                item.style.display = 'flex';
                            } else {
                                item.style.display = 'none';
                            }
                        });
                    }
                </script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}