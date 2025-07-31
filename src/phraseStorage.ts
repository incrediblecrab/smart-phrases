import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface Phrase {
    trigger: string;
    phrase: string;
}

export class PhraseStorage {
    private phrases: Map<string, string> = new Map();
    private phrasesFilePath: string;
    private watcher: vscode.FileSystemWatcher | undefined;

    constructor(private context: vscode.ExtensionContext) {
        this.phrasesFilePath = path.join(context.globalStorageUri.fsPath, 'smart-phrases.json');
        this.ensureStorageDirectory();
        this.loadPhrases();
        this.watchPhrasesFile();
    }

    private ensureStorageDirectory() {
        const dir = path.dirname(this.phrasesFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private watchPhrasesFile() {
        if (fs.existsSync(this.phrasesFilePath)) {
            this.watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(vscode.Uri.file(this.phrasesFilePath), '*')
            );
            
            this.watcher.onDidChange(() => {
                this.loadPhrases();
            });
        }
    }

    private loadPhrases() {
        try {
            if (fs.existsSync(this.phrasesFilePath)) {
                const data = fs.readFileSync(this.phrasesFilePath, 'utf8');
                const phrasesArray: Phrase[] = JSON.parse(data);
                this.phrases.clear();
                phrasesArray.forEach(item => {
                    this.phrases.set(item.trigger, item.phrase);
                });
            } else {
                this.savePhrases();
            }
        } catch (error) {
            console.error('Error loading phrases:', error);
            this.phrases.clear();
        }
    }

    private savePhrases() {
        try {
            const phrasesArray: Phrase[] = Array.from(this.phrases.entries()).map(([trigger, phrase]) => ({
                trigger,
                phrase
            }));
            fs.writeFileSync(this.phrasesFilePath, JSON.stringify(phrasesArray, null, 2));
        } catch (error) {
            console.error('Error saving phrases:', error);
            vscode.window.showErrorMessage('Failed to save phrases');
        }
    }

    getAllPhrases(): Phrase[] {
        return Array.from(this.phrases.entries()).map(([trigger, phrase]) => ({
            trigger,
            phrase
        }));
    }

    getPhrase(trigger: string): string | undefined {
        return this.phrases.get(trigger);
    }

    addPhrase(trigger: string, phrase: string): boolean {
        if (this.phrases.has(trigger)) {
            return false;
        }
        this.phrases.set(trigger, phrase);
        this.savePhrases();
        return true;
    }

    updatePhrase(oldTrigger: string, newTrigger: string, phrase: string): boolean {
        if (oldTrigger !== newTrigger && this.phrases.has(newTrigger)) {
            return false;
        }
        this.phrases.delete(oldTrigger);
        this.phrases.set(newTrigger, phrase);
        this.savePhrases();
        return true;
    }

    deletePhrase(trigger: string): boolean {
        const deleted = this.phrases.delete(trigger);
        if (deleted) {
            this.savePhrases();
        }
        return deleted;
    }

    getPhrasesFilePath(): string {
        return this.phrasesFilePath;
    }

    dispose() {
        if (this.watcher) {
            this.watcher.dispose();
        }
    }
}