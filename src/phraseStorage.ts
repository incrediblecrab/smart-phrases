import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface Phrase {
    trigger: string;
    phrase: string;
    triggerOnSpace?: boolean;
    triggerOnTab?: boolean;
    triggerOnEnter?: boolean;
}

export class PhraseStorage {
    private phrases: Map<string, Phrase> = new Map();
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
                    // Handle both old format (just string) and new format (with trigger settings)
                    this.phrases.set(item.trigger, {
                        trigger: item.trigger,
                        phrase: item.phrase,
                        triggerOnSpace: item.triggerOnSpace,
                        triggerOnTab: item.triggerOnTab,
                        triggerOnEnter: item.triggerOnEnter
                    });
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
            const phrasesArray: Phrase[] = Array.from(this.phrases.values());
            fs.writeFileSync(this.phrasesFilePath, JSON.stringify(phrasesArray, null, 2));
        } catch (error) {
            console.error('Error saving phrases:', error);
            vscode.window.showErrorMessage('Failed to save phrases');
        }
    }

    getAllPhrases(): Phrase[] {
        return Array.from(this.phrases.values());
    }

    getPhrase(trigger: string): Phrase | undefined {
        return this.phrases.get(trigger);
    }

    getPhraseText(trigger: string): string | undefined {
        const phrase = this.phrases.get(trigger);
        return phrase ? phrase.phrase : undefined;
    }

    addPhrase(trigger: string, phrase: string, triggerOnSpace?: boolean, triggerOnTab?: boolean, triggerOnEnter?: boolean): boolean {
        if (this.phrases.has(trigger)) {
            return false;
        }
        this.phrases.set(trigger, {
            trigger,
            phrase,
            triggerOnSpace,
            triggerOnTab,
            triggerOnEnter
        });
        this.savePhrases();
        return true;
    }

    updatePhrase(oldTrigger: string, newTrigger: string, phrase: string, triggerOnSpace?: boolean, triggerOnTab?: boolean, triggerOnEnter?: boolean): boolean {
        if (oldTrigger !== newTrigger && this.phrases.has(newTrigger)) {
            return false;
        }
        this.phrases.delete(oldTrigger);
        this.phrases.set(newTrigger, {
            trigger: newTrigger,
            phrase,
            triggerOnSpace,
            triggerOnTab,
            triggerOnEnter
        });
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