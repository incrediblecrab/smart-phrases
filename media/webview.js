const vscode = acquireVsCodeApi();
let editingPhrase = null;

function addPhrase() {
    const phrase = document.getElementById('phrase').value.trim();
    const replacement = document.getElementById('replacement').value.trim();
    const category = document.getElementById('category').value;

    if (!phrase || !replacement) {
        showNotification('Please fill in both phrase and replacement', 'error');
        return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(phrase)) {
        showNotification('Phrase can only contain letters, numbers, underscores, and hyphens', 'error');
        return;
    }

    vscode.postMessage({
        command: 'addPhrase',
        phrase: { phrase, replacement, category: category || undefined }
    });

    // Clear form
    document.getElementById('phrase').value = '';
    document.getElementById('replacement').value = '';
    document.getElementById('category').value = '';
    
    // Trigger refresh
    setTimeout(() => {
        vscode.postMessage({ command: 'refresh' });
    }, 100);
}

function editPhraseModal(phrase, replacement, category) {
    editingPhrase = phrase;
    document.getElementById('editPhrase').value = phrase;
    document.getElementById('editReplacement').value = replacement;
    document.getElementById('editCategory').value = category || '';
    document.getElementById('editModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    editingPhrase = null;
}

function saveEdit() {
    const newPhrase = document.getElementById('editPhrase').value.trim();
    const newReplacement = document.getElementById('editReplacement').value.trim();
    const newCategory = document.getElementById('editCategory').value;

    if (!newPhrase || !newReplacement) {
        showNotification('Please fill in both phrase and replacement', 'error');
        return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(newPhrase)) {
        showNotification('Phrase can only contain letters, numbers, underscores, and hyphens', 'error');
        return;
    }

    vscode.postMessage({
        command: 'editPhrase',
        oldPhrase: editingPhrase,
        newPhrase: { phrase: newPhrase, replacement: newReplacement, category: newCategory || undefined }
    });

    closeEditModal();
}

function deletePhrase(phrase) {
    if (confirm(`Delete phrase "${phrase}"?`)) {
        vscode.postMessage({
            command: 'deletePhrase',
            phrase: phrase
        });
    }
}

function filterPhrases() {
    const search = document.getElementById('search').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const items = document.querySelectorAll('.phrase-item');
    
    items.forEach(item => {
        const phrase = item.getAttribute('data-phrase').toLowerCase();
        const category = item.getAttribute('data-category');
        const content = item.textContent.toLowerCase();
        
        const matchesSearch = phrase.includes(search) || content.includes(search);
        const matchesCategory = !categoryFilter || 
            (categoryFilter === 'uncategorized' && !category) ||
            (category === categoryFilter);
        
        if (matchesSearch && matchesCategory) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.phrase-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        if (cb.parentElement.style.display !== 'none') {
            cb.checked = !allChecked;
        }
    });
    
    updateBulkActions();
    document.getElementById('selectAllText').textContent = allChecked ? 'Select All' : 'Deselect All';
}

function updateBulkActions() {
    const checked = document.querySelectorAll('.phrase-checkbox:checked').length;
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (checked > 0) {
        bulkActions.classList.add('show');
        selectedCount.textContent = `${checked} selected`;
    } else {
        bulkActions.classList.remove('show');
    }
}

function deleteSelected() {
    const checked = document.querySelectorAll('.phrase-checkbox:checked');
    const phrases = Array.from(checked).map(cb => 
        cb.parentElement.getAttribute('data-phrase')
    );
    
    if (confirm(`Delete ${phrases.length} selected phrases?`)) {
        phrases.forEach(phrase => {
            vscode.postMessage({
                command: 'deletePhrase',
                phrase: phrase
            });
        });
        
        setTimeout(() => {
            vscode.postMessage({ command: 'refresh' });
        }, 100);
    }
}

function deselectAll() {
    document.querySelectorAll('.phrase-checkbox').forEach(cb => cb.checked = false);
    updateBulkActions();
}

function showImportExportModal() {
    document.getElementById('importExportModal').classList.add('show');
}

function closeImportExportModal() {
    document.getElementById('importExportModal').classList.remove('show');
}

function exportPhrases() {
    // Get phrases from the DOM
    const phraseElements = document.querySelectorAll('.phrase-item');
    const phrases = Array.from(phraseElements).map(el => {
        const phrase = el.getAttribute('data-phrase');
        const category = el.getAttribute('data-category') || undefined;
        const replacement = el.querySelector('.phrase-replacement').textContent;
        return { phrase, replacement, category };
    });
    
    const dataStr = JSON.stringify(phrases, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'smart-phrases-' + new Date().toISOString().slice(0, 10) + '.json';
    link.click();
    
    showNotification('Phrases exported successfully!', 'success');
    closeImportExportModal();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                imported.forEach(phrase => {
                    if (phrase.phrase && phrase.replacement) {
                        vscode.postMessage({
                            command: 'addPhrase',
                            phrase: phrase
                        });
                    }
                });
                
                showNotification(`Imported ${imported.length} phrases successfully!`, 'success');
                closeImportExportModal();
                
                setTimeout(() => {
                    vscode.postMessage({ command: 'refresh' });
                }, 500);
            }
        } catch (error) {
            showNotification('Invalid JSON file', 'error');
        }
    };
    reader.readAsText(file);
}

function showNotification(message, type = 'info') {
    // VS Code will show the notification
    console.log(message);
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'f') {
                e.preventDefault();
                document.getElementById('search').focus();
            } else if (e.key === 'a' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                toggleSelectAll();
            }
        }
        
        if (e.key === 'Escape') {
            closeEditModal();
            closeImportExportModal();
        }
    });

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
});