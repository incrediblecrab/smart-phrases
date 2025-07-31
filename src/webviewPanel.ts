import * as vscode from 'vscode';
import { PhraseStorage } from './phraseStorage';

export class PhraseManagerPanel {
    public static currentPanel: PhraseManagerPanel | undefined;
    public static readonly viewType = 'smartPhrases.phraseManager';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private phraseStorage: PhraseStorage;

    public static createOrShow(extensionUri: vscode.Uri, phraseStorage: PhraseStorage) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (PhraseManagerPanel.currentPanel) {
            PhraseManagerPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            PhraseManagerPanel.viewType,
            'Smart Phrases Manager',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        PhraseManagerPanel.currentPanel = new PhraseManagerPanel(panel, extensionUri, phraseStorage);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, phraseStorage: PhraseStorage) {
        PhraseManagerPanel.currentPanel = new PhraseManagerPanel(panel, extensionUri, phraseStorage);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, phraseStorage: PhraseStorage) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this.phraseStorage = phraseStorage;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'addPhrase':
                        this.handleAddPhrase(message.trigger, message.phrase);
                        return;
                    case 'updatePhrase':
                        this.handleUpdatePhrase(message.oldTrigger, message.newTrigger, message.phrase);
                        return;
                    case 'deletePhrase':
                        this.handleDeletePhrase(message.trigger);
                        return;
                    case 'openJsonFile':
                        this.handleOpenJsonFile();
                        return;
                    case 'refreshData':
                        this._update();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private handleAddPhrase(trigger: string, phrase: string) {
        if (!trigger || !phrase) {
            vscode.window.showErrorMessage('Trigger and phrase cannot be empty');
            return;
        }

        if (this.phraseStorage.addPhrase(trigger, phrase)) {
            vscode.window.showInformationMessage(`Added phrase: ${trigger} → ${phrase}`);
            this._update();
        } else {
            vscode.window.showErrorMessage(`Trigger "${trigger}" already exists`);
        }
    }

    private handleUpdatePhrase(oldTrigger: string, newTrigger: string, phrase: string) {
        if (!newTrigger || !phrase) {
            vscode.window.showErrorMessage('Trigger and phrase cannot be empty');
            return;
        }

        if (this.phraseStorage.updatePhrase(oldTrigger, newTrigger, phrase)) {
            vscode.window.showInformationMessage(`Updated phrase: ${newTrigger} → ${phrase}`);
            this._update();
        } else {
            vscode.window.showErrorMessage(`Trigger "${newTrigger}" already exists`);
        }
    }

    private handleDeletePhrase(trigger: string) {
        if (this.phraseStorage.deletePhrase(trigger)) {
            vscode.window.showInformationMessage(`Deleted phrase: ${trigger}`);
            this._update();
        }
    }

    private handleOpenJsonFile() {
        const jsonPath = this.phraseStorage.getPhrasesFilePath();
        vscode.window.showTextDocument(vscode.Uri.file(jsonPath));
    }

    public dispose() {
        PhraseManagerPanel.currentPanel = undefined;
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = 'Smart Phrases Manager';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.css'));
        const phrases = this.phraseStorage.getAllPhrases();
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <link href="${styleUri}" rel="stylesheet">
                <title>Smart Phrases Manager</title>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>Smart Phrases</h1>
                        <p class="subtitle">Manage your trigger words and phrases</p>
                    </header>

                    <div class="action-bar">
                        <button class="button button-primary" id="addPhraseBtn">
                            <span class="icon">+</span> Add Phrase
                        </button>
                        <button class="button button-secondary" id="openJsonBtn">
                            <span class="icon">📄</span> Edit JSON
                        </button>
                        <button class="button button-secondary" id="refreshBtn">
                            <span class="icon">↻</span> Refresh
                        </button>
                    </div>

                    <div class="add-phrase-form" id="addPhraseForm" style="display: none;">
                        <h3>Add New Phrase</h3>
                        <div class="form-group">
                            <label for="newTrigger">Trigger</label>
                            <input type="text" id="newTrigger" placeholder="e.g., addr" />
                        </div>
                        <div class="form-group">
                            <label for="newPhrase">Phrase</label>
                            <textarea id="newPhrase" rows="3" placeholder="e.g., 123 Main Street, City, State 12345"></textarea>
                        </div>
                        <div class="form-actions">
                            <button class="button button-primary" id="saveNewBtn">Save</button>
                            <button class="button button-secondary" id="cancelNewBtn">Cancel</button>
                        </div>
                    </div>

                    <div class="phrases-list">
                        ${phrases.length === 0 
                            ? '<div class="empty-state">No phrases yet. Click "Add Phrase" to get started!</div>'
                            : phrases.map(p => `
                                <div class="phrase-item" data-trigger="${p.trigger}">
                                    <div class="phrase-content">
                                        <div class="phrase-trigger">${p.trigger}</div>
                                        <div class="phrase-text">${p.phrase}</div>
                                    </div>
                                    <div class="phrase-actions">
                                        <button class="icon-button edit-btn" title="Edit">✏️</button>
                                        <button class="icon-button delete-btn" title="Delete">🗑️</button>
                                    </div>
                                    <div class="edit-form" style="display: none;">
                                        <div class="form-group">
                                            <label>Trigger</label>
                                            <input type="text" class="edit-trigger" value="${p.trigger}" />
                                        </div>
                                        <div class="form-group">
                                            <label>Phrase</label>
                                            <textarea class="edit-phrase" rows="3">${p.phrase}</textarea>
                                        </div>
                                        <div class="form-actions">
                                            <button class="button button-primary save-edit-btn">Save</button>
                                            <button class="button button-secondary cancel-edit-btn">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>

                <script nonce="${nonce}" src="${scriptUri}"></script>
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