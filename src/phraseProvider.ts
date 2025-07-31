import * as vscode from 'vscode';
import { PhraseStorage } from './phraseStorage';

export class PhraseProvider {
    constructor(private phraseStorage: PhraseStorage) {}

    getCompletions(trigger: string): vscode.CompletionItem[] | undefined {
        const phrases = this.phraseStorage.getAllPhrases();
        const matchingPhrases = phrases.filter(p => p.trigger.startsWith(trigger));

        if (matchingPhrases.length === 0) {
            return undefined;
        }

        return matchingPhrases.map(p => {
            const item = new vscode.CompletionItem(p.trigger, vscode.CompletionItemKind.Snippet);
            item.detail = p.phrase;
            item.insertText = p.phrase;
            item.documentation = new vscode.MarkdownString(`**Smart Phrase**\n\nTrigger: \`${p.trigger}\`\n\nExpands to: ${p.phrase}`);
            item.range = new vscode.Range(
                vscode.window.activeTextEditor!.selection.active.translate(0, -trigger.length),
                vscode.window.activeTextEditor!.selection.active
            );
            return item;
        });
    }
}