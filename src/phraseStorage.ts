import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SmartPhrase } from './phraseProvider';

export class PhraseStorage {
    private static readonly storageKey = 'smartPhrases';
    private phrases: Map<string, SmartPhrase> = new Map();
    private storageFilePath: string | undefined;
    
    constructor(private context: vscode.ExtensionContext) {
        this.initializeStorage();
        this.loadPhrases();
    }

    private initializeStorage(): void {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const vscodeFolder = path.join(workspaceFolders[0].uri.fsPath, '.vscode');
            
            // Ensure .vscode directory exists
            if (!fs.existsSync(vscodeFolder)) {
                fs.mkdirSync(vscodeFolder, { recursive: true });
            }
            
            this.storageFilePath = path.join(vscodeFolder, 'smart-phrases.json');
        }
    }

    private loadPhrases(): void {
        this.phrases.clear();
        
        if (this.storageFilePath && fs.existsSync(this.storageFilePath)) {
            try {
                const data = fs.readFileSync(this.storageFilePath, 'utf8');
                const stored = JSON.parse(data) as SmartPhrase[];
                
                if (Array.isArray(stored) && stored.length > 0) {
                    stored.forEach(phrase => {
                        if (this.validatePhrase(phrase)) {
                            this.phrases.set(phrase.phrase.toLowerCase(), phrase);
                        }
                    });
                } else {
                    this.loadDefaultPhrases();
                }
            } catch (error) {
                console.error('Error loading phrases from file:', error);
                this.loadDefaultPhrases();
            }
        } else {
            // Fallback to global state or load defaults
            const stored = this.context.globalState.get<SmartPhrase[]>(PhraseStorage.storageKey, []);
            
            if (stored.length === 0) {
                this.loadDefaultPhrases();
            } else {
                stored.forEach(phrase => {
                    if (this.validatePhrase(phrase)) {
                        this.phrases.set(phrase.phrase.toLowerCase(), phrase);
                    }
                });
                // Migrate from global state to file
                this.savePhrases();
            }
        }
    }

    private loadDefaultPhrases(): void {
        const defaults: SmartPhrase[] = [
            { phrase: 'brb', replacement: 'be right back', category: 'Common' },
            { phrase: 'ty', replacement: 'thank you', category: 'Common' },
            { phrase: 'np', replacement: 'no problem', category: 'Common' },
            { phrase: 'btw', replacement: 'by the way', category: 'Common' },
            { phrase: 'lol', replacement: 'laugh out loud', category: 'Internet' },
            { phrase: 'omg', replacement: 'oh my god', category: 'Internet' },
            { phrase: 'fyi', replacement: 'for your information', category: 'Business' },
            { phrase: 'asap', replacement: 'as soon as possible', category: 'Business' }
        ];
        
        defaults.forEach(phrase => {
            this.phrases.set(phrase.phrase.toLowerCase(), phrase);
        });
        
        this.savePhrases();
    }

    private validatePhrase(phrase: SmartPhrase): boolean {
        return phrase.phrase.length > 0 && 
               phrase.phrase.length <= 50 && 
               phrase.replacement.length > 0 && 
               phrase.replacement.length <= 500 &&
               /^[a-zA-Z0-9_\-]+$/.test(phrase.phrase);
    }

    private async savePhrases(): Promise<void> {
        const phrasesArray = Array.from(this.phrases.values());
        
        if (this.storageFilePath) {
            try {
                const data = JSON.stringify(phrasesArray, null, 2);
                fs.writeFileSync(this.storageFilePath, data, 'utf8');
            } catch (error) {
                console.error('Error saving phrases to file:', error);
                // Fallback to global state
                await this.context.globalState.update(PhraseStorage.storageKey, phrasesArray);
            }
        } else {
            // Fallback to global state
            await this.context.globalState.update(PhraseStorage.storageKey, phrasesArray);
        }
    }

    getAllPhrases(): SmartPhrase[] {
        return Array.from(this.phrases.values()).sort((a, b) => 
            a.phrase.localeCompare(b.phrase)
        );
    }

    getPhrase(key: string): SmartPhrase | undefined {
        return this.phrases.get(key.toLowerCase());
    }

    async addPhrase(phrase: SmartPhrase): Promise<boolean> {
        if (!this.validatePhrase(phrase)) {
            return false;
        }
        
        this.phrases.set(phrase.phrase.toLowerCase(), phrase);
        await this.savePhrases();
        return true;
    }

    async updatePhrase(oldKey: string, newPhrase: SmartPhrase): Promise<boolean> {
        if (!this.validatePhrase(newPhrase)) {
            return false;
        }
        
        this.phrases.delete(oldKey.toLowerCase());
        this.phrases.set(newPhrase.phrase.toLowerCase(), newPhrase);
        await this.savePhrases();
        return true;
    }

    async deletePhrase(key: string): Promise<boolean> {
        const deleted = this.phrases.delete(key.toLowerCase());
        if (deleted) {
            await this.savePhrases();
        }
        return deleted;
    }

    async exportPhrases(): Promise<string> {
        const phrases = this.getAllPhrases();
        return JSON.stringify(phrases, null, 2);
    }

    async importPhrases(jsonData: string): Promise<number> {
        try {
            const imported = JSON.parse(jsonData) as SmartPhrase[];
            let count = 0;
            
            for (const phrase of imported) {
                if (this.validatePhrase(phrase)) {
                    this.phrases.set(phrase.phrase.toLowerCase(), phrase);
                    count++;
                }
            }
            
            if (count > 0) {
                await this.savePhrases();
            }
            
            return count;
        } catch {
            return 0;
        }
    }
}