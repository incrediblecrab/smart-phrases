import * as vscode from 'vscode';
import { PhraseProvider } from './phraseProvider';
import { PhraseStorage } from './phraseStorage';
import { PhraseManagerPanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext) {
    const phraseStorage = new PhraseStorage(context);
    const phraseProvider = new PhraseProvider(phraseStorage);

    const completionProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', pattern: '**/*' },
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                const wordMatch = linePrefix.match(/(\S+)$/);
                
                if (!wordMatch) {
                    return undefined;
                }

                const trigger = wordMatch[1];
                return phraseProvider.getCompletions(trigger);
            }
        }
    );

    const managePhrases = vscode.commands.registerCommand('smartPhrases.managePhrases', () => {
        PhraseManagerPanel.createOrShow(context.extensionUri, phraseStorage);
    });

    let typeCommandDisposable: vscode.Disposable | undefined;

    const registerTypeCommand = () => {
        if (typeCommandDisposable) {
            typeCommandDisposable.dispose();
        }

        const config = vscode.workspace.getConfiguration('smartPhrases');
        const triggerOnSpace = config.get<boolean>('triggerOnSpace', true);
        const triggerOnTab = config.get<boolean>('triggerOnTab', true);
        const triggerOnEnter = config.get<boolean>('triggerOnEnter', false);

        typeCommandDisposable = vscode.commands.registerCommand('type', async (args) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                await vscode.commands.executeCommand('default:type', args);
                return;
            }

            const position = editor.selection.active;
            const linePrefix = editor.document.lineAt(position).text.substr(0, position.character);
            const wordMatch = linePrefix.match(/(\S+)$/);

            if (wordMatch) {
                const trigger = wordMatch[1];
                const phraseData = phraseStorage.getPhrase(trigger);

                if (phraseData) {
                    // Check phrase-specific settings first, then fall back to global settings
                    const shouldTrigger = 
                        (args.text === ' ' && (phraseData.triggerOnSpace !== undefined ? phraseData.triggerOnSpace : triggerOnSpace)) ||
                        (args.text === '\t' && (phraseData.triggerOnTab !== undefined ? phraseData.triggerOnTab : triggerOnTab)) ||
                        (args.text === '\n' && (phraseData.triggerOnEnter !== undefined ? phraseData.triggerOnEnter : triggerOnEnter));

                    if (shouldTrigger) {
                        const edit = new vscode.WorkspaceEdit();
                        const range = new vscode.Range(
                            position.translate(0, -trigger.length),
                            position
                        );
                        edit.replace(editor.document.uri, range, phraseData.phrase);
                        await vscode.workspace.applyEdit(edit);
                        
                        if (args.text === ' ') {
                            await vscode.commands.executeCommand('default:type', { text: ' ' });
                        } else if (args.text === '\n') {
                            await vscode.commands.executeCommand('default:type', { text: '\n' });
                        }
                        return;
                    }
                }
            }

            await vscode.commands.executeCommand('default:type', args);
        });

        context.subscriptions.push(typeCommandDisposable);
    };

    registerTypeCommand();

    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('smartPhrases.triggerOnSpace') ||
            e.affectsConfiguration('smartPhrases.triggerOnTab') ||
            e.affectsConfiguration('smartPhrases.triggerOnEnter')) {
            registerTypeCommand();
        }
    });

    context.subscriptions.push(completionProvider, managePhrases);

    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(PhraseManagerPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                PhraseManagerPanel.revive(webviewPanel, context.extensionUri, phraseStorage);
            }
        });
    }
}

export function deactivate() {}