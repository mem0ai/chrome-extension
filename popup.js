document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const userIdInput = document.getElementById('userId');
    const runIdInput = document.getElementById('runId');
    const saveButton = document.getElementById('saveButton');
    const openDashboardButton = document.getElementById('openDashboardButton');

    if (!chrome.storage || !chrome.storage.sync) {
        updateStatus('Error: Chrome storage API is not available');
        return;
    }

    // Load saved API key and userId
    chrome.storage.sync.get(['apiKey', 'userId', 'runId'], function(data) {
        if (apiKeyInput && data.apiKey) apiKeyInput.value = data.apiKey;
        if (userIdInput && data.userId) userIdInput.value = data.userId || 'claude-user';
        if (runIdInput && data.runId) runIdInput.value = data.runId || null;
    });

    if (saveButton) {
        saveButton.addEventListener('click', function() {
            const apiKey = apiKeyInput ? apiKeyInput.value : '';
            const userId = userIdInput ? userIdInput.value : 'claude-user';
            const runId = runIdInput ? runIdInput.value : null;
            chrome.storage.sync.set({apiKey, userId, runId}, function() {
                updateStatus('Saved successfully!');
                setTimeout(() => updateStatus(''), 3000);
            });
        });
    } else {
        console.error('Save button not found');
    }

    if (openDashboardButton) {
        openDashboardButton.addEventListener('click', () => {
            chrome.storage.sync.get(['userId'], function(data) {
                const userId = data.userId || 'claude-user';
                chrome.tabs.create({ url: `https://app.mem0.ai/dashboard/user/${userId}` });
            });
        });
    } else {
        console.error('Open dashboard button not found');
    }
});

function updateStatus(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
    } else {
        console.error('Status element not found');
    }
}
