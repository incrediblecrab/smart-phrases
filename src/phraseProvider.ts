import * as vscode from 'vscode';
import { PhraseStorage } from './phraseStorage';

export interface SmartPhrase {
    phrase: string;
    replacement: string;
    category?: string;
    useCount?: number;
}

export class PhraseItem extends vscode.TreeItem {
    constructor(
        public readonly phrase: SmartPhrase,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(phrase.phrase, collapsibleState);
        this.tooltip = `${phrase.phrase} → ${phrase.replacement}`;
        this.description = phrase.replacement.length > 30 
            ? phrase.replacement.substring(0, 30) + '...' 
            : phrase.replacement;
        this.contextValue = 'phraseItem';
        this.iconPath = new vscode.ThemeIcon('symbol-text');
    }
}

export class SmartPhrasesProvider implements vscode.TreeDataProvider<PhraseItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PhraseItem | undefined | null | void> = new vscode.EventEmitter<PhraseItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PhraseItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private storage: PhraseStorage) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: PhraseItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PhraseItem): Thenable<PhraseItem[]> {
        if (!element) {
            // Return root level items
            const phrases = this.storage.getAllPhrases();
            return Promise.resolve(
                phrases.map(phrase => new PhraseItem(phrase, vscode.TreeItemCollapsibleState.None))
            );
        }
        return Promise.resolve([]);
    }

    getParent(element: PhraseItem): vscode.ProviderResult<PhraseItem> {
        return null;
    }
}