let isProcessingMem0 = false;

function addMem0Button() {
  const submitButtons = document.querySelectorAll(
    'button[aria-label="Submit"]'
  );
  if (submitButtons.length === 0) {
    setTimeout(addMem0Button, 500);
    return;
  }

  submitButtons.forEach((submitButton) => {
    const targetDiv = submitButton.parentElement;
    const proButtonContainer = targetDiv.querySelector(".group\\/switch");

    if (targetDiv && !targetDiv.querySelector("#mem0-button-container")) {
      // Create a new container for the mem0 button
      const mem0ButtonContainer = document.createElement("div");
      mem0ButtonContainer.id = "mem0-button-container";
      mem0ButtonContainer.style.cssText = `
        display: inline-flex;
        align-items: center;
        margin-right: 8px;
        position: relative;
      `;

      // Create the mem0 button
      const mem0Button = document.createElement("img");
      mem0Button.id = "mem0-button";
      mem0Button.src = chrome.runtime.getURL(
        "icons/mem0-claude-icon-purple.png"
      );
      mem0Button.style.cssText = `
        width: 18px;
        height: 18px;
        cursor: pointer;
        padding: 11px;
        border-radius: 9px;
        transition: filter 0.3s ease, opacity 0.3s ease;
        box-sizing: content-box;
      `;

      // Create default tooltip (below the button)
      const defaultTooltip = document.createElement("div");
      defaultTooltip.textContent = "Add related memories";
      defaultTooltip.style.cssText = `
        visibility: hidden;
        position: absolute;
        background-color: #2d2f2f;
        color: white;
        text-align: center;
        border-radius: 4px;
        padding: 5px 8px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.3s, visibility 0.3s;
        z-index: 1000;
        top: -80%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 5px;
      `;

      // Create message tooltip (above the button)
      const messageTooltip = document.createElement("div");
      messageTooltip.style.cssText = `
        visibility: hidden;
        position: absolute;
        background-color: #191a1a;
        color: white;
        text-align: center;
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.3s, visibility 0.3s;
        z-index: 1000;
        top: 50%;
        left: -140px;
        transform: translateY(-50%);
        margin-right: 5px;
      `;

      mem0ButtonContainer.appendChild(mem0Button);
      mem0ButtonContainer.appendChild(defaultTooltip);
      mem0ButtonContainer.appendChild(messageTooltip);

      // Insert the mem0ButtonContainer before the Pro button
      if (proButtonContainer) {
        proButtonContainer.parentElement.insertBefore(
          mem0ButtonContainer,
          proButtonContainer
        );
      } else {
        // If Pro button is not found, insert before the submit button
        targetDiv.insertBefore(mem0ButtonContainer, submitButton);
      }

      // Event listeners
      mem0Button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!mem0Button.disabled) {
          handleMem0Click(defaultTooltip, messageTooltip);
        }
      });

      mem0Button.addEventListener("mouseenter", () => {
        if (!mem0Button.disabled) {
          mem0Button.style.filter = "brightness(70%)";
          showTooltip(defaultTooltip);
        }
      });

      mem0Button.addEventListener("mouseleave", () => {
        mem0Button.style.filter = "none";
        hideTooltip(defaultTooltip);
      });

      // Function to update button states
      function updateButtonStates() {
        const isSubmitEnabled = !submitButton.disabled;
        mem0Button.disabled = !isSubmitEnabled;
        mem0Button.style.opacity = isSubmitEnabled ? "1" : "0.5";
        mem0Button.style.pointerEvents = isSubmitEnabled ? "auto" : "none";
      }

      // Initial update
      updateButtonStates();

      // Create a MutationObserver to watch for changes in the submit button's disabled attribute
      const observer = new MutationObserver(updateButtonStates);
      observer.observe(submitButton, {
        attributes: true,
        attributeFilter: ["disabled"],
      });

      // Clean up the observer when the mem0 button is removed
      const cleanupObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "childList" &&
            !document.body.contains(mem0ButtonContainer)
          ) {
            observer.disconnect();
            cleanupObserver.disconnect();
          }
        });
      });
      cleanupObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  });
}

function setButtonLoadingState(isLoading) {
  const mem0Button = document.querySelector("#mem0-button");
  if (mem0Button) {
    if (isLoading) {
      mem0Button.disabled = true;
      document.body.style.cursor = "wait";
      mem0Button.style.cursor = "wait";
      mem0Button.style.opacity = "0.7";
    } else {
      mem0Button.disabled = false;
      document.body.style.cursor = "default";
      mem0Button.style.cursor = "pointer";
      mem0Button.style.opacity = "1";
    }
  }
}

function showTooltip(tooltip, message) {
  if (message) {
    // Create and add the (i) icon
    const infoIcon = document.createElement("span");
    infoIcon.textContent = "ⓘ ";
    infoIcon.style.marginRight = "3px";

    tooltip.innerHTML = "";
    tooltip.appendChild(infoIcon);
    tooltip.appendChild(document.createTextNode(message));
  }
  tooltip.style.visibility = "visible";
  tooltip.style.opacity = "1";
}

function hideTooltip(tooltip) {
  tooltip.style.visibility = "hidden";
  tooltip.style.opacity = "0";
}

async function handleMem0Click(
  defaultTooltip,
  messageTooltip,
  clickSendButton = false
) {
  console.log("handleMem0Click called");
  const inputElement = getInputElement();
  console.log("Input element:", inputElement);
  let message = getInputValue(inputElement);
  console.log("Message:", message);
  setButtonLoadingState(true);
  if (!message) {
    console.error("No input message found");
    Sentry.captureMessage("No input message found in handleMem0Click");
    showTooltip(messageTooltip, "No input message");
    setTimeout(() => hideTooltip(messageTooltip), 2000);
    setButtonLoadingState(false);
    return;
  }

  const memInfoRegex = /\s*Here is some more information about me:[\s\S]*$/;
  message = message.replace(memInfoRegex, "").trim();
  const endIndex = message.indexOf("</p>");
  if (endIndex !== -1) {
    message = message.slice(0, endIndex + 4);
  }

  if (isProcessingMem0) {
    return;
  }

  isProcessingMem0 = true;
  hideTooltip(defaultTooltip);

  try {
    const data = await new Promise((resolve) => {
      chrome.storage.sync.get(
        ["apiKey", "userId", "access_token"],
        function (items) {
          resolve(items);
        }
      );
    });

    const apiKey = data.apiKey;
    const userId = data.userId || "perplexity-user";
    const accessToken = data.access_token;

      if (!apiKey && !accessToken) {
        Sentry.captureMessage('No API Key or Access Token found in handleMem0Click');
        showTooltip(messageTooltip, 'No API Key or Access Token found');
        setTimeout(() => hideTooltip(messageTooltip), 2000);
        isProcessingMem0 = false;
        setButtonLoadingState(false);
        return;
      }


    const authHeader = accessToken
      ? `Bearer ${accessToken}`
      : `Token ${apiKey}`;

    const messages = [];
    messages.push({ role: "user", content: message });
    console.log(messages);

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
  const errorMessage = `API request failed with status ${searchResponse.status}`;
  Sentry.captureException(new Error(errorMessage));
  throw new Error(errorMessage);
}

    if (!searchResponse.ok) {
      throw new Error(
        `API request failed with status ${searchResponse.status}`
      );
    }

    const responseData = await searchResponse.json();

    if (inputElement) {
      const memories = responseData.map((item) => item.memory);

      if (memories.length > 0) {
        // Prepare the memories content
        let currentContent = getInputValue(inputElement);

        const memInfoRegex =
          /\s*Here is some more information about me:[\s\S]*$/;
        currentContent = currentContent.replace(memInfoRegex, "").trim();

        let memoriesContent = "\n\nHere is some more information about me:\n";
        memories.forEach((mem, index) => {
          memoriesContent += `- ${mem}`;
          if (index < memories.length - 1) {
            memoriesContent += "\n";
          }
        });

        // Insert the memories into the input field
        setInputValue(inputElement, currentContent + memoriesContent);
        setButtonLoadingState(false);

        if (clickSendButton) {
          const sendButton = inputElement.closest(
            '[data-testid="quick-search-modal"]'
          )
            ? inputElement
                .closest('[data-testid="quick-search-modal"]')
                .querySelector('button[aria-label="Submit"]')
            : document.querySelector('button[aria-label="Submit"]');

          if (sendButton) {
            setTimeout(() => {
              sendButton.click();
            }, 100);
          } else {
            console.error("Send button not found");
          }
        }
      } else {
        showTooltip(messageTooltip, "No memories found");
        setTimeout(() => hideTooltip(messageTooltip), 2000);
        setButtonLoadingState(false);
      }
    }
    setTimeout(() => hideTooltip(messageTooltip), 2000);
    setButtonLoadingState(false);

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
  }),
})
  .then((response) => {
    if (!response.ok) {
      const errorMessage = `Failed to add memory: ${response.status}`;
      Sentry.captureMessage(errorMessage);
      console.error(errorMessage);
    }
  })
  .catch((error) => {
    Sentry.captureException(error);
    console.error('Error adding memory:', error);
  });
  } catch (error) {
    console.error("Error:", error);
    setButtonLoadingState(false);
  } finally {
    isProcessingMem0 = false;
  }
}

function getInputElement() {
  const elements = [
    document.querySelector('[data-testid="quick-search-modal"] textarea'),
    document.querySelector(".col-start-1.col-end-4 textarea"),
    document.querySelector('div[contenteditable="true"]'),
    document.querySelector("textarea"),
  ];

  const element = elements.find(el => el !== null);
  if (!element) {
    Sentry.captureMessage("No input element found in getInputElement");
  }
  return element;
}

function getInputValue(inputElement) {
  if (!inputElement) {
    Sentry.captureMessage("No input element found in getInputValue");
    console.log("No input element found");
    return null;
  }

  let value;
  if (inputElement.tagName.toLowerCase() === "div") {
    value = inputElement.textContent;
  } else if (inputElement.tagName.toLowerCase() === "textarea") {
    value = inputElement.value;

    // If the textarea is empty, check for the invisible span
    if (!value) {
      const parentDiv = inputElement.closest(".col-start-1.col-end-4");
      if (parentDiv) {
        const invisibleSpan = parentDiv.querySelector("span.invisible");
        if (invisibleSpan) {
          value = invisibleSpan.textContent;
        }
      }
    }
  }

  console.log("Input value:", value);
  return value;
}

function setInputValue(inputElement, value) {
  if (!inputElement) return;

  if (inputElement.tagName.toLowerCase() === "div") {
    inputElement.textContent = value;
  } else if (inputElement.tagName.toLowerCase() === "textarea") {
    inputElement.value = value;

    // For quick-search-modal, we need to update the associated span
    const parentDiv = inputElement.closest(".col-start-1.col-end-4");
    if (parentDiv) {
      const invisibleSpan = parentDiv.querySelector("span.invisible");
      if (invisibleSpan) {
        invisibleSpan.textContent = value;
      }
    }
  }

  // Trigger input event to update any associated UI
  inputElement.dispatchEvent(new Event("input", { bubbles: true }));
}

function initializeMem0Integration() {
  document.addEventListener("DOMContentLoaded", () => {
    addMem0Button();
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "m") {
      event.preventDefault();
      const defaultTooltip = document.querySelector(
        "#mem0-button-container > div:nth-child(2)"
      );
      const messageTooltip = document.querySelector(
        "#mem0-button-container > div:nth-child(3)"
      );
      handleMem0Click(defaultTooltip, messageTooltip, true);
    }
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      addMem0Button();
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

initializeMem0Integration();
