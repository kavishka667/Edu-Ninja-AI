class GeminiChatbot {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key');
        this.currentImage = null;
        this.emojis = {
            smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'],
            people: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅'],
            nature: ['🌟', '⭐', '🌙', '☀️', '⛅', '🌤️', '⛈️', '🌧️', '❄️', '☃️', '⛄', '🌈', '🔥', '💧', '🌊', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '🍀', '🎋', '🍃', '🌺', '🌻', '🌹', '🥀', '🌷', '🌼', '🌸', '💐'],
            food: ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥗', '🍿', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🥪', '🍕', '🍟', '🍔', '🌮', '🌯', '🥙', '🥘', '🍲'],
            activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿'],
            travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄'],
            objects: ['💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '⚔️'],
            symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈']
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadEmojiPicker();
        this.checkApiKey();
        this.updateMessageTime();
    }

    checkApiKey() {
        if (!this.apiKey) {
            document.getElementById('apiKeyModal').style.display = 'flex';
        }
    }

    bindEvents() {
        // Send message
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
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
        return data.candidates[0].content.parts
