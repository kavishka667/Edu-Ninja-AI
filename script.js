class GeminiChatbot {
    constructor() {
        // Replace with your actual Gemini API key
        this.API_KEY = 'AIzaSyDpOL0HC7pKrD3nStDuR4UetMsTj27WTOo';
        this.API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.API_KEY}`;
        
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.fileInput = document.getElementById('fileInput');
        this.fileUploadBtn = document.getElementById('fileUploadBtn');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImg = document.getElementById('previewImg');
        this.removeImageBtn = document.getElementById('removeImage');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.emojiPicker = document.getElementById('emojiPicker');
        this.themeToggle = document.getElementById('themeToggle');
        this.loading = document.getElementById('loading');
        
        this.selectedImage = null;
        this.chatHistory = [];
        
        this.initializeEventListeners();
        this.initializeTheme();
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
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });

        // File upload
        this.fileUploadBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        this.removeImageBtn.addEventListener('click', () => {
            this.removeSelectedImage();
        });

        // Emoji picker
        this.emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleEmojiPicker();
        });

        document.addEventListener('click', (e) => {
            if (!this.emojiPicker.contains(e.target) && !this.emojiBtn.contains(e.target)) {
                this.emojiPicker.style.display = 'none';
            }
        });

        // Emoji selection
        this.emojiPicker.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji')) {
                this.insertEmoji(e.target.textContent);
            }
        });

        // Theme toggle
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Drag and drop for images
        this.chatMessages.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.chatMessages.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleFileSelect(files[0]);
            }
        });
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('.material-symbols-outlined');
        icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message && !this.selectedImage) return;

        // Disable send button
        this.sendBtn.disabled = true;
        
        // Add user message to chat
        this.addMessage(message, 'user', this.selectedImage);
        
        // Clear input and image
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        const imageData = this.selectedImage;
        this.removeSelectedImage();
        
        // Show loading
        this.showLoading();
        
        try {
            const response = await this.callGeminiAPI(message, imageData);
            this.hideLoading();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.hideLoading();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            console.error('Error:', error);
        }
        
        // Re-enable send button
        this.sendBtn.disabled = false;
        this.messageInput.focus();
    }

    async callGeminiAPI(message, imageData) {
        const requestBody = {
            contents: [{
                parts: []
            }]
        };

        // Add text if provided
        if (message) {
            requestBody.contents[0].parts.push({
                text: message
            });
        }

        // Add image if provided
        if (imageData) {
            requestBody.contents[0].parts.push({
                inline_data: {
                    mime_type: imageData.mimeType,
                    data: imageData.data
                }
            });
        }

        const response = await fetch(this.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response format');
        }
    }

    addMessage(text, sender, imageData = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'bot' 
            ? '<span class="material-symbols-outlined">smart_toy</span>'
            : '<span class="material-symbols-outlined">person</span>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        if (imageData && sender === 'user') {
            const img = document.createElement('img');
            img.src = `data:${imageData.mimeType};base64,${imageData.data}`;
            img.alt = 'Uploaded image';
            content.appendChild(img);
        }
        
        if (text) {
            const textP = document.createElement('p');
            textP.textContent = text;
            content.appendChild(textP);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    handleFileSelect(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Image size should be less than 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result.split(',')[1];
            this.selectedImage = {
                data: base64Data,
                mimeType: file.type
            };
            
            this.previewImg.src = e.target.result;
            this.imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    removeSelectedImage() {
        this.selectedImage = null;
        this.imagePreview.style.display = 'none';
        this.previewImg.src = '';
        this.fileInput.value = '';
    }

    toggleEmojiPicker() {
        const isVisible = this.emojiPicker.style.display === 'block';
        this.emojiPicker.style.display = isVisible ? 'none' : 'block';
    }

    insertEmoji(emoji) {
        const cursorPos = this.messageInput.selectionStart;
        const textBefore = this.messageInput.value.substring(0, cursorPos);
        const textAfter = this.messageInput.value.substring(cursorPos);
        
        this.messageInput.value = textBefore + emoji + textAfter;
        this.messageInput.focus();
        this.messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        
        this.emojiPicker.style.display = 'none';
    }

    showLoading() {
        this.loading.style.display = 'flex';
        this.scrollToBottom();
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GeminiChatbot();
});

// Service Worker Registration for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
