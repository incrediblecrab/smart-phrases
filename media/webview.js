(function() {
    const vscode = acquireVsCodeApi();

    const addPhraseBtn = document.getElementById('addPhraseBtn');
    const openJsonBtn = document.getElementById('openJsonBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const addPhraseForm = document.getElementById('addPhraseForm');
    const saveNewBtn = document.getElementById('saveNewBtn');
    const cancelNewBtn = document.getElementById('cancelNewBtn');
    const newTriggerInput = document.getElementById('newTrigger');
    const newPhraseInput = document.getElementById('newPhrase');

    addPhraseBtn.addEventListener('click', () => {
        addPhraseForm.style.display = 'block';
        newTriggerInput.focus();
    });

    openJsonBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'openJsonFile' });
    });

    refreshBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'refreshData' });
    });

    saveNewBtn.addEventListener('click', () => {
        const trigger = newTriggerInput.value.trim();
        const phrase = newPhraseInput.value.trim();

        if (trigger && phrase) {
            vscode.postMessage({
                command: 'addPhrase',
                trigger: trigger,
                phrase: phrase
            });

            newTriggerInput.value = '';
            newPhraseInput.value = '';
            addPhraseForm.style.display = 'none';
        }
    });

    cancelNewBtn.addEventListener('click', () => {
        newTriggerInput.value = '';
        newPhraseInput.value = '';
        addPhraseForm.style.display = 'none';
    });

    document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (editBtn) {
            const phraseItem = editBtn.closest('.phrase-item');
            const editForm = phraseItem.querySelector('.edit-form');
            const phraseContent = phraseItem.querySelector('.phrase-content');
            
            phraseContent.style.display = 'none';
            editForm.style.display = 'block';
            editForm.querySelector('.edit-trigger').focus();
        }

        if (deleteBtn) {
            const phraseItem = deleteBtn.closest('.phrase-item');
            const trigger = phraseItem.dataset.trigger;

            if (confirm(`Delete phrase "${trigger}"?`)) {
                vscode.postMessage({
                    command: 'deletePhrase',
                    trigger: trigger
                });
            }
        }

        if (e.target.classList.contains('save-edit-btn')) {
            const phraseItem = e.target.closest('.phrase-item');
            const oldTrigger = phraseItem.dataset.trigger;
            const newTrigger = phraseItem.querySelector('.edit-trigger').value.trim();
            const phrase = phraseItem.querySelector('.edit-phrase').value.trim();

            if (newTrigger && phrase) {
                vscode.postMessage({
                    command: 'updatePhrase',
                    oldTrigger: oldTrigger,
                    newTrigger: newTrigger,
                    phrase: phrase
                });
            }
        }

        if (e.target.classList.contains('cancel-edit-btn')) {
            const phraseItem = e.target.closest('.phrase-item');
            const editForm = phraseItem.querySelector('.edit-form');
            const phraseContent = phraseItem.querySelector('.phrase-content');
            
            phraseContent.style.display = 'flex';
            editForm.style.display = 'none';
        }
    });

    newTriggerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            newPhraseInput.focus();
        }
    });

    newPhraseInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveNewBtn.click();
        }
    });
})();