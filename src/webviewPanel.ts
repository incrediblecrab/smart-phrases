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
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    extensionUri
                ]
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

    private escapeHtml(str: string): string {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
    }

    private escapeJs(str: string): string {
        return str.replace(/\\/g, '\\\\')
                  .replace(/'/g, "\\'")
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r');
    }

    private getHtmlForWebview(webview: vscode.Webview, phrases: SmartPhrase[]) {
        const nonce = getNonce();
        
        // Get the resource URIs
        const mediaUri = vscode.Uri.joinPath(this._panel.webview.options.localResourceRoots![0]);
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'webview.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'webview.js'));

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <title>Smart Phrases Manager</title>
                <link href="${styleUri}" rel="stylesheet">
            </head>
            <body>
                <div class="container">
                    <h1>
                        Smart Phrases Manager
                        <div class="header-actions">
                            <button class="btn-secondary btn-icon" onclick="showImportExportModal()">📥 Import/Export</button>
                        </div>
                    </h1>
                    
                    <div class="stats">
                        <div class="stat-card">
                            <div class="stat-number">${phrases.length}</div>
                            <div class="stat-label">Total Phrases</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${phrases.filter(p => p.category).length}</div>
                            <div class="stat-label">Categorized</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${[...new Set(phrases.map(p => p.category).filter(Boolean))].length}</div>
                            <div class="stat-label">Categories</div>
                        </div>
                    </div>

                    <div class="add-form">
                        <h2>Add New Phrase</h2>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="phrase">Phrase</label>
                                <input type="text" id="phrase" placeholder="e.g., addr" pattern="[a-zA-Z0-9_-]+" maxlength="50">
                            </div>
                            <div class="form-group">
                                <label for="replacement">Replacement</label>
                                <input type="text" id="replacement" placeholder="e.g., 123 Main Street" maxlength="500">
                            </div>
                            <div class="form-group">
                                <label for="category">Category</label>
                                <select id="category">
                                    <option value="">None</option>
                                    <option value="Common">Common</option>
                                    <option value="Business">Business</option>
                                    <option value="Personal">Personal</option>
                                    <option value="Code">Code</option>
                                    <option value="Internet">Internet</option>
                                </select>
                            </div>
                        </div>
                        <button onclick="addPhrase()">➕ Add Phrase</button>
                    </div>

                    <div class="search-filter-container">
                        <input type="text" class="search-box" id="search" placeholder="🔍 Search phrases..." onkeyup="filterPhrases()">
                        <select id="categoryFilter" onchange="filterPhrases()">
                            <option value="">All Categories</option>
                            <option value="Common">Common</option>
                            <option value="Business">Business</option>
                            <option value="Personal">Personal</option>
                            <option value="Code">Code</option>
                            <option value="Internet">Internet</option>
                            <option value="uncategorized">Uncategorized</option>
                        </select>
                        <button class="btn-secondary" onclick="toggleSelectAll()">
                            <span id="selectAllText">Select All</span>
                        </button>
                    </div>

                    <div class="phrase-list" id="phraseList">
                        ${phrases.length === 0 ? `
                            <div class="empty-state">
                                <h2>No phrases yet</h2>
                                <p>Add your first smart phrase to get started!</p>
                            </div>
                        ` : phrases.map(p => `
                            <div class="phrase-item" data-phrase="${this.escapeHtml(p.phrase)}" data-category="${this.escapeHtml(p.category || '')}">
                                <input type="checkbox" class="phrase-checkbox" onchange="updateBulkActions()">
                                <div class="phrase-content">
                                    <div class="phrase-header">
                                        <span class="phrase-key">${this.escapeHtml(p.phrase)}</span>
                                        ${p.category ? `<span class="phrase-category">${this.escapeHtml(p.category)}</span>` : ''}
                                    </div>
                                    <div class="phrase-replacement">${this.escapeHtml(p.replacement)}</div>
                                </div>
                                <div class="phrase-actions">
                                    <button class="btn-icon" onclick="editPhraseModal('${this.escapeJs(p.phrase)}', '${this.escapeJs(p.replacement)}', '${this.escapeJs(p.category || '')}')">✏️</button>
                                    <button class="btn-icon btn-danger" onclick="deletePhrase('${this.escapeJs(p.phrase)}')">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bulk-actions" id="bulkActions">
                    <span id="selectedCount">0 selected</span>
                    <button class="btn-danger" onclick="deleteSelected()">Delete Selected</button>
                    <button class="btn-secondary" onclick="deselectAll()">Cancel</button>
                </div>

                <div class="modal" id="editModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Edit Phrase</h2>
                            <button class="close-button" onclick="closeEditModal()">×</button>
                        </div>
                        <div class="form-group">
                            <label for="editPhrase">Phrase</label>
                            <input type="text" id="editPhrase" pattern="[a-zA-Z0-9_-]+" maxlength="50">
                        </div>
                        <div class="form-group">
                            <label for="editReplacement">Replacement</label>
                            <textarea id="editReplacement" rows="4" maxlength="500"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="editCategory">Category</label>
                            <select id="editCategory">
                                <option value="">None</option>
                                <option value="Common">Common</option>
                                <option value="Business">Business</option>
                                <option value="Personal">Personal</option>
                                <option value="Code">Code</option>
                                <option value="Internet">Internet</option>
                            </select>
                        </div>
                        <button onclick="saveEdit()">Save Changes</button>
                        <button class="btn-secondary" onclick="closeEditModal()">Cancel</button>
                    </div>
                </div>

                <div class="modal" id="importExportModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Import/Export Phrases</h2>
                            <button class="close-button" onclick="closeImportExportModal()">×</button>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <h3>Export</h3>
                            <p>Download your phrases as a JSON file</p>
                            <button onclick="exportPhrases()">📥 Export All Phrases</button>
                        </div>
                        <div>
                            <h3>Import</h3>
                            <p>Upload a JSON file to import phrases</p>
                            <input type="file" id="importFile" accept=".json" onchange="handleImport(event)">
                        </div>
                    </div>
                </div>

                <script src="${scriptUri}" nonce="${nonce}"></script>
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