chrome.action.onClicked.addListener((tab) => {
  // Check auth status and open popup or toggle sidebar
  chrome.storage.sync.get(["apiKey", "access_token"], function (data) {
    if (data.apiKey || data.access_token) {
      chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" });
    } else {
      chrome.action.openPopup();
    }
  });
});

// Keep the existing message listener for opening dashboard
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openDashboard") {
    chrome.tabs.create({ url: request.url });
  }
});
