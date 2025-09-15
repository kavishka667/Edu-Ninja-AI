class GeminiChatbot {
    constructor() {
        // Replace with your actual Gemini API key
        this.API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
        this.API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.API_KEY}`;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeEmojis();
        this.currentImage = null;
        
        // Set initial timestamp
        this.updateMessageTime();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.imageBtn = document.getElementById('imageBtn');
        this.imageInput = document.getElementById('imageInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImg = document.getElementById('previewImg');
        this.removeImageBtn = document.getElementById('removeImage');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.emojiPicker = document.getElementById('emojiPicker');
        this.emojiGrid = document.getElementById('emojiGrid');
    }

    initializeEventListeners() {
        // Send message
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
            this.updateSendButton();
        });

        // Image upload
        this.imageBtn.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.removeImageBtn.addEventListener('click', () => this.removeImage());

        // Emoji picker
        this.emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleEmojiPicker();
        });

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.emojiPicker.contains(e.target) && !this.emojiBtn.contains(e.target)) {
                this.emojiPicker.style.display = 'none';
            }
        });

        // Emoji categories
        document.querySelectorAll('.emoji-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.emoji-category').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadEmojiCategory(btn.dataset.category);
            });
        });
    }

    initializeEmojis() {
        this.emojiCategories = {
            smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'],
            people: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅'],
            nature: ['🌟', '⭐', '🌙', '☀️', '⛅', '🌤️', '⛈️', '🌧️', '❄️', '☃️', '⛄', '🌈', '🔥', '💧', '🌊', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎋', '🍃', '🍂', '🍁', '🌾', '🌺', '🌻', '🌹', '🥀'],
            food: ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥗', '🍿', '🧈', '🥞', '🧇', '🥓', '🍗', '🍖', '🌭', '🥩', '🍤', '🍣', '🍱', '🍛', '🍙', '🍘', '🍥', '🥠', '🥮'],
            activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿'],
            travel: ['✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝'],
            objects: ['💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣'],
            symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈']
        };
        
        this.loadEmojiCategory('smileys');
    }

    loadEmojiCategory(category) {
        const emojis = this.emojiCategories[category] || this.emojiCategories.smileys;
        this.emojiGrid.innerHTML = '';
        
        emojis.forEach(emoji => {
            const button = document.createElement('button');
            button.className = 'emoji-item';
            button.textContent = emoji;
            button.addEventListener('click', () => this.insertEmoji(emoji));
            this.emojiGrid.appendChild(button);
        });
    }

    insertEmoji(emoji) {
        const cursorPos = this.messageInput.selectionStart;
        const textBefore = this.messageInput.value.substring(0, cursorPos);
        const textAfter = this.messageInput.value.substring(cursorPos);
        
        this.messageInput.value = textBefore + emoji + textAfter;
        this.messageInput.focus();
        this.messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        
        this.updateSendButton();
        this.emojiPicker.style.display = 'none';
    }

    toggleEmojiPicker() {
        const isVisible = this.emojiPicker.style.display === 'flex';
        this.emojiPicker.style.display = isVisible ? 'none' : 'flex';
    }

    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        const hasImage = this.currentImage !== null;
        this.sendBtn.disabled = !hasText && !hasImage;
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentImage = {
                    data: e.target.result,
                    file: file
                };
                this.previewImg.src = e.target.result;
                this.imagePreview.style.display = 'block';
                this.updateSendButton();
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage() {
        this.currentImage = null;
        this.imagePreview.style.display = 'none';
        this.imageInput.value = '';
        this.updateSendButton();
    }

    async sendMessage() {
        const text = this.messageInput.value.trim();
        const image = this.currentImage;

        if (!text && !image) return;

        // Add user message
        this.addMessage(text, image, 'user');
        
        // Clear input
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.removeImage();
        this.updateSendButton();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(text, image);
            this.hideTypingIndicator();
            this.addMessage(response, null, 'bot');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', null, 'bot');
            console.error('Error:', error);
        }
    }

    async callGeminiAPI(text, image) {
        const parts = [];

        if (text) {
            parts.push({ text: text });
        }

        if (image) {
            // Convert image to base64 without data URL prefix
            const base64Data = image.data.split(',')[1];
            parts.push({
                inline_data: {
                    mime_type: image.file.type,
                    data: base64Data
                }
            });
        }

        const requestBody = {
            contents: [{
                parts: parts
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        const response = await fetch(this.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response format');
        }
    }

    addMessage(text, image, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (image) {
            const img = document.createElement('img');
            img.src = image.data;
            img.className = 'message-image';
            img.alt = 'Uploaded image';
            contentDiv.appendChild(img);
        }

        if (text) {
            const textP = document.createElement('p');
            textP.textContent = text;
            contentDiv.appendChild(textP);
        }

        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = this.getCurrentTime();
        contentDiv.appendChild(timeSpan);

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    updateMessageTime() {
        const firstMessage = document.querySelector('.message-time');
        if (firstMessage) {
            firstMessage.textContent =
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        document.getElementById('messageInput').addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        });

        // Image upload
        document.getElementById('imageBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        document.getElementById('removeImage').addEventListener('click', () => {
            this.removeImage();
        });

        // Emoji picker
        document.getElementById('emojiBtn').addEventListener('click', () => {
            this.toggleEmojiPicker();
        });

        // API Key modal
        document.getElementById('saveApiKey').addEventListener('click', () => {
            this.saveApiKey();
        });

        document.getElementById('apiKeyInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveApiKey();
            }
        });

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            const emojiPicker = document.getElementById('emojiPicker');
            const emojiBtn = document.getElementById('emojiBtn');
            
            if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
                emojiPicker.style.display = 'none';
            }
        });
    }

    saveApiKey() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        if (apiKey) {
            this.apiKey = apiKey;
            localStorage.setItem('gemini_api_key', apiKey);
            document.getElementById('apiKeyModal').style.display = 'none';
        } else {
            alert('Please enter a valid API key');
        }
    }

    loadEmojiPicker() {
        const categories = document.querySelectorAll('.emoji-category');
        const emojiGrid = document.getElementById('emojiGrid');

        categories.forEach(category => {
            category.addEventListener('click', () => {
                categories.forEach(c => c.classList.remove('active'));
                category.classList.add('active');
                this.loadEmojis(category.dataset.category);
            });
        });

        this.loadEmojis('smileys');
    }

    loadEmojis(category) {
        const emojiGrid = document.getElementById('emojiGrid');
        emojiGrid.innerHTML = '';

        this.emojis[category].forEach(emoji => {
            const button = document.createElement('button');
            button.className = 'emoji-item';
            button.textContent = emoji;
            button.addEventListener('click', () => {
                this.insertEmoji(emoji);
            });
            emojiGrid.appendChild(button);
        });
    }

    insertEmoji(emoji) {
        const messageInput = document.getElementById('messageInput');
        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        const text = messageInput.value;
        
        messageInput.value = text.substring(0, start) + emoji + text.substring(end);
        messageInput.focus();
        messageInput.setSelectionRange(start + emoji.length, start + emoji.length);
        
        document.getElementById('emojiPicker').style.display = 'none';
    }

    toggleEmojiPicker() {
        const emojiPicker = document.getElementById('emojiPicker');
        emojiPicker.style.display = emojiPicker.style.display === 'block' ? 'none' : 'block';
    }

    handleImageUpload(file) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = {
                data: e.target.result,
                file: file
            };
            
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    removeImage() {
        this.currentImage = null;
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('fileInput').value = '';
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message && !this.currentImage) return;
        if (!this.apiKey) {
            alert('Please set your API key first');
            return;
        }

        // Add user message
        this.addMessage(message, 'user', this.currentImage?.data);
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(message, this.currentImage);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            console.error('Error:', error);
        }

        // Clear image after sending
        if (this.currentImage) {
            this.removeImage();
        }
    }

    async callGeminiAPI(message, image) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
        
        let requestBody;

        if (image) {
            // Convert image to base64 without data URL prefix
            const base64Data = image.data.split(',')[1];
            const mimeType = image.file.type;

            requestBody = {
                contents: [{
                    parts: [
                        { text: message || "What's in this image?" },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }]
            };
        } else {
            requestBody = {
                contents: [{
                    parts: [{ text: message }]
                }]
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
                return data.candidates[0].content.parts[0].text;
    }

    addMessage(content, sender, imageData = null) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // Add image if present
        if (imageData) {
            const img = document.createElement('img');
            img.src = imageData;
            img.className = 'message-image';
            img.alt = 'Uploaded image';
            contentDiv.appendChild(img);
        }

        // Add text content
        if (content) {
            const textP = document.createElement('p');
            textP.textContent = content;
            contentDiv.appendChild(textP);
        }

        // Add timestamp
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = this.getCurrentTime();
        contentDiv.appendChild(timeSpan);

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        this.scrollToBottom();
    }

    showTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'none';
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    updateMessageTime() {
        const timeSpan = document.querySelector('.bot-message .message-time');
        if (timeSpan) {
            timeSpan.textContent = this.getCurrentTime();
        }
    }
}

// Enhanced features
class ChatbotEnhancements {
    constructor(chatbot) {
        this.chatbot = chatbot;
        this.initEnhancements();
    }

    initEnhancements() {
        this.addKeyboardShortcuts();
        this.addDragAndDrop();
        this.addMessageActions();
        this.addThemeToggle();
        this.addChatHistory();
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to send message
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.chatbot.sendMessage();
            }
            
            // Escape to close emoji picker
            if (e.key === 'Escape') {
                document.getElementById('emojiPicker').style.display = 'none';
            }
        });
    }

    addDragAndDrop() {
        const chatContainer = document.querySelector('.chat-container');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            chatContainer.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            chatContainer.addEventListener(eventName, this.highlight.bind(this), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            chatContainer.addEventListener(eventName, this.unhighlight.bind(this), false);
        });

        chatContainer.addEventListener('drop', this.handleDrop.bind(this), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(e) {
        e.currentTarget.classList.add('drag-over');
    }

    unhighlight(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                this.chatbot.handleImageUpload(file);
            }
        }
    }

    addMessageActions() {
        // Add copy functionality to messages
        document.addEventListener('click', (e) => {
            if (e.target.closest('.message-content')) {
                const messageContent = e.target.closest('.message-content');
                if (e.detail === 2) { // Double click
                    this.copyMessageText(messageContent);
                }
            }
        });
    }

    copyMessageText(messageElement) {
        const textElement = messageElement.querySelector('p');
        if (textElement) {
            navigator.clipboard.writeText(textElement.textContent).then(() => {
                this.showToast('Message copied to clipboard');
            });
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }

    addThemeToggle() {
        // Add theme toggle button to header
        const headerContent = document.querySelector('.header-content');
        const themeBtn = document.createElement('button');
        themeBtn.className = 'theme-toggle';
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        themeBtn.addEventListener('click', this.toggleTheme.bind(this));
        headerContent.appendChild(themeBtn);
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        const themeBtn = document.querySelector('.theme-toggle i');
        themeBtn.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }

    addChatHistory() {
        // Save chat history to localStorage
        const originalAddMessage = this.chatbot.addMessage.bind(this.chatbot);
        this.chatbot.addMessage = (content, sender, imageData) => {
            originalAddMessage(content, sender, imageData);
            this.saveChatHistory(content, sender, imageData);
        };

        // Load chat history on page load
        this.loadChatHistory();
    }

    saveChatHistory(content, sender, imageData) {
        let history = JSON.parse(localStorage.getItem('chat_history') || '[]');
        history.push({
            content,
            sender,
            imageData: imageData ? 'image' : null, // Don't save actual image data
            timestamp: new Date().toISOString()
        });

        // Keep only last 50 messages
        if (history.length > 50) {
            history = history.slice(-50);
        }

        localStorage.setItem('chat_history', JSON.stringify(history));
    }

    loadChatHistory() {
        const history = JSON.parse(localStorage.getItem('chat_history') || '[]');
        const chatMessages = document.getElementById('chatMessages');
        
        // Clear existing messages except welcome message
        const welcomeMessage = chatMessages.querySelector('.message');
        chatMessages.innerHTML = '';
        if (welcomeMessage) {
            chatMessages.appendChild(welcomeMessage);
        }

        // Load last 10 messages
        const recentHistory = history.slice(-10);
        recentHistory.forEach(msg => {
            if (msg.sender !== 'bot' || msg.content !== "Hello! I'm your AI assistant powered by Gemini. How can I help you today?") {
                this.chatbot.addMessage(msg.content, msg.sender);
            }
        });
    }
}

// Voice recognition feature
class VoiceRecognition {
    constructor(chatbot) {
        this.chatbot = chatbot;
        this.recognition = null;
        this.isListening = false;
        this.initVoiceRecognition();
    }

    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('messageInput').value = transcript;
                this.stopListening();
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopListening();
            };

            this.recognition.onend = () => {
                this.stopListening();
            };

            this.addVoiceButton();
        }
    }

    addVoiceButton() {
        const inputContainer = document.querySelector('.input-container');
        const voiceBtn = document.createElement('button');
        voiceBtn.className = 'input-btn voice-btn';
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceBtn.addEventListener('click', this.toggleListening.bind(this));
        
        // Insert before emoji button
        const emojiBtn = document.getElementById('emojiBtn');
        inputContainer.insertBefore(voiceBtn, emojiBtn);
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    startListening() {
        if (this.recognition) {
            this.recognition.start();
            this.isListening = true;
            const voiceBtn = document.querySelector('.voice-btn');
            voiceBtn.classList.add('listening');
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        }
    }

    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
            this.isListening = false;
            const voiceBtn = document.querySelector('.voice-btn');
            voiceBtn.classList.remove('listening');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }
}

// Initialize the chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = new GeminiChatbot();
    const enhancements = new ChatbotEnhancements(chatbot);
    const voiceRecognition = new VoiceRecognition(chatbot);
});

    updateMessageTime() {
        const firstMessage = document.querySelector('.message-time');
        if (firstMessage) {
            firstMessage.textContent = this.getCurrentTime();
        }
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GeminiChatbot();
});

// Add some utility functions for better mobile experience
window.addEventListener('resize', () => {
    // Close emoji picker on orientation change
    const emojiPicker = document.getElementById('emojiPicker');
    if (emojiPicker) {
        emojiPicker.style.display = 'none';
    }
});

// Prevent zoom on input focus for iOS
document.addEventListener('touchstart', () => {
    const messageInput = document.getElementById('messageInput');
    if (messageInput && window.innerWidth < 768) {
        messageInput.style.fontSize = '16px';
    }
});

// Handle viewport height changes on mobile (for virtual keyboard)
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);
setViewportHeight();

