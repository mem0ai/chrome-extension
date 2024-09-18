let isProcessingMem0 = false;

function addMem0Button() {
    const sendButton = document.querySelector('button[aria-label="Send Message"]');
    if (sendButton && !document.querySelector('#mem0-button')) {
        const mem0Button = document.createElement('button');
        mem0Button.id = 'mem0-button';
        mem0Button.textContent = 'Mem0';
        mem0Button.className = sendButton.className;
        mem0Button.style.marginRight = '5px';
        mem0Button.style.color = 'white';
        mem0Button.style.minWidth = '60px';
        mem0Button.style.padding = '0 10px';
        mem0Button.addEventListener('click', handleMem0Click);

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.alignItems = 'center';

        sendButton.parentNode.insertBefore(buttonContainer, sendButton);
        buttonContainer.appendChild(mem0Button);
        buttonContainer.appendChild(sendButton);
    }
}

async function handleMem0Click() {
    const inputElement = document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea');
    const message = getInputValue();
    if (!message) {
        console.error('No input message found');
        return;
    }

    try {
        chrome.storage.sync.get(['apiKey', 'userId'], async function(data) {
            const apiKey = data.apiKey;
            const userId = data.userId || 'claude-user';

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
                    const memoryWrapper = document.createElement('div');
                    memoryWrapper.style.backgroundColor = '#dcfce7';
                    memoryWrapper.style.padding = '8px';
                    memoryWrapper.style.borderRadius = '4px';
                    memoryWrapper.style.marginTop = '8px';
                    memoryWrapper.style.marginBottom = '8px';

                    const titleElement = document.createElement('strong');
                    titleElement.textContent = 'Here is some more information about me:';
                    memoryWrapper.appendChild(titleElement);
                    memoryWrapper.appendChild(document.createElement('br'));

                    memories.forEach(mem => {
                        const memoryItem = document.createElement('div');
                        memoryItem.textContent = `- ${mem}`;
                        memoryWrapper.appendChild(memoryItem);
                    });

                    const memoryTextWithStyle = memoryWrapper.outerHTML;

                    if (inputElement.tagName.toLowerCase() === 'div') {
                        inputElement.innerHTML += '<br><br>' + memoryTextWithStyle;
                    } else {
                        inputElement.value += '\n\n' + memoryTextWithStyle;
                    }

                    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                }
            } else {
                console.log('Mem0 response:', responseData || 'No response received');
                alert('Mem0 response received, but no input field found to update.');
            }
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to send message to Mem0: ' + error.message);
    }
}

function getInputValue() {
    const inputElement = document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea');
    return inputElement ? inputElement.textContent || inputElement.value : null;
}

function initializeMem0Integration() {
    addMem0Button();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                addMem0Button();
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

initializeMem0Integration();
