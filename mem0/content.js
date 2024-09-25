function fetchAndSaveSession() {
    fetch('https://app.mem0.ai/api/auth/session')
        .then(response => response.json())
        .then(data => {
            if (data && data.access_token) {
                chrome.storage.sync.set({ access_token: data.access_token });
            }
        })
        .catch(error => {
            console.error('Error fetching session:', error);
        });
}

fetchAndSaveSession();