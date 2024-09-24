let isProcessingMem0 = false;

function addMem0Button() {
    const submitButton = document.querySelector('button[aria-label="Submit"]');
    if (!submitButton) {
        setTimeout(addMem0Button, 500);
        return;
    }

    const targetDiv = submitButton.parentElement;

    if (targetDiv && !document.querySelector('#mem0-button-container')) {
        // Create a new container for the mem0 button
        const mem0ButtonContainer = document.createElement('div');
        mem0ButtonContainer.id = 'mem0-button-container';
        mem0ButtonContainer.style.cssText = `
            display: inline-flex;
            align-items: center;
            margin-right: ${window.location.href.startsWith('https://www.perplexity.ai/search') ? '19px' : '0px'};
            position: relative;
        `;

        // Create the mem0 button
        const mem0Button = document.createElement('img');
        mem0Button.id = 'mem0-button';
        mem0Button.src = chrome.runtime.getURL('icons/mem0-claude-icon.png');
        mem0Button.style.cssText = `
            width: 22px;
            height: 22px;
            cursor: pointer;
            padding: 11px;
            border-radius: 9px;
            transition: filter 0.3s ease, opacity 0.3s ease;
            box-sizing: content-box;
        `;

        // Create default tooltip (below the button)
        const defaultTooltip = document.createElement('div');
        defaultTooltip.textContent = 'Add related memories';
        defaultTooltip.style.cssText = `
            visibility: hidden;
            position: absolute;
            background-color: black;
            color: white;
            text-align: center;
            border-radius: 4px;
            padding: 5px 8px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.3s, visibility 0.3s;
            z-index: 1000;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 5px;
        `;

        // Create message tooltip (above the button)
        const messageTooltip = document.createElement('div');
        messageTooltip.style.cssText = `
            visibility: hidden;
            position: absolute;
            background-color: black;
            color: white;
            text-align: center;
            border-radius: 4px;
            padding: 5px 8px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.3s, visibility 0.3s;
            z-index: 1000;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 5px;
        `;

        mem0ButtonContainer.appendChild(mem0Button);
        mem0ButtonContainer.appendChild(defaultTooltip);
        mem0ButtonContainer.appendChild(messageTooltip);

        // Insert the mem0ButtonContainer as the first child of the target div
        targetDiv.insertBefore(mem0ButtonContainer, targetDiv.firstChild);

        // Event listeners
        mem0Button.addEventListener('click', () => handleMem0Click(defaultTooltip, messageTooltip));

        mem0Button.addEventListener('mouseenter', () => {
            if (!mem0Button.disabled) {
                mem0Button.style.filter = 'brightness(70%)';
                showTooltip(defaultTooltip);
            }
        });

        mem0Button.addEventListener('mouseleave', () => {
            mem0Button.style.filter = 'none';
            hideTooltip(defaultTooltip);
        });

        // Function to update button states
        function updateButtonStates() {
            const inputElement =
                document.querySelector('textarea') ||
                document.querySelector('input[type="text"]') ||
                document.querySelector('div[contenteditable="true"]');
            const hasText = inputElement && (inputElement.value || inputElement.textContent).trim().length > 0;

            mem0Button.disabled = !hasText;
            mem0Button.style.opacity = hasText ? '1' : '0.5';
            mem0Button.style.pointerEvents = hasText ? 'auto' : 'none';
        }

        // Initial update
        updateButtonStates();

        // Listen for input changes
        const inputElement =
            document.querySelector('textarea') ||
            document.querySelector('input[type="text"]') ||
            document.querySelector('div[contenteditable="true"]');
        if (inputElement) {
            inputElement.addEventListener('input', updateButtonStates);
        }
    }
}

function showTooltip(tooltip, message) {
    if (message) {
        tooltip.textContent = message;
    }
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';
}

function hideTooltip(tooltip) {
    tooltip.style.visibility = 'hidden';
    tooltip.style.opacity = '0';
}

async function handleMem0Click(defaultTooltip, messageTooltip) {
    const inputElement = document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea');
    let message = getInputValue();
    if (!message) {
        console.error('No input message found');
        showPopup(popup, 'No input message found');
        return;
    }

    const memInfoRegex = /\s*Here is some more information about me:[\s\S]*$/;
    message = message.replace(memInfoRegex, '').trim();
    const endIndex = message.indexOf('</p>');
    if (endIndex !== -1) {
        message = message.slice(0, endIndex+4);
    }

    if (isProcessingMem0) {
        return;
    }

    isProcessingMem0 = true;
    hideTooltip(defaultTooltip);

    try {
        chrome.storage.sync.get(['apiKey', 'userId'], async function(data) {
            const apiKey = data.apiKey;
            const userId = data.userId || 'claude-user';

            if (!apiKey) {
                showTooltip(messageTooltip, 'API key not found');
                setTimeout(() => hideTooltip(messageTooltip), 1000);
                isProcessingMem0 = false;
                return;
            }

            const messages = getLastMessages(2);
            messages.push({ role: "user", content: message });

            // Existing search API call
            const searchResponse = await fetch('https://api.mem0.ai/v1/memories/search/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${apiKey}`
                },
                body: JSON.stringify({ query: message, user_id: userId, rerank: true, threshold: 0.1, limit: 10 })
            });

            // New add memory API call (non-blocking)
            fetch('https://api.mem0.ai/v1/memories/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${apiKey}`
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

            if (!searchResponse.ok) {
                throw new Error(`API request failed with status ${searchResponse.status}`);
            }

            const responseData = await searchResponse.json();

            if (inputElement) {
                const memories = responseData.map(item => item.memory);

                if (memories.length > 0) {
                    // Prepare the memories content
                    let currentContent = inputElement.tagName.toLowerCase() === 'div' ? inputElement.innerHTML : inputElement.value;

                    const memInfoRegex = /\s*Here is some more information about me:[\s\S]*$/;
                    currentContent = currentContent.replace(memInfoRegex, '').trim();

                    let memoriesContent = '\n\nHere is some more information about me:\n';
                    memories.forEach(mem => {
                        memoriesContent += `- ${mem}\n`;
                    });

                    // Insert the memories into the input field
                    if (inputElement.tagName.toLowerCase() === 'div') {
                        // For contenteditable div
                        inputElement.innerHTML = currentContent + memoriesContent;
                    } else {
                        // For textarea
                        inputElement.value = currentContent + memoriesContent;
                    }
                    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    showTooltip(messageTooltip, 'No memories found');
                }
            }
            setTimeout(() => hideTooltip(messageTooltip), 1000);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        isProcessingMem0 = false;
    }
}

function getLastMessages(count) {
    const messages = [];

    const questionElements = Array.from(document.querySelectorAll('.my-md.md\\:my-lg')).reverse();
    const answerElements = Array.from(document.querySelectorAll('.mb-md')).reverse();

    const combinedElements = [];
    for (let i = 0; i < Math.max(questionElements.length, answerElements.length); i++) {
        if (i < questionElements.length) combinedElements.push(questionElements[i]);
        if (i < answerElements.length) combinedElements.push(answerElements[i]);
    }

    for (const element of combinedElements) {
        if (messages.length >= count) break;

        if (element.classList.contains('my-md')) {
            const content = element.textContent.trim();
            messages.push({ role: "user", content });
        } else if (element.classList.contains('mb-md')) {
            const content = element.textContent.trim();
            messages.push({ role: "assistant", content });
        }
    }

    return messages;
}

function getInputValue() {
    const inputElement = document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea');
    return inputElement ? (inputElement.textContent || inputElement.value) : null;
}

function initializeMem0Integration() {
    document.addEventListener('DOMContentLoaded', () => {
        addMem0Button();
    });

    document.addEventListener('keydown', (event) => {
        console.log("clicked");
        if (event.ctrlKey && event.key === 'm') {
            console.log("desired");
            event.preventDefault();
            const defaultTooltip = document.querySelector('#mem0-button-container > div:nth-child(2)');
            const messageTooltip = document.querySelector('#mem0-button-container > div:nth-child(3)');
            handleMem0Click(defaultTooltip, messageTooltip);
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