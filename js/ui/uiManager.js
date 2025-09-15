export class UIManager {
    constructor() {
        this.elements = {};
        this.isTyping = false;
        this.currentTheme = 'dark';
        this.onSendMessage = null;
        this.onVoiceToggle = null;
        this.onImageGenerate = null;
        this.onServiceChange = null;
        this.onLanguageChange = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.applyTheme(this.currentTheme);
    }

    initializeElements() {
        // Get references to DOM elements
        this.elements = {
            chatContainer: document.getElementById('chat-container'),
            messagesContainer: document.getElementById('messages-container'),
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button'),
            voiceButton: document.getElementById('voice-button'),
            imageButton: document.getElementById('image-button'),
            serviceSelector: document.getElementById('service-selector'),
            themeToggle: document.getElementById('theme-toggle'),
            settingsToggle: document.getElementById('settings-toggle'),
            settingsPanel: document.getElementById('settings-panel'),
            settingsClose: document.getElementById('settings-close'),
            saveApiKeys: document.getElementById('save-api-keys'),
            clearApiKeys: document.getElementById('clear-api-keys'),
            languageSelector: document.getElementById('language-selector'),
            statusIndicator: document.getElementById('status-indicator'),
            typingIndicator: document.getElementById('typing-indicator'),
            voiceStatus: document.getElementById('voice-status'),
            apiKeyInputs: document.querySelectorAll('[data-api-key]') || [],
            fileInput: document.getElementById('file-input'),
            clearHistoryButton: document.getElementById('clear-history-button'),
            exportHistoryButton: document.getElementById('export-history-button'),
            importHistoryButton: document.getElementById('import-history-button')
        };
    }

    setupEventListeners() {
        // Send message on button click
        if (this.elements.sendButton) {
            this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        }

        // Send message on Enter key (but not Shift+Enter)
        if (this.elements.messageInput) {
            this.elements.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize textarea
            this.elements.messageInput.addEventListener('input', () => {
                this.autoResizeTextarea(this.elements.messageInput);
            });
        }

        // Voice button toggle
        if (this.elements.voiceButton) {
            this.elements.voiceButton.addEventListener('click', () => {
                if (this.onVoiceToggle) {
                    this.onVoiceToggle();
                }
            });
        }

        // Image generation button
        if (this.elements.imageButton) {
            this.elements.imageButton.addEventListener('click', () => {
                const prompt = this.elements.messageInput.value.trim();
                if (prompt && this.onImageGenerate) {
                    this.onImageGenerate(prompt);
                    this.elements.messageInput.value = '';
                    this.autoResizeTextarea(this.elements.messageInput);
                }
            });
        }

        // Service selector change
        if (this.elements.serviceSelector) {
            this.elements.serviceSelector.addEventListener('change', (e) => {
                if (this.onServiceChange) {
                    this.onServiceChange(e.target.value);
                }
            });
        }

        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Settings panel toggle
        if (this.elements.settingsToggle) {
            this.elements.settingsToggle.addEventListener('click', () => {
                this.showSettings();
            });
        }

        // Settings panel close
        if (this.elements.settingsClose) {
            this.elements.settingsClose.addEventListener('click', () => {
                this.hideSettings();
            });
        }

        // Close settings panel when clicking outside
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.addEventListener('click', (e) => {
                if (e.target === this.elements.settingsPanel) {
                    this.hideSettings();
                }
            });
        }

        // Save API keys
        if (this.elements.saveApiKeys) {
            this.elements.saveApiKeys.addEventListener('click', () => {
                this.saveApiKeys();
            });
        }

        // Clear API keys
        if (this.elements.clearApiKeys) {
            this.elements.clearApiKeys.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all API keys?')) {
                    this.clearApiKeys();
                }
            });
        }

        // API key input change handlers
        this.elements.apiKeyInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.saveApiKey(input.dataset.apiKey, input.value);
            });
        });

        // Clear history
        if (this.elements.clearHistoryButton) {
            this.elements.clearHistoryButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all chat history?')) {
                    this.clearMessages();
                    if (this.onClearHistory) {
                        this.onClearHistory();
                    }
                }
            });
        }

        // Export history
        if (this.elements.exportHistoryButton) {
            this.elements.exportHistoryButton.addEventListener('click', () => {
                if (this.onExportHistory) {
                    this.onExportHistory();
                }
            });
        }

        // Import history
        if (this.elements.importHistoryButton) {
            this.elements.importHistoryButton.addEventListener('click', () => {
                if (this.elements.fileInput) {
                    this.elements.fileInput.click();
                }
            });
        }

        // File input for history import
        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && this.onImportHistory) {
                    this.onImportHistory(file);
                }
                e.target.value = ''; // Reset file input
            });
        }

        // API key inputs
        if (this.elements.apiKeyInputs && this.elements.apiKeyInputs.length > 0) {
            this.elements.apiKeyInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    const service = e.target.dataset.apiKey;
                    const apiKey = e.target.value;
                    if (this.onApiKeyChange) {
                        this.onApiKeyChange(service, apiKey);
                    }
                });
            });
        }

        // Language selector
        if (this.elements.languageSelector) {
            this.elements.languageSelector.addEventListener('change', (e) => {
                const language = e.target.value;
                if (this.onLanguageChange) {
                    this.onLanguageChange(language);
                }
            });
        }
    }

    sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (message && this.onSendMessage) {
            this.onSendMessage(message);
            this.elements.messageInput.value = '';
            this.autoResizeTextarea(this.elements.messageInput);
        }
    }

    addMessage(content, type = 'user', options = {}) {
        if (!this.elements.messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}-message`;
        
        if (options.id) {
            messageElement.setAttribute('data-message-id', options.id);
        }

        const timestamp = options.timestamp || new Date().toLocaleTimeString();
        
        let messageHTML = `
            <div class="message-content">
                <div class="message-text">${options.isHtml ? content : this.formatMessage(content)}</div>
                <div class="message-meta">
                    <span class="message-time">${timestamp}</span>
        `;

        if (options.service) {
            messageHTML += `<span class="message-service">${options.service}</span>`;
        }

        messageHTML += `
                </div>
            </div>
        `;

        messageElement.innerHTML = messageHTML;

        // Add animation class for new messages
        if (options.animate !== false) {
            messageElement.classList.add('message-entering');
            setTimeout(() => {
                messageElement.classList.remove('message-entering');
            }, 300);
        }

        this.elements.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();

        return messageElement;
    }

    updateMessage(messageElement, content, options = {}) {
        if (!messageElement) return;

        const textElement = messageElement.querySelector('.message-text');
        if (textElement) {
            if (options.typewriter && !this.isTyping) {
                this.typewriterEffect(textElement, content);
            } else {
                textElement.innerHTML = this.formatMessage(content);
            }
        }
    }

    formatMessage(content) {
        // Basic message formatting
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    typewriterEffect(element, text, speed = 30) {
        if (this.isTyping) return;

        this.isTyping = true;
        element.innerHTML = '';
        let i = 0;

        const typeInterval = setInterval(() => {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                this.scrollToBottom();
            } else {
                clearInterval(typeInterval);
                this.isTyping = false;
                element.innerHTML = this.formatMessage(text);
            }
        }, speed);
    }

    showTypingIndicator() {
        if (this.elements.typingIndicator) {
            this.elements.typingIndicator.style.display = 'flex';
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        if (this.elements.typingIndicator) {
            this.elements.typingIndicator.style.display = 'none';
        }
    }

    scrollToBottom() {
        if (this.elements.messagesContainer) {
            this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
        }
    }

    clearMessages() {
        if (this.elements.messagesContainer) {
            this.elements.messagesContainer.innerHTML = '';
        }
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    updateServiceSelector(services, currentService) {
        if (!this.elements.serviceSelector) return;

        this.elements.serviceSelector.innerHTML = '';
        
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.name;
            option.selected = service.id === currentService;
            this.elements.serviceSelector.appendChild(option);
        });
    }

    updateVoiceStatus(status) {
        if (this.elements.voiceButton) {
            this.elements.voiceButton.classList.toggle('active', status.isListening);
            this.elements.voiceButton.classList.toggle('disabled', !status.isSupported);
        }

        if (this.elements.voiceStatus) {
            let statusText = '';
            if (!status.isSupported) {
                statusText = 'Voice not supported';
            } else if (status.isListening) {
                statusText = 'Listening...';
            } else {
                statusText = 'Voice ready';
            }
            this.elements.voiceStatus.textContent = statusText;
        }
    }

    updateStatus(message, type = 'info') {
        if (this.elements.statusIndicator) {
            this.elements.statusIndicator.textContent = message;
            this.elements.statusIndicator.className = `status ${type}`;
            
            // Auto-hide status after 3 seconds for non-error messages
            if (type !== 'error') {
                setTimeout(() => {
                    if (this.elements.statusIndicator.textContent === message) {
                        this.elements.statusIndicator.textContent = '';
                        this.elements.statusIndicator.className = 'status';
                    }
                }, 3000);
            }
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        
        if (this.elements.themeToggle) {
            this.elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }

        // Save theme preference
        localStorage.setItem('nexus_ai_theme', theme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('nexus_ai_theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            this.applyTheme(this.currentTheme);
        }
    }

    // Settings Panel Methods
    showSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.classList.add('show');
            this.loadApiKeysToInputs();
        }
    }

    hideSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.classList.remove('show');
        }
    }

    loadApiKeysToInputs() {
        this.elements.apiKeyInputs.forEach(input => {
            const service = input.dataset.apiKey;
            const savedKey = localStorage.getItem(`nexus_ai_api_key_${service}`);
            if (savedKey) {
                input.value = savedKey;
            }
        });
    }

    saveApiKey(service, apiKey) {
        if (apiKey.trim()) {
            localStorage.setItem(`nexus_ai_api_key_${service}`, apiKey.trim());
            // Trigger callback to update AI service
            if (this.onApiKeyChange) {
                this.onApiKeyChange(service, apiKey.trim());
            }
        } else {
            localStorage.removeItem(`nexus_ai_api_key_${service}`);
            if (this.onApiKeyChange) {
                this.onApiKeyChange(service, '');
            }
        }
    }

    saveApiKeys() {
        let savedCount = 0;
        this.elements.apiKeyInputs.forEach(input => {
            const service = input.dataset.apiKey;
            const apiKey = input.value.trim();
            if (apiKey) {
                this.saveApiKey(service, apiKey);
                savedCount++;
            }
        });
        
        this.updateStatus(`✅ Saved ${savedCount} API key(s)`, 'success');
        setTimeout(() => {
            this.hideSettings();
        }, 1000);
    }

    clearApiKeys() {
        this.elements.apiKeyInputs.forEach(input => {
            const service = input.dataset.apiKey;
            input.value = '';
            localStorage.removeItem(`nexus_ai_api_key_${service}`);
            if (this.onApiKeyChange) {
                this.onApiKeyChange(service, '');
            }
        });
        
        this.updateStatus('🗑️ All API keys cleared', 'info');
    }

    showError(message) {
        this.updateStatus(message, 'error');
        console.error('UI Error:', message);
    }

    showSuccess(message) {
        this.updateStatus(message, 'success');
    }

    // Set callback functions
    setOnSendMessage(callback) {
        this.onSendMessage = callback;
    }

    setOnVoiceToggle(callback) {
        this.onVoiceToggle = callback;
    }

    setOnImageGenerate(callback) {
        this.onImageGenerate = callback;
    }

    setOnServiceChange(callback) {
        this.onServiceChange = callback;
    }

    setOnApiKeyChange(callback) {
        this.onApiKeyChange = callback;
    }

    setOnClearHistory(callback) {
        this.onClearHistory = callback;
    }

    setOnExportHistory(callback) {
        this.onExportHistory = callback;
    }

    setOnImportHistory(callback) {
        this.onImportHistory = callback;
    }

    setOnLanguageChange(callback) {
        this.onLanguageChange = callback;
    }

    // Initialize the UI after page load
    init() {
        this.loadTheme();
        this.updateStatus('NEXUS AI loaded successfully', 'success');
    }
}