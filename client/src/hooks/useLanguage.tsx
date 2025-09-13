import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  getRandomAIResponse: () => string;
}

interface LanguageProviderProps {
  children: ReactNode;
}

// Translation data
const translations = {
  en: {
    // Navigation
    'dashboard': 'Dashboard',
    'chat': 'Chat',
    'profile': 'Profile',
    'login': 'Login',
    'register': 'Sign Up',
    'logout': 'Logout',
    
    // Common
    'language': 'Language',
    'aiService': 'AI Service',
    'toggleTheme': 'Toggle theme',
    'settings': 'Settings',
    'send': 'Send',
    'generateImage': 'Generate Image',
    'typeMessage': 'Type your message...',
    'imagePrompt': 'Describe the image you want to generate...',
    
    // Welcome messages
    'welcomeTitle': 'Welcome to ⵢɧαɳ Aⵊ! 👋',
    'welcomeMessage': 'Your intelligent AI assistant with emotional understanding',
    
    // Branding
    'appName': 'ⵢɧαɳ Aⵊ',
    'tagline': 'Created by ◉Ɗєиνιℓ',
    'description': 'AI-powered application platform providing intelligent conversation and AI services.',
    
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
    // Navigation
    'dashboard': 'डैशबोर्ड',
    'chat': 'चैट',
    'profile': 'प्रोफाइल',
    'login': 'लॉगिन',
    'register': 'साइन अप',
    'logout': 'लॉगआउट',
    
    // Common
    'language': 'भाषा',
    'aiService': 'एआई सेवा',
    'toggleTheme': 'थीम बदलें',
    'settings': 'सेटिंग्स',
    'send': 'भेजें',
    'generateImage': 'इमेज बनाएं',
    'typeMessage': 'अपना संदेश टाइप करें...',
    'imagePrompt': 'जो इमेज आप बनाना चाहते हैं उसका वर्णन करें...',
    
    // Welcome messages
    'welcomeTitle': 'ⵢɧαɳ Aⵊ में आपका स्वागत है! 👋',
    'welcomeMessage': 'आपका बुद्धिमान एआई सहायक भावनात्मक समझ के साथ',
    
    // Branding
    'appName': 'ⵢɧαɳ Aⵊ',
    'tagline': '◉Ɗєиνιℓ द्वारा निर्मित',
    'description': 'एआई-संचालित एप्लिकेशन प्लेटफॉर्म जो बुद्धिमान बातचीत और एआई सेवाएं प्रदान करता है।',
    
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

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('shanxai_language');
    if (savedLanguage && translations[savedLanguage as keyof typeof translations]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: string) => {
    if (translations[lang as keyof typeof translations]) {
      setCurrentLanguage(lang);
      localStorage.setItem('shanxai_language', lang);
    }
  };

  const t = (key: string): string => {
    const currentTranslations = translations[currentLanguage as keyof typeof translations];
    const fallbackTranslations = translations['en'];
    
    // Special handling for arrays (like aiResponses)
    if (key === 'aiResponses') {
      return ''; // This should be handled by getRandomAIResponse instead
    }
    
    const translation = currentTranslations?.[key as keyof typeof translations['en']];
    const fallback = fallbackTranslations[key as keyof typeof translations['en']];
    
    // Ensure we always return a string
    if (typeof translation === 'string') {
      return translation;
    } else if (typeof fallback === 'string') {
      return fallback;
    } else {
      return key;
    }
  };

  const getRandomAIResponse = (): string => {
    const responses = translations[currentLanguage as keyof typeof translations]?.['aiResponses'] || 
                     translations['en']['aiResponses'];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    getRandomAIResponse,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};