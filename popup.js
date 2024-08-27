document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const userIdInput = document.getElementById('userId');
    const saveButton = document.getElementById('saveButton');
    const openDashboardButton = document.getElementById('openDashboardButton');

    if (!chrome.storage || !chrome.storage.sync) {
        updateStatus('Error: Chrome storage API is not available');
        return;
    }

    // Load saved API key and userId
    chrome.storage.sync.get(['apiKey', 'userId'], function(data) {
        if (apiKeyInput && data.apiKey) apiKeyInput.value = data.apiKey;
        if (userIdInput && data.userId) userIdInput.value = data.userId || 'claude-user';
    });

    if (saveButton) {
        saveButton.addEventListener('click', function() {
            const apiKey = apiKeyInput ? apiKeyInput.value : '';
            const userId = userIdInput ? userIdInput.value : 'claude-user';
            chrome.storage.sync.set({apiKey, userId}, function() {
                updateStatus('Saved successfully!');
                setTimeout(() => updateStatus(''), 3000);
            });
        });
    } else {
        console.error('Save button not found');
    }

    if (openDashboardButton) {
        openDashboardButton.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://app.mem0.ai/dashboard/user/claude-user' });
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
