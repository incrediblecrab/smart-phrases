import * as assert from 'assert';
import * as vscode from 'vscode';
import { PhraseStorage } from '../../phraseStorage';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('maxs-lab-of-things.smart-phrases'));
    });

    test('Should activate extension', async () => {
        const ext = vscode.extensions.getExtension('maxs-lab-of-things.smart-phrases');
        if (ext) {
            await ext.activate();
            assert.ok(ext.isActive);
        }
    });

    test('Should register manage phrases command', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('smartPhrases.managePhrases'));
    });
});

suite('Phrase Storage Test Suite', () => {
    test('Should add and retrieve phrases', () => {
        const mockContext = {
            globalStorageUri: {
                fsPath: '/tmp/test-smart-phrases'
            }
        } as any;

        const storage = new PhraseStorage(mockContext);
        
        const added = storage.addPhrase('test', 'This is a test phrase');
        assert.strictEqual(added, true);

        const phrase = storage.getPhrase('test');
        assert.strictEqual(phrase, 'This is a test phrase');
    });

    test('Should not add duplicate triggers', () => {
        const mockContext = {
            globalStorageUri: {
                fsPath: '/tmp/test-smart-phrases'
            }
        } as any;

        const storage = new PhraseStorage(mockContext);
        
        storage.addPhrase('test', 'First phrase');
        const added = storage.addPhrase('test', 'Second phrase');
        assert.strictEqual(added, false);
    });

    test('Should update phrases', () => {
        const mockContext = {
            globalStorageUri: {
                fsPath: '/tmp/test-smart-phrases'
            }
        } as any;

        const storage = new PhraseStorage(mockContext);
        
        storage.addPhrase('old', 'Old phrase');
        const updated = storage.updatePhrase('old', 'new', 'New phrase');
        assert.strictEqual(updated, true);

        const oldPhrase = storage.getPhrase('old');
        assert.strictEqual(oldPhrase, undefined);

        const newPhrase = storage.getPhrase('new');
        assert.strictEqual(newPhrase, 'New phrase');
    });

    test('Should delete phrases', () => {
        const mockContext = {
            globalStorageUri: {
                fsPath: '/tmp/test-smart-phrases'
            }
        } as any;

        const storage = new PhraseStorage(mockContext);
        
        storage.addPhrase('test', 'Test phrase');
        const deleted = storage.deletePhrase('test');
        assert.strictEqual(deleted, true);

        const phrase = storage.getPhrase('test');
        assert.strictEqual(phrase, undefined);
    });
});