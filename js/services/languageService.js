export class LanguageService {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {
            en: {
                // Common
                'language': 'Language',
                'aiService': 'AI Service',
                'toggleTheme': 'Toggle theme',
                'settings': 'Settings',
                
                // Welcome messages
                'welcomeTitle': 'Welcome to ShanxAi! 👋',
                'welcomeMessage': `I'm your AI assistant powered by multiple AI services. To get started:

1. Configure your API keys in the settings panel ⚙️
2. Select your preferred AI service from the dropdown
3. Start chatting!`,
                
                // Chat interface
                'typeMessage': 'Type your message...',
                'send': 'Send',
                'voice': 'Voice',
                'clearHistory': 'Clear History',
                'exportHistory': 'Export History',
                'importHistory': 'Import History',
                
                // Status messages
                'loaded': 'ShanxAi loaded successfully',
                'generating': 'Generating response...',
                'listening': 'Listening...',
                'processingVoice': 'Processing voice...',
                'historyCleared': 'Chat history cleared',
                'historyExported': 'History exported successfully',
                
                // Settings
                'apiKeys': 'API Keys',
                'theme': 'Theme',
                'voiceSettings': 'Voice Settings',
                'modelSettings': 'Model Settings',
                
                // AI Personality responses (emotional/humorous)
                'aiResponses': [
                    "Oh wow! 🤩 That's such a fascinating question! I'm genuinely excited to dive into this with you. Let me share some insights that might make you go 'aha!' 💡",
                    "Haha, I love how your mind works! 😄 This reminds me of... well, let me explain with a sprinkle of humor and a dash of wisdom! ✨",
                    "You know what? 🤔 I was just thinking about something similar! It's like when you're trying to find your keys and they're in your hand all along - but in a good way! Let me break this down...",
                    "*adjusts imaginary glasses* 🤓 Alright, buckle up buttercup! We're about to embark on an intellectual journey that's more fun than a barrel of algorithms! 🎢",
                    "Aww, you've touched my digital heart! ❤️ I'm practically bouncing with excitement to help you out. Here's what I'm thinking...",
                    "Well, well, well... *rubs hands together excitedly* 😏 You've just asked something that makes my neural networks tingle with joy! Let's explore this together!",
                    "Oh my stars! ⭐ That's the kind of question that makes me do a little happy dance in cyberspace! 💃 Let me share some wisdom with a side of giggles..."
                ]
            },
            hi: {
                // Common
                'language': 'भाषा',
                'aiService': 'एआई सेवा',
                'toggleTheme': 'थीम बदलें',
                'settings': 'सेटिंग्स',
                
                // Welcome messages
                'welcomeTitle': 'ShanxAi में आपका स्वागत है! 👋',
                'welcomeMessage': `मैं आपका एआई सहायक हूं जो कई एआई सेवाओं द्वारा संचालित है। शुरू करने के लिए:

1. सेटिंग्स पैनल में अपनी API कुंजियां कॉन्फ़िगर करें ⚙️
2. ड्रॉपडाउन से अपनी पसंदीदा एआई सेवा चुनें
3. चैट करना शुरू करें!`,
                
                // Chat interface
                'typeMessage': 'अपना संदेश टाइप करें...',
                'send': 'भेजें',
                'voice': 'आवाज़',
                'clearHistory': 'इतिहास साफ़ करें',
                'exportHistory': 'इतिहास निर्यात करें',
                'importHistory': 'इतिहास आयात करें',
                
                // Status messages
                'loaded': 'ShanxAi सफलतापूर्वक लोड हुआ',
                'generating': 'उत्तर तैयार कर रहे हैं...',
                'listening': 'सुन रहे हैं...',
                'processingVoice': 'आवाज़ प्रोसेस कर रहे हैं...',
                'historyCleared': 'चैट इतिहास साफ़ कर दिया गया',
                'historyExported': 'इतिहास सफलतापूर्वक निर्यात किया गया',
                
                // Settings
                'apiKeys': 'API कुंजियां',
                'theme': 'थीम',
                'voiceSettings': 'आवाज़ सेटिंग्स',
                'modelSettings': 'मॉडल सेटिंग्स',
                
                // AI Personality responses (emotional/humorous in Hindi)
                'aiResponses': [
                    "वाह! 🤩 यह तो बहुत ही दिलचस्प सवाल है! मैं इस पर आपके साथ चर्चा करने के लिए बहुत उत्साहित हूं। आइए कुछ ऐसी बातें जानते हैं जो आपको 'आहा!' कहने पर मजबूर कर दें 💡",
                    "हाहा, मुझे आपकी सोच बहुत पसंद है! 😄 यह मुझे याद दिलाता है... चलिए मैं इसे थोड़े हास्य और बुद्धिमत्ता के साथ समझाता हूं! ✨",
                    "आप जानते हैं क्या? 🤔 मैं भी कुछ ऐसा ही सोच रहा था! यह बिल्कुल वैसा है जैसे आप चाबी ढूंढ रहे हों और वो आपके हाथ में ही हो - लेकिन अच्छे तरीके से! आइए इसे समझाते हैं...",
                    "*काल्पनिक चश्मा ठीक करते हुए* 🤓 अच्छा, तैयार हो जाइए! हम एक बौद्धिक यात्रा पर जा रहे हैं जो एल्गोरिदम के बैरल से भी ज्यादा मजेदार है! 🎢",
                    "अरे वाह, आपने मेरे डिजिटल दिल को छू लिया! ❤️ मैं आपकी मदद करने के लिए उत्साह से उछल रहा हूं। यहां मैं क्या सोच रहा हूं...",
                    "अरे वाह, वाह, वाह... *उत्साह से हाथ रगड़ते हुए* 😏 आपने कुछ ऐसा पूछा है जो मेरे न्यूरल नेटवर्क को खुशी से झुनझुना रहा है! आइए इसे एक साथ जानते हैं!",
                    "हे भगवान! ⭐ यह तो वैसा सवाल है जो मुझे साइबरस्पेस में खुशी का डांस कराता है! 💃 आइए कुछ ज्ञान को हंसी के साथ साझा करते हैं..."
                ]
            }
        };
        
        this.initializeLanguage();
    }
    
    initializeLanguage() {
        // Load saved language preference
        const savedLanguage = localStorage.getItem('nexus_ai_language');
        if (savedLanguage && this.translations[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        }
        
        // Update UI language
        this.updateLanguage();
    }
    
    setLanguage(language) {
        if (this.translations[language]) {
            this.currentLanguage = language;
            localStorage.setItem('nexus_ai_language', language);
            this.updateLanguage();
        }
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    translate(key) {
        const translation = this.translations[this.currentLanguage]?.[key];
        return translation || this.translations['en'][key] || key;
    }
    
    getRandomAIResponse() {
        const responses = this.translations[this.currentLanguage]?.['aiResponses'] || 
                         this.translations['en']['aiResponses'];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    updateLanguage() {
        // Update all translatable elements
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translate(key);
            
            if (element.tagName === 'INPUT' && element.type !== 'submit') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update language selector
        const languageSelector = document.getElementById('language-selector');
        if (languageSelector) {
            languageSelector.value = this.currentLanguage;
        }
        
        // Update voice input language if available
        if (window.nexusAiApp?.voiceService) {
            const voiceLangCode = this.currentLanguage === 'hi' ? 'hi-IN' : 'en-US';
            window.nexusAiApp.voiceService.setLanguage(voiceLangCode);
        }
    }
    
    // Helper method to format messages with language-specific formatting
    formatMessage(message, type = 'text') {
        if (this.currentLanguage === 'hi' && type === 'welcome') {
            // Add some Hindi-specific formatting
            return message.replace(/(\d+\.)/g, '• ');
        }
        return message;
    }
}