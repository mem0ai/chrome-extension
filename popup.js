document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const userIdInput = document.getElementById('userId');
    const saveButton = document.getElementById('saveButton');
    const openDashboardButton = document.getElementById('openDashboardButton');
    const togglePasswordButton = document.querySelector('.toggle-password');

    if (!chrome.storage || !chrome.storage.sync) {
        console.error('Error: Chrome storage API is not available');
        return;
    }

    // Load saved API key and userId
    chrome.storage.sync.get(['apiKey', 'userId'], function(data) {
        if (apiKeyInput && data.apiKey) apiKeyInput.value = data.apiKey;
        if (userIdInput && data.userId) userIdInput.value = data.userId || 'chrome-extension-user';
    });

    if (saveButton) {
        saveButton.addEventListener('click', function() {
            const apiKey = apiKeyInput ? apiKeyInput.value : '';
            const userId = userIdInput ? userIdInput.value : 'chrome-extension-user';
            chrome.storage.sync.set({apiKey, userId}, function() {
                window.close(); // Close the popup after saving
            });
        });
    } else {
        console.error('Save button not found');
    }

    if (openDashboardButton) {
        openDashboardButton.addEventListener('click', () => {
            chrome.storage.sync.get(['userId'], function(data) {
                const userId = data.userId || 'chrome-extension-user';
                chrome.tabs.create({ url: `https://app.mem0.ai/dashboard/user/${userId}` }, function() {
                    window.close(); // Close the popup after opening the dashboard
                });
            });
        });
    } else {
        console.error('Open dashboard button not found');
    }

    // Add password toggle functionality
    if (togglePasswordButton && apiKeyInput) {
        togglePasswordButton.addEventListener('click', function() {
            const eyeIcon = this.querySelector('.eye-icon');
            const eyeOffIcon = this.querySelector('.eye-off-icon');

            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                eyeIcon.style.display = 'none';
                eyeOffIcon.style.display = 'block';
            } else {
                apiKeyInput.type = 'password';
                eyeIcon.style.display = 'block';
                eyeOffIcon.style.display = 'none';
            }
        });
    } else {
        console.error('Toggle password button or API key input not found');
    }
});