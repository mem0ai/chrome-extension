document.addEventListener("DOMContentLoaded", function () {
    const memoriesContainer = document.getElementById("memoriesContainer");
    const settingsContainer = document.getElementById("settingsContainer");
    const apiKeyInput = document.getElementById("apiKey");
    const userIdInput = document.getElementById("userId");
    const saveButton = document.getElementById("saveButton");
    const openDashboardButton = document.getElementById("openDashboardButton");
    const googleSignInButton = document.getElementById("googleSignInButton");
    const addMemoryButton = document.createElement("button");
    addMemoryButton.id = "addMemoryBtn";

    function checkAuthAndFetchMemories(newMemory = false) {
      chrome.storage.sync.get(
        ["apiKey", "userId", "access_token"],
        function (data) {
          if (data.apiKey || data.access_token) {
            // Show empty memories container immediately
            displayEmptyMemories();
            fetchMemories(data.userId, data.apiKey, data.access_token).then(
              () => {
                if (newMemory) {
                  const scrollArea = document.querySelector(".scroll-area");
                  if (scrollArea) {
                    scrollArea.scrollTop = scrollArea.scrollHeight;
                  }
                }
              }
            );
          } else {
            showSettings();
          }
        }
      );
    }

    function displayEmptyMemories() {
      memoriesContainer.innerHTML = "";
      settingsContainer.style.display = "none";
      memoriesContainer.style.display = "flex";
      memoriesContainer.style.flexDirection = "column";
      memoriesContainer.style.width = "300px";

      // Create header
      const header = document.createElement("div");
      header.className = "header";
      header.innerHTML = `
        <div class="logo-container">
          <img src="icons/mem0-logo.png" alt="Mem0 Logo" class="logo">
        </div>
        <div class="header-buttons">
          <!-- Keeping this for future use -->
        </div>
      `;
      memoriesContainer.appendChild(header);

      // Add memory button
      addMemoryButton.className = "header-icon-button";
      addMemoryButton.title = "Add Memory";
      addMemoryButton.innerHTML =
        '<img src="icons/add.svg" alt="Add Memory" class="svg-icon">';
      header
        .querySelector(".header-buttons")
        .insertBefore(addMemoryButton, header.querySelector("#logoutBtn"));

      // Create scroll area with loading indicator
      const scrollArea = document.createElement("div");
      scrollArea.className = "scroll-area";
      scrollArea.innerHTML = `
        <div class="loading-indicator">
          <div class="loader"></div>
          <p>Loading memories...</p>
        </div>
      `;
      memoriesContainer.appendChild(scrollArea);

      // Create shortcut info
      const shortcutInfo = document.createElement("div");
      shortcutInfo.className = "shortcut-info";
      shortcutInfo.innerHTML = `
        <span>Mem0 Shortcut: </span>
        <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="12px" viewBox="0 0 24 24" width="12px" fill="#999999">
          <g>
            <rect fill="none" height="24" width="24"/>
          </g>
          <g>
            <g>
              <path d="M17.5,3C15.57,3,14,4.57,14,6.5V8h-4V6.5C10,4.57,8.43,3,6.5,3S3,4.57,3,6.5S4.57,10,6.5,10H8v4H6.5 C4.57,14,3,15.57,3,17.5S4.57,21,6.5,21s3.5-1.57,3.5-3.5V16h4v1.5c0,1.93,1.57,3.5,3.5,3.5s3.5-1.57,3.5-3.5S19.43,14,17.5,14H16 v-4h1.5c1.93,0,3.5-1.57,3.5-3.5S19.43,3,17.5,3L17.5,3z M16,8V6.5C16,5.67,16.67,5,17.5,5S19,5.67,19,6.5S18.33,8,17.5,8H16L16,8 z M6.5,8C5.67,8,5,7.33,5,6.5S5.67,5,6.5,5S8,5.67,8,6.5V8H6.5L6.5,8z M10,14v-4h4v4H10L10,14z M17.5,19c-0.83,0-1.5-0.67-1.5-1.5 V16h1.5c0.83,0,1.5,0.67,1.5,1.5S18.33,19,17.5,19L17.5,19z M6.5,19C5.67,19,5,18.33,5,17.5S5.67,16,6.5,16H8v1.5 C8,18.33,7.33,19,6.5,19L6.5,19z"/>
            </g>
          </g>
        </svg>
        <span> + m</span>
      `;
      memoriesContainer.appendChild(shortcutInfo);
    }

    function fetchMemories(userId, apiKey, accessToken) {
      const headers = getHeaders(apiKey, accessToken);
      return fetch(`https://api.mem0.ai/v1/memories/?user_id=${userId}`, {
        method: "GET",
        headers: headers,
      })
        .then((response) => response.json())
        .then((data) => {
          displayMemories(data);
        })
        .catch((error) => {
          console.error("Error fetching memories:", error);
          const scrollArea = memoriesContainer.querySelector(".scroll-area");
          scrollArea.innerHTML = "<p>Error fetching memories</p>";
        });
    }

    function displayMemories(memories) {
      const scrollArea = memoriesContainer.querySelector(".scroll-area");
      scrollArea.innerHTML = "";

      if (memories.length === 0) {
        scrollArea.innerHTML = `
          <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 0px 15px 15px 15px; text-align: center;">
            <p>No memories found</p>
            <p>Click the + button to add a new memory or use Mem0 with the chatbot of your choice.</p>
          </div>
        `;
      } else {
        memories.forEach((memoryItem) => {
          const memoryElement = document.createElement("div");
          memoryElement.className = "memory-item";
          memoryElement.innerHTML = `
            <span contenteditable="true">${memoryItem.memory}</span>
            <div class="memory-buttons">
              <button class="icon-button edit-btn" data-id="${memoryItem.id}">
                <img src="/icons/edit.svg" alt="Edit" class="svg-icon">
              </button>
              <button class="icon-button delete-btn" data-id="${memoryItem.id}">
                <img src="/icons/delete.svg" alt="Delete" class="svg-icon">
              </button>
            </div>
          `;
          scrollArea.appendChild(memoryElement);
  
          const span = memoryElement.querySelector("span");
          const editBtn = memoryElement.querySelector(".edit-btn");
  
          span.addEventListener("input", () => {
            editBtn.style.display = "inline";
          });
  
          span.addEventListener("blur", () => {
            if (span.textContent.trim() === memoryItem.memory) {
              editBtn.style.display = "none";
            }
          });
  
          editBtn.addEventListener("click", () => {
            editMemory(memoryItem.id, span.textContent.trim());
          });
        });
      }
  
      // Event listeners for delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", function () {
          deleteMemory(this.dataset.id);
        });
      });
    }

  function deleteMemory(memoryId) {
    chrome.storage.sync.get(["apiKey", "access_token"], function (data) {
      const headers = getHeaders(data.apiKey, data.access_token);
      fetch(`https://api.mem0.ai/v1/memories/${memoryId}/`, {
        method: "DELETE",
        headers: headers,
      })
        .then((response) => {
          if (response.ok) {
            document
              .querySelector(`[data-id="${memoryId}"]`)
              .parentElement.parentElement.remove();
            if (memoriesContainer.children.length === 1) {
              // Only the add button remains
              memoriesContainer.innerHTML = "<p>No memories found</p>";
              memoriesContainer.appendChild(addMemoryButton);
            }
          } else {
            console.error("Failed to delete memory");
          }
        })
        .catch((error) => {
          console.error("Error deleting memory:", error);
        });
    });
  }

  function editMemory(memoryId, newContent) {
    chrome.storage.sync.get(["apiKey", "access_token"], function (data) {
      const headers = getHeaders(data.apiKey, data.access_token);
      fetch(`https://api.mem0.ai/v1/memories/${memoryId}/`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify({ text: newContent }),
      })
        .then((response) => {
          if (response.ok) {
            const editButton = document.querySelector(`[data-id="${memoryId}"]`).parentElement.querySelector('.edit-btn');
            const originalContent = editButton.innerHTML;
            editButton.innerHTML = '<img src="/icons/check.svg" alt="Updated" class="svg-icon">';
            setTimeout(() => {
              editButton.innerHTML = originalContent;
            }, 500);
          } else {
            console.error("Failed to update memory");
          }
        })
        .catch((error) => {
          console.error("Error updating memory:", error);
        });
    });
  }

  addMemoryButton.addEventListener("click", function () {
    // Check if the new memory input already exists
    if (document.querySelector(".new-memory")) {
      return; // Exit the function if it already exists
    }

    const newMemoryInput = document.createElement("div");
    newMemoryInput.className = "memory-item new-memory";
    newMemoryInput.innerHTML = `
      <span contenteditable="true" placeholder="Enter new memory"></span>
      <div class="memory-buttons">
        <button class="icon-button save-new-btn" title="Save">
          <img src="/icons/done.svg" alt="Save" class="svg-icon">
        </button>
        <button class="icon-button cancel-new-btn" title="Cancel">
          <img src="/icons/close.svg" alt="Cancel" class="svg-icon">
        </button>
      </div>
    `;

    const scrollArea = document.querySelector(".scroll-area");
    if (scrollArea) {
      scrollArea.insertBefore(newMemoryInput, scrollArea.firstChild);
    } else {
      console.error("Scroll area not found");
      return;
    }

    const saveNewBtn = newMemoryInput.querySelector(".save-new-btn");
    const cancelNewBtn = newMemoryInput.querySelector(".cancel-new-btn");
    const newMemorySpan = newMemoryInput.querySelector("span");

    // Focus the new memory input
    newMemorySpan.focus();

    saveNewBtn.addEventListener("click", function () {
      const newContent = newMemorySpan.textContent.trim();
      if (newContent) {
        // Show loading indicator
        saveNewBtn.innerHTML = '<div class="loader"></div>';
        saveNewBtn.disabled = true;
        cancelNewBtn.style.display = "none";

        chrome.storage.sync.get(
          ["apiKey", "access_token", "userId"],
          function (data) {
            const headers = getHeaders(data.apiKey, data.access_token);
            fetch("https://api.mem0.ai/v1/memories/", {
              method: "POST",
              headers: headers,
              body: JSON.stringify({
                messages: [{ role: "user", content: newContent }],
                user_id: data.userId,
              }),
            })
              .then((response) => response.json())
              .then((data) => {
                // Reset button state even on success
                saveNewBtn.innerHTML =
                  '<img src="/icons/done.svg" alt="Save" class="svg-icon">';
                saveNewBtn.disabled = false;
                cancelNewBtn.style.display = "block";

                newMemoryInput.remove();
                checkAuthAndFetchMemories(true); // Refresh the memories list
              })
              .catch((error) => {
                console.error("Error adding memory:", error);
                // Reset the save button if there's an error
                saveNewBtn.innerHTML =
                  '<img src="/icons/done.svg" alt="Save" class="svg-icon">';
                saveNewBtn.disabled = false;
                cancelNewBtn.style.display = "block";
              });
          }
        );
      }
    });

    cancelNewBtn.addEventListener("click", function () {
      newMemoryInput.remove();
    });
  });

  function getHeaders(apiKey, accessToken) {
    const headers = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Token ${apiKey}`;
    } else if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return headers;
  }

  function showSettings() {
    memoriesContainer.style.display = "none";
    settingsContainer.style.display = "block";
  }

  // Initial check and fetch
  checkAuthAndFetchMemories();

  if (saveButton) {
    saveButton.addEventListener("click", function () {
      const apiKey = apiKeyInput ? apiKeyInput.value : "";
      const userId = userIdInput ? userIdInput.value : "chrome-extension-user";
      chrome.storage.sync.set({ apiKey, userId }, function () {
        checkAuthAndFetchMemories();
      });
    });
  }

  if (openDashboardButton) {
    openDashboardButton.addEventListener("click", () => {
      chrome.storage.sync.get(["userId"], function (data) {
        const userId = data.userId || "chrome-extension-user";
        chrome.tabs.create(
          { url: `https://app.mem0.ai/dashboard/user/${userId}` },
          function () {
            window.close();
          }
        );
      });
    });
  }

  if (googleSignInButton) {
    googleSignInButton.addEventListener("click", function () {
      chrome.storage.sync.set({ userId: "chrome-extension-user" });
      chrome.tabs.create({ url: "https://app.mem0.ai/login?source=chrome-extension" }, function (tab) {
        window.close();
      });
    });
  }

  // Update the CSS styles
  const style = document.createElement("style");
  style.textContent = `
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 15px 15px 15px;
    }
      .svg-icon {
    }
    .logo-container {
      display: fixed;
      height: 24px;
    }
    .logo {
      width: auto;
      height: 24px;
    }
    .header-buttons {
      display: flex;
      gap: 12px;
      margin-bottom: 4px;
    }
    .header-icon-button {
      background: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: 1px solid transparent;
      transition: filter 0.3s ease;
    }

    .header-icon-button:hover {
      filter: brightness(70%);
    }

    .header-icon-button .svg-icon {
      width: 20px;
      height: 20px;
      filter: invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(60%) contrast(100%);
    }

    .icon-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      transition: filter 0.3s ease;
    }

    .icon-button:hover {
      filter: brightness(70%);
    }

    .icon-button .svg-icon {
      width: 16px;
      height: 16px;
      filter: invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(80%) contrast(100%);
    }

    .scroll-area {
      height: 400px;
      overflow-y: auto;
      padding: 0px 10px;
    }
    .memory-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 10px 5px;
    }
    .memory-item span[contenteditable] {
      flex: 1;
      min-width: 0;
      word-wrap: break-word;
      white-space: pre-wrap;
      max-width: 220px; /* Adjust this value as needed */
    }

    .new-memory {
        display: flex;
        padding: 0px 12px 15px 15px;
        align-items: center;
    }

    .new-memory span[contenteditable] {
      border: 1px solid #ccc;
      padding: 5px;
      border-radius: 4px;
      min-height: 16px;
      outline: none;
    }

    .new-memory span[contenteditable]:focus {
      border-color: #aaa;
    }

    .new-memory span[contenteditable]:empty:before {
      content: attr(placeholder);
      color: #999;
    }

    .memory-buttons {
      display: flex;
      gap: 5px;
      margin-left: 10px;
      align-self: flex-start;
    }

    .shortcut-info {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 5px;
        padding: 6px;
        font-size: 12px;
        color: #666;
    }

    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .loader {
      border: 2px solid #f3f3f3;
      border-top: 2px solid #3498db;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
});
