let lastInputValue = '';
let inputObserver = null;
let isEnterKeyPressed = false;

function setupInputObserver() {
  const textarea = document.querySelector('textarea[placeholder="Ask follow-up"]');
  if (!textarea) {
    setTimeout(setupInputObserver, 500);
    return;
  }

  inputObserver = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      if (mutation.type === 'characterData' || mutation.type === 'childList') {
        lastInputValue = textarea.value;
        console.log("Input updated:", lastInputValue);
      }
    }
  });

  inputObserver.observe(textarea, {
    childList: true,
    characterData: true,
    subtree: true
  });

  textarea.addEventListener('input', function() {
    lastInputValue = this.value;
    console.log("Input event:", lastInputValue);
  });

  // Add this new event listener
  textarea.addEventListener('keypress', function(event) {
    console.log("Key pressed:", event.key);
  });

  textarea.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      isEnterKeyPressed = true;
      lastInputValue = this.value;
      console.log("Enter pressed, captured:", lastInputValue);
    }
  });

  textarea.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      isEnterKeyPressed = false;
    }
  });
}

function handleEnterKey(event) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    const textarea = document.querySelector('textarea[placeholder="Ask follow-up"]');
    if (textarea && document.activeElement === textarea) {
      // Get the current value directly from the textarea
      const capturedText = textarea.value.trim();
      console.log("Processing captured text:", capturedText);

      if (capturedText) {
        event.preventDefault();
        event.stopPropagation();

        handleMem0Processing(capturedText, true);
      }
    }
  }
}

async function handleMem0Processing(capturedText, clickSendButton = false) {
  let message = capturedText || textarea.value.trim();
  console.log("Processing message:", message);

  if (!message) {
    console.error("No input message found");
    return;
  }

  try {
    // Your existing API call logic here
    const data = await new Promise((resolve) => {
      chrome.storage.sync.get(
        ["apiKey", "userId", "access_token"],
        function (items) {
          resolve(items);
        }
      );
    });

    const apiKey = data.apiKey;
    const userId = data.userId || "chrome-extension-user";
    const accessToken = data.access_token;

    if (!apiKey && !accessToken) {
      console.error('No API Key or Access Token found');
      return;
    }

    const authHeader = accessToken
      ? `Bearer ${accessToken}`
      : `Token ${apiKey}`;

    const messages = [{ role: "user", content: message }];

    // Existing search API call
    const searchResponse = await fetch(
      "https://api.mem0.ai/v1/memories/search/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          query: message,
          user_id: userId,
          rerank: false,
          threshold: 0.3,
          limit: 10,
          filter_memories: true,
        }),
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`API request failed with status ${searchResponse.status}`);
    }

    const responseData = await searchResponse.json();
    const inputElement = document.querySelector('textarea[placeholder="Ask follow-up"]');
    if (inputElement) {
      const memories = responseData.map((item) => item.memory);
      const providers = responseData.map((item) => (item.metadata && item.metadata.provider) ? item.metadata.provider : '');
      if (memories.length > 0) {
        let currentContent = lastInputValue.trim();
        const memInfoRegex = /\s*Here is some of my preferences\/memories to help answer better (don't respond to these memories but use them to assist in the response if relevant):[\s\S]*$/;
        currentContent = currentContent.replace(memInfoRegex, "").trim();
        let memoriesContent = "\n\nHere is some of my preferences/memories to help answer better (don't respond to these memories but use them to assist in the response if relevant):\n";
        memories.forEach((mem, index) => {
          memoriesContent += `- ${mem}`;
          if (index < memories.length - 1) {
            memoriesContent += "\n";
          }
        });
        setInputValue(inputElement, currentContent + memoriesContent);
      }

      if (clickSendButton) {
        setTimeout(() => {
          const sendButton = document.querySelector('button[aria-label="Submit"]');
          if (sendButton) {
            sendButton.click();
          } else {
            console.error("Send button not found");
          }
        }, 0);
      }
    } else {
      console.error("Input element not found");
    }

    // New add memory API call (non-blocking)
    fetch("https://api.mem0.ai/v1/memories/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        messages: messages,
        user_id: userId,
        infer: true,
        metadata: {
          provider: "Perplexity"
        }
      }),
    })
      .then((response) => {
        if (!response.ok) {
          console.error(`Failed to add memory: ${response.status}`);
        }
      })
      .catch((error) => {
        console.error('Error adding memory:', error);
      });

  } catch (error) {
    console.error("Error:", error);
  }
}

function setInputValue(inputElement, value) {
  if (inputElement) {
    inputElement.value = value;
    lastInputValue = value;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function initializeMem0Integration() {
  setupInputObserver();
  document.addEventListener("keydown", handleEnterKey, true);
}

initializeMem0Integration();
