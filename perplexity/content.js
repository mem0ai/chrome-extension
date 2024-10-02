let isProcessingMem0 = false;

function addMem0Button() {
  const submitButton = document.querySelector('button[aria-label="Submit"]');
  if (!submitButton) {
    setTimeout(addMem0Button, 500);
    return;
  }

  const targetDiv = submitButton.parentElement;

  if (targetDiv && !document.querySelector("#mem0-button-container")) {
    // Create a new container for the mem0 button
    const mem0ButtonContainer = document.createElement("div");
    mem0ButtonContainer.id = "mem0-button-container";
    mem0ButtonContainer.style.cssText = `
            display: inline-flex;
            align-items: center;
            margin-right: ${
              window.location.href.startsWith(
                "https://www.perplexity.ai/search"
              )
                ? "19px"
                : "0px"
            };
            position: relative;
        `;

    // Create the mem0 button
    const mem0Button = document.createElement("img");
    mem0Button.id = "mem0-button";
    mem0Button.src = chrome.runtime.getURL("icons/mem0-claude-icon-purple.png");
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

    // Insert the mem0ButtonContainer as the first child of the target div
    targetDiv.insertBefore(mem0ButtonContainer, targetDiv.firstChild);

    // Event listeners
    mem0Button.addEventListener("click", () =>
      handleMem0Click(defaultTooltip, messageTooltip)
    );

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
      const inputElement =
        document.querySelector("textarea") ||
        document.querySelector('input[type="text"]') ||
        document.querySelector('div[contenteditable="true"]');
      const hasText =
        inputElement &&
        (inputElement.value || inputElement.textContent).trim().length > 0;

      mem0Button.disabled = !hasText;
      mem0Button.style.opacity = hasText ? "1" : "0.5";
      mem0Button.style.pointerEvents = hasText ? "auto" : "none";
    }

    // Initial update
    updateButtonStates();

    // Listen for input changes
    const inputElement =
      document.querySelector("textarea") ||
      document.querySelector('input[type="text"]') ||
      document.querySelector('div[contenteditable="true"]');
    if (inputElement) {
      inputElement.addEventListener("input", updateButtonStates);
    }
  }
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

async function handleMem0Click(defaultTooltip, messageTooltip, clickSendButton = false) {
  const inputElement =
    document.querySelector('div[contenteditable="true"]') ||
    document.querySelector("textarea");
  let message = getInputValue();
  setButtonLoadingState(true);
  if (!message) {
    console.error("No input message found");
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
        showTooltip(messageTooltip, 'No API Key or Access Token found');
        setTimeout(() => hideTooltip(messageTooltip), 2000);
        isProcessingMem0 = false;
        setButtonLoadingState(false);
        return;
      }

      const authHeader = accessToken ? `Bearer ${accessToken}` : `Token ${apiKey}`;

      const messages = getLastMessages(2);
      messages.push({ role: "user", content: message });
      console.log(messages);

      // Existing search API call
      const searchResponse = await fetch('https://api.mem0.ai/v1/memories/search/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          query: message,
          user_id: userId,
          rerank: true,
          threshold: 0.3,
          limit: 10
        })
      });

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
          let currentContent =
            inputElement.tagName.toLowerCase() === "div"
              ? inputElement.innerHTML
              : inputElement.value;

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
          if (inputElement.tagName.toLowerCase() === "div") {
            // For contenteditable div
            inputElement.innerHTML = currentContent + memoriesContent;
          } else {
            // For textarea
            inputElement.value = currentContent + memoriesContent;
          }
          inputElement.dispatchEvent(new Event("input", { bubbles: true }));
          setButtonLoadingState(false);
        } else {
          showTooltip(messageTooltip, "No memories found");
          setTimeout(() => hideTooltip(messageTooltip), 2000);
          setButtonLoadingState(false);
        }
      }
      setTimeout(() => hideTooltip(messageTooltip), 2000);
      setButtonLoadingState(false);

      if (clickSendButton) {
        const sendButton = document.querySelector('button[aria-label="Submit"]');
          if (sendButton) {
              setTimeout(() => {
                sendButton.click();
              }, 100);
          } else {
              console.error("Send button not found");
          }
        }

      // New add memory API call (non-blocking)
      fetch('https://api.mem0.ai/v1/memories/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          messages: messages,
          user_id: userId,
          infer: true
        })
      }).then(response => {
        if (!response.ok) {
          console.error('Failed to add memory:', response.status);
        }
      }).catch(error => {
        console.error('Error adding memory:', error);
      });

  } catch (error) {
    console.error("Error:", error);
    setButtonLoadingState(false);
  } finally {
    isProcessingMem0 = false;
  }
}

function getLastMessages(count) {
  const messages = [];

  const questionElements = Array.from(
    document.querySelectorAll(".my-md.md\\:my-lg")
  ).reverse();
  const answerElements = Array.from(
    document.querySelectorAll(".mb-md")
  ).reverse();

  const combinedElements = [];
  for (
    let i = 0;
    i < Math.max(questionElements.length, answerElements.length);
    i++
  ) {
    if (i < questionElements.length) combinedElements.push(questionElements[i]);
    if (i < answerElements.length) combinedElements.push(answerElements[i]);
  }

  for (const element of combinedElements) {
    if (messages.length >= count) break;

    if (element.classList.contains("my-md")) {
      const content = element.textContent.trim();
      messages.push({ role: "user", content });
    } else if (element.classList.contains("mb-md")) {
      const content = element.textContent.trim();
      messages.push({ role: "assistant", content });
    }
  }

  return messages;
}

function getInputValue() {
  const inputElement =
    document.querySelector('div[contenteditable="true"]') ||
    document.querySelector("textarea");
  return inputElement ? inputElement.textContent || inputElement.value : null;
}

function initializeMem0Integration() {
  document.addEventListener("DOMContentLoaded", () => {
    addMem0Button();
  });

  document.addEventListener("keydown", (event) => {
    console.log("clicked");
    if (event.ctrlKey && event.key === "m") {
      console.log("desired");
      event.preventDefault();
      const defaultTooltip = document.querySelector(
        "#mem0-button-container > div:nth-child(2)"
      );
      const messageTooltip = document.querySelector(
        "#mem0-button-container > div:nth-child(3)"
      );
      (async () => {
        await handleMem0Click(defaultTooltip, messageTooltip, true);
      })();
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
