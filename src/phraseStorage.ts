import * as vscode from 'vscode';
import { SmartPhrase } from './phraseProvider';

export class PhraseStorage {
    private static readonly storageKey = 'smartPhrases';
    private phrases: Map<string, SmartPhrase> = new Map();
    
    constructor(private context: vscode.ExtensionContext) {
        this.loadPhrases();
    }

    private loadPhrases(): void {
        const stored = this.context.globalState.get<SmartPhrase[]>(PhraseStorage.storageKey, []);
        this.phrases.clear();
        
        // Load default phrases if storage is empty
        if (stored.length === 0) {
            this.loadDefaultPhrases();
        } else {
            stored.forEach(phrase => {
                if (this.validatePhrase(phrase)) {
                    this.phrases.set(phrase.phrase.toLowerCase(), phrase);
                }
            });
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
        await this.context.globalState.update(PhraseStorage.storageKey, phrasesArray);
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