export class VoiceInputService {
    constructor(config) {
        this.config = config;
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.onResult = null;
        this.onError = null;
        this.onStatusChange = null;
        
        this.initializeSpeechRecognition();
    }

    initializeSpeechRecognition() {
        // Check if speech recognition is supported
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.isSupported = true;
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
            this.isSupported = true;
        } else {
            console.warn('Speech recognition not supported in this browser');
            this.isSupported = false;
            return;
        }

        // Configure speech recognition
        this.recognition.continuous = this.config.voice.continuous || false;
        this.recognition.interimResults = this.config.voice.interimResults || true;
        this.recognition.lang = this.config.voice.language || 'en-US';
        this.recognition.maxAlternatives = 1;

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.recognition) return;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.notifyStatusChange('listening');
            console.log('Voice recognition started');
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.notifyStatusChange('stopped');
            console.log('Voice recognition stopped');
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (this.onResult) {
                this.onResult({
                    finalTranscript,
                    interimTranscript,
                    isFinal: finalTranscript !== '',
                    confidence: event.results[event.results.length - 1] ? 
                        event.results[event.results.length - 1][0].confidence : 0
                });
            }
        };

        this.recognition.onerror = (event) => {
            this.isListening = false;
            this.notifyStatusChange('error');
            
            const errorMessage = this.getErrorMessage(event.error);
            console.error('Speech recognition error:', errorMessage);
            
            if (this.onError) {
                this.onError(errorMessage);
            }
        };

        this.recognition.onnomatch = () => {
            console.warn('No speech was recognized');
            if (this.onError) {
                this.onError('No speech was recognized');
            }
        };
    }

    getErrorMessage(error) {
        switch (error) {
            case 'no-speech':
                return 'No speech was detected. Please try speaking again.';
            case 'audio-capture':
                return 'Microphone is not available. Please check your microphone settings.';
            case 'not-allowed':
                return 'Microphone access was denied. Please allow microphone access in your browser settings.';
            case 'network':
                return 'Network error occurred. Please check your internet connection.';
            case 'aborted':
                return 'Speech recognition was aborted.';
            case 'bad-grammar':
                return 'Speech recognition grammar error.';
            case 'language-not-supported':
                return 'The selected language is not supported.';
            default:
                return `Speech recognition error: ${error}`;
        }
    }

    // Start listening for voice input
    startListening() {
        if (!this.isSupported) {
            throw new Error('Speech recognition is not supported in this browser');
        }

        if (!this.config.voice.enabled) {
            throw new Error('Voice input is disabled in configuration');
        }

        if (this.isListening) {
            console.warn('Voice recognition is already active');
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            if (this.onError) {
                this.onError('Failed to start voice recognition');
            }
        }
    }

    // Stop listening for voice input
    stopListening() {
        if (!this.isSupported || !this.isListening) {
            return;
        }

        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Failed to stop voice recognition:', error);
        }
    }

    // Toggle listening state
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    // Set language for speech recognition
    setLanguage(language) {
        if (this.recognition) {
            this.recognition.lang = language;
            this.config.voice.language = language;
        }
    }

    // Set result callback
    setOnResult(callback) {
        this.onResult = callback;
    }

    // Set error callback
    setOnError(callback) {
        this.onError = callback;
    }

    // Set status change callback
    setOnStatusChange(callback) {
        this.onStatusChange = callback;
    }

    // Check if microphone permission is granted
    async checkMicrophonePermission() {
        if (!navigator.permissions) {
            return 'unknown';
        }

        try {
            const permission = await navigator.permissions.query({ name: 'microphone' });
            return permission.state; // 'granted', 'denied', or 'prompt'
        } catch (error) {
            console.warn('Failed to check microphone permission:', error);
            return 'unknown';
        }
    }

    // Request microphone permission
    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            return false;
        }
    }

    // Get supported languages (if available)
    getSupportedLanguages() {
        // This is a basic list - actual support varies by browser and platform
        return [
            { code: 'en-US', name: 'English (US)' },
            { code: 'en-GB', name: 'English (UK)' },
            { code: 'es-ES', name: 'Spanish (Spain)' },
            { code: 'es-MX', name: 'Spanish (Mexico)' },
            { code: 'fr-FR', name: 'French' },
            { code: 'de-DE', name: 'German' },
            { code: 'it-IT', name: 'Italian' },
            { code: 'pt-BR', name: 'Portuguese (Brazil)' },
            { code: 'zh-CN', name: 'Chinese (Simplified)' },
            { code: 'ja-JP', name: 'Japanese' },
            { code: 'ko-KR', name: 'Korean' },
            { code: 'ru-RU', name: 'Russian' },
            { code: 'ar-SA', name: 'Arabic' },
            { code: 'hi-IN', name: 'Hindi' }
        ];
    }

    // Get current status
    getStatus() {
        return {
            isSupported: this.isSupported,
            isListening: this.isListening,
            isEnabled: this.config.voice.enabled,
            language: this.config.voice.language
        };
    }

    // Enable/disable voice input
    setEnabled(enabled) {
        this.config.voice.enabled = enabled;
        if (!enabled && this.isListening) {
            this.stopListening();
        }
    }

    // Private method to notify status change
    notifyStatusChange(status) {
        if (this.onStatusChange) {
            this.onStatusChange({
                status,
                isListening: this.isListening,
                timestamp: new Date().toISOString()
            });
        }
    }
}