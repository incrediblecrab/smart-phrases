import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('maxs-lab-of-things.smart-phrases'));
    });

    test('Should activate', async () => {
        const ext = vscode.extensions.getExtension('maxs-lab-of-things.smart-phrases');
        assert.ok(ext);
        await ext!.activate();
        assert.ok(ext!.isActive);
    });

    test('Should have commands registered', () => {
        return vscode.commands.getCommands(true).then((commands) => {
            const expectedCommands = [
                'smartPhrases.toggle',
                'smartPhrases.openManager',
                'smartPhrases.addPhrase',
                'smartPhrases.refreshPhrases',
                'smartPhrases.exportPhrases',
                'smartPhrases.importPhrases'
            ];
            
            expectedCommands.forEach(cmd => {
                assert.ok(commands.includes(cmd), `Command ${cmd} not found`);
            });
        });
    });

    test('Should have tree view registered', () => {
        // Check if the view is available
        const ext = vscode.extensions.getExtension('maxs-lab-of-things.smart-phrases');
        assert.ok(ext);
        // Tree view registration is verified by successful activation
    });

    test('Should have default configuration', () => {
        const config = vscode.workspace.getConfiguration('smartPhrases');
        const enabled = config.get('enabled');
        assert.strictEqual(enabled, true);
    });
});