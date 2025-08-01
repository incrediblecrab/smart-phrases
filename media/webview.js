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

    // Use event delegation for dynamic content
    document.body.addEventListener('click', (e) => {
        // Handle edit button clicks
        if (e.target.matches('.edit-btn') || e.target.closest('.edit-btn')) {
            const editBtn = e.target.matches('.edit-btn') ? e.target : e.target.closest('.edit-btn');
            const phraseItem = editBtn.closest('.phrase-item');
            const editForm = phraseItem.querySelector('.edit-form');
            const phraseContent = phraseItem.querySelector('.phrase-content');
            
            phraseContent.style.display = 'none';
            editForm.style.display = 'block';
            editForm.querySelector('.edit-trigger').focus();
            return;
        }

        // Handle delete button clicks
        if (e.target.matches('.delete-btn') || e.target.closest('.delete-btn')) {
            const deleteBtn = e.target.matches('.delete-btn') ? e.target : e.target.closest('.delete-btn');
            const phraseItem = deleteBtn.closest('.phrase-item');
            const trigger = phraseItem.dataset.trigger;

            if (trigger) {
                // Send delete command without confirm - VS Code will handle the confirmation
                vscode.postMessage({
                    command: 'deletePhrase',
                    trigger: trigger
                });
            }
            return;
        }

        // Handle save edit button
        if (e.target.matches('.save-edit-btn')) {
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
            return;
        }

        // Handle cancel edit button
        if (e.target.matches('.cancel-edit-btn')) {
            const phraseItem = e.target.closest('.phrase-item');
            const editForm = phraseItem.querySelector('.edit-form');
            const phraseContent = phraseItem.querySelector('.phrase-content');
            
            phraseContent.style.display = 'flex';
            editForm.style.display = 'none';
            return;
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