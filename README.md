# Claude Memory

Claude Memory is a Chrome extension that enhances your interaction with Claude by providing memory functionality. It allows you to store and retrieve important information from your conversations with Claude such as your preferences, making your interactions more personalized and context-aware. Install it from [Chrome Web Store](https://chromewebstore.google.com/detail/claude-memory/onihkkbipkfeijkadecaafbgagkhglop?hl=en-GB&utm_source=ext_sidebar).

Built using [Mem0](https://www.mem0.ai) ❤️


## Demo

Check out this video of Claude Memory in action (full-resolution video available [here](https://youtu.be/4iP_ADT9N3E)):

https://github.com/user-attachments/assets/895f5ca2-ee76-4dee-a0e2-503adc8a6a26

## Features

- Store memories from your Claude conversations
- Retrieve relevant memories during chats
- Easily manage and organize your stored information
- Seamless integration with the Claude AI interface

## Installation

1. Download the extension files or clone this repository.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.
5. The Claude Memory extension should now appear in your Chrome toolbar.


## Usage

1. Click on the Claude Memory icon in your Chrome toolbar to open the popup.
2. Enter your Mem0 API key and user ID in the settings.
3. During conversations with Claude, click the "Mem0" button to retrieve relevant memories and use them in your conversations. This also tries to deduce new memories from your conversation.
4. Your memories will be displayed, allowing you to reference them in your conversations.

## Configuration

- API Key: Required for connecting to the Mem0 API. Obtain this from your Mem0 Dashboard.
- User ID: Your unique identifier in the Mem0 system. If not provided, it defaults to 'claude-user'.

## Troubleshooting

If you encounter any issues:

- Ensure your API key is correct and has the necessary permissions.
- Check that you're using a valid user ID.
- Verify your internet connection.
- For persistent problems, check the browser console for error messages.

## Privacy and Data Security

Claude Memory stores your API key and user ID locally in your browser. Your messages are sent to the Mem0 API for extracting and retrieving memories.

## Contributing

Contributions to improve Claude Memory are welcome. Please feel free to submit pull requests or open issues for bugs and feature requests.

## License
MIT License
