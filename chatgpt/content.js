let isProcessingMem0 = false;

function addMem0Button() {
    const sendButton = document.querySelector('button[aria-label="Send prompt"]');

    function createPopup(container) {
        const popup = document.createElement('div');
        popup.className = 'mem0-popup';
        popup.style.cssText = `
            display: none;
            position: absolute;
            background-color: black;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 11px;
            white-space: nowrap;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        container.appendChild(popup);
        return popup;
    }

    if (sendButton && !document.querySelector('#mem0-button')) {
        const sendButtonContainer = sendButton.parentElement;
        sendButtonContainer.style.display = 'flex';
        sendButtonContainer.style.alignItems = 'center';

        const mem0ButtonContainer = document.createElement('div');
        mem0ButtonContainer.style.position = 'relative';
        mem0ButtonContainer.style.display = 'inline-block';
        mem0ButtonContainer.style.marginRight = '-5px';

        const mem0Button = document.createElement('img');
        mem0Button.id = 'mem0-button';
        mem0Button.src = chrome.runtime.getURL('icons/mem0-claude-icon.png');
        mem0Button.style.width = '30px';
        mem0Button.style.height = '30px';
        mem0Button.style.cursor = 'pointer';
        mem0Button.style.padding = '8px';
        mem0Button.style.borderRadius = '5px';
        mem0Button.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
        mem0Button.style.boxSizing = 'content-box';
        mem0Button.style.marginTop = '-3px';

        const popup = createPopup(mem0ButtonContainer);

        mem0Button.addEventListener('click', () => handleMem0Click(popup));

        mem0Button.addEventListener('mouseenter', () => {
            if (!mem0Button.disabled) {
                mem0Button.style.filter = 'brightness(70%)';
                tooltip.style.visibility = 'visible';
                tooltip.style.opacity = '1';
            }
        });
        mem0Button.addEventListener('mouseleave', () => {
            mem0Button.style.filter = 'none';
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        });

        const tooltip = document.createElement('div');
        tooltip.textContent = 'Add related memories';
        tooltip.style.visibility = 'hidden';
        tooltip.style.backgroundColor = 'black';
        tooltip.style.color = 'white';
        tooltip.style.textAlign = 'center';
        tooltip.style.borderRadius = '4px';
        tooltip.style.padding = '3px 6px';
        tooltip.style.position = 'absolute';
        tooltip.style.zIndex = '1';
        tooltip.style.top = 'calc(100% + 5px)';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.3s';
        tooltip.style.fontSize = '12px';

        mem0ButtonContainer.appendChild(mem0Button);
        mem0ButtonContainer.appendChild(tooltip);

        // Insert the mem0Button before the sendButton
        sendButtonContainer.insertBefore(mem0ButtonContainer, sendButton);

        // Function to update button states
        function updateButtonStates() {
            const inputElement = document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea');
            const hasText = inputElement && inputElement.textContent.trim().length > 0;

            sendButton.disabled = !hasText;
            mem0Button.disabled = !hasText;

            if (hasText) {
                mem0Button.style.opacity = '1';
                mem0Button.style.pointerEvents = 'auto';
            } else {
                mem0Button.style.opacity = '0.5';
                mem0Button.style.pointerEvents = 'none';
            }
        }

        // Initial update
        updateButtonStates();

        // Listen for input changes
        const inputElement = document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea');
        if (inputElement) {
            inputElement.addEventListener('input', updateButtonStates);
        }
    }
}

async function handleMem0Click(popup) {
    const inputElement = document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea');
    const message = getInputValue();
    if (!message) {
        console.error('No input message found');
        showPopup(popup, 'No input message found');
        return;
    }

    if (isProcessingMem0) {
        return;
    }

    isProcessingMem0 = true;

    try {
        chrome.storage.sync.get(['apiKey', 'userId'], async function(data) {
            const apiKey = data.apiKey;
            const userId = data.userId || 'claude-user';

            if (!apiKey) {
                showPopup(popup, 'No API Key found');
                isProcessingMem0 = false;
                return;
            }

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
                    messages: [{ content: message, role: 'user' }],
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
                    let memoriesContent = '<div id="mem0-wrapper" style="background-color: rgb(220, 252, 231); padding: 8px; border-radius: 4px; margin-top: 8px; margin-bottom: 8px;">';
                    memoriesContent += '<strong>Here is some more information about me:</strong>';
                    memories.forEach(mem => {
                        memoriesContent += `<div>- ${mem}</div>`;
                    });
                    memoriesContent += '</div>';

                    // Insert the memories into the input field
                    if (inputElement.tagName.toLowerCase() === 'div') {
                        // For contenteditable div
                        let range = document.createRange();
                        let sel = window.getSelection();
                        range.selectNodeContents(inputElement);
                        range.collapse(false); // Move cursor to the end
                        let tempDiv = document.createElement('div');
                        tempDiv.innerHTML = `<div><br></div>${memoriesContent}`;
                        let frag = document.createDocumentFragment(), node, lastNode;
                        while ((node = tempDiv.firstChild)) {
                            lastNode = frag.appendChild(node);
                        }
                        range.insertNode(frag);
                        // Move the cursor after the inserted content
                        if (lastNode) {
                            range.setStartAfter(lastNode);
                            range.collapse(true);
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }
                    } else {
                        // For textarea
                        inputElement.value += `\n${memoriesContent}`;
                    }
                    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    showPopup(popup, 'No memories found');
                }
            } else {
                showPopup(popup, 'No input field found to update');
            }
        });
    } catch (error) {
        console.error('Error:', error);
        showPopup(popup, 'Failed to send message to Mem0');
    } finally {
        isProcessingMem0 = false;
    }
}

function showPopup(popup, message) {
    popup.textContent = message;
    popup.style.display = 'block';
    setTimeout(() => {
        popup.style.display = 'none';
    }, 1000);
}

function getInputValue() {
    const inputElement = document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea');
    return inputElement ? (inputElement.textContent || inputElement.value) : null;
}

function initializeMem0Integration() {
    document.addEventListener('DOMContentLoaded', () => {
        addMem0Button();
    });

    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            addMem0Button();
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

initializeMem0Integration();