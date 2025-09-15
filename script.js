class GeminiChatbot {
    constructor() {
        // Replace with your actual Gemini API key
        this.API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
        this.API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.API_KEY}`;
        
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.imageBtn = document.getElementById('imageBtn');
        this.imageInput = document.getElementById('imageInput');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.emojiPicker = document.getElementById('emojiPicker');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImage = document.getElementById('previewImage');
        this.removeImageBtn = document.getElementById('removeImage');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        this.selectedImage = null;
        this.selectedImageData = null;
        
        this.initializeEventListeners();
        this.adjustTextareaHeight();
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
            this.adjustTextareaHeight();
        });

        // Image upload
        this.imageBtn.addEventListener('click', () => {
            this.imageInput.click();
        });

        this.imageInput.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        this.removeImageBtn.addEventListener('click', () => {
            this.removeImage();
        });

        // Emoji picker
        this.emojiBtn.addEventListener('click', () => {
            this.toggleEmojiPicker();
        });

        // Emoji selection
        document.querySelectorAll('.emoji').forEach(emoji => {
            emoji.addEventListener('click', () => {
                this.insertEmoji(emoji.dataset.emoji);
            });
        });

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.emojiPicker.contains(e.target) && !this.emojiBtn.contains(e.target)) {
                this.emojiPicker.style.display = 'none';
            }
        });

        // Prevent form submission on Enter in mobile
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'TEXTAREA') {
                if (!e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            }
        });
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('Image size should be less than 10MB.');
            return;
        }

        try {
            // Convert to base64
            const base64 = await this.fileToBase64(file);
            this.selectedImageData = {
                data: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
                mimeType: file.type
            };

            // Show preview
            this.previewImage.src = base64;
            this.imagePreview.style.display = 'block';
            this.selectedImage = file;

        } catch (error) {
            console.error('Error processing image:', error);
            this.showError('Error processing image. Please try again.');
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    removeImage() {
        this.selectedImage = null;
        this.selectedImageData = null;
        this.imagePreview.style.display = 'none';
        this.imageInput.value = '';
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
        
        // Set cursor position after emoji
        const newPos = cursorPos + emoji.length;
        this.messageInput.setSelectionRange(newPos, newPos);
        
        this.emojiPicker.style.display = 'none';
        this.adjustTextareaHeight();
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message && !this.selectedImageData) {
            return;
        }

        // Disable send button
        this.sendBtn.disabled = true;

        // Add user message to chat
        this.addMessage(message, 'user', this.selectedImageData);

        // Clear input
        this.messageInput.value = '';
        this.adjustTextareaHeight();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Prepare request payload
            const payload = {
                contents: [{
                    parts: []
                }]
            };

            // Add text if present
            if (message) {
                payload.contents[0].parts.push({
                    text: message
                });
            }

            // Add image if present
            if (this.selectedImageData) {
                payload.contents[0].parts.push({
                    inline_data: {
                        mime_type: this.selectedImageData.mimeType,
                        data: this.selectedImageData.data
                    }
                });
            }

            // Make API request
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();

            // Extract and display response
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const botResponse = data.candidates[0].content.parts[0].text;
                this.addMessage(botResponse, 'bot');
            } else {
                throw new Error('Invalid response format');
            }

        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }

        // Clear selected image
        this.removeImage();
        
        // Re-enable send button
        this.sendBtn.disabled = false;
        this.messageInput.focus();
    }

    addMessage(text, sender, imageData = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // Add image if present
        if (imageData && sender === 'user') {
            const img = document.createElement('img');
            img.src = `data:${imageData.mimeType};base64,${imageData.data}`;
            img.className = 'message-image';
            img.alt = 'Uploaded image';
            
            // Add click to enlarge functionality
            img.addEventListener('click', () => {
                this.enlargeImage(img.src);
            });
            
            contentDiv.appendChild(img);
        }

        // Add text if present
        if (text) {
            const textP = document.createElement('p');
            textP.textContent = text;
            contentDiv.appendChild(textP);
        }

        // Add timestamp
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = this.getCurrentTime();
        contentDiv.appendChild(timeSpan);

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    enlargeImage(src) {
        // Create modal for image enlargement
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;

        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            border-radius: 8px;
        `;

        modal.appendChild(img);
        document.body.appendChild(modal);

        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    showError(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4757;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 3000);
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GeminiChatbot();
});

// Handle viewport height for mobile browsers
function setVH() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setVH();
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', setVH);
