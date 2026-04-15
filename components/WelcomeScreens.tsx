import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Users, PiggyBank, Shield, Mic, BarChart3, Globe } from 'lucide-react';
import { useHaptics } from '../hooks/useNative';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../translations';

interface WelcomeScreensProps {
  onComplete: () => void;
}

interface SlideContent {
  title: Record<Language, string>;
  description: Record<Language, string>;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  illustration: React.ReactNode;
}

const slides: SlideContent[] = [
  {
    title: {
      en: "Welcome to SHG Connect",
      hi: "SHG Connect में आपका स्वागत है",
      ta: "SHG Connect க்கு வரவேற்கிறோம்",
      te: "SHG Connect కు స్వాగతం",
      kn: "SHG Connect ಗೆ ಸ್ವಾಗತ"
    },
    description: {
      en: "Empowering Self Help Groups with digital tools for savings, loans, and community growth.",
      hi: "बचत, ऋण और समुदाय विकास के लिए डिजिटल उपकरणों के साथ स्वयं सहायता समूहों को सशक्त बनाना।",
      ta: "சேமிப்பு, கடன் மற்றும் சமூக வளர்ச்சிக்கான டிஜிட்டல் கருவிகளுடன் சுய உதவி குழுக்களை மேம்படுத்துதல்.",
      te: "పొదుపు, రుణాలు మరియు సమాజ అభివృద్ధి కోసం డిజిటల్ సాధనాలతో స్వయం సహాయక బృందాలను శక్తివంతం చేయడం.",
      kn: "ಉಳಿತಾಯ, ಸಾಲ ಮತ್ತು ಸಮುದಾಯ ಬೆಳವಣಿಗೆಗಾಗಿ ಡಿಜಿಟಲ್ ಸಾಧನಗಳೊಂದಿಗೆ ಸ್ವಯಂ ಸಹಾಯ ಗುಂಪುಗಳನ್ನು ಸಬಲೀಕರಣಗೊಳಿಸುವುದು."
    },
    icon: Users,
    color: "text-blue-400",
    bgGradient: "from-blue-600/30 via-indigo-600/20 to-purple-600/30",
    illustration: (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8"/>
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#grad1)" opacity="0.15"/>
        <circle cx="100" cy="100" r="60" fill="url(#grad1)" opacity="0.2"/>
        <circle cx="100" cy="65" r="22" fill="#3B82F6"/>
        <path d="M65 125 Q100 95 135 125 L135 155 Q100 140 65 155 Z" fill="#3B82F6"/>
        <circle cx="45" cy="85" r="16" fill="#8B5CF6"/>
        <path d="M20 135 Q45 115 70 135 L70 155 Q45 145 20 155 Z" fill="#8B5CF6"/>
        <circle cx="155" cy="85" r="16" fill="#8B5CF6"/>
        <path d="M130 135 Q155 115 180 135 L180 155 Q155 145 130 155 Z" fill="#8B5CF6"/>
        <circle cx="100" cy="110" r="45" fill="none" stroke="#60A5FA" strokeWidth="2" strokeDasharray="8 4" opacity="0.5"/>
      </svg>
    )
  },
  {
    title: {
      en: "Track Savings & Loans",
      hi: "बचत और ऋण ट्रैक करें",
      ta: "சேமிப்பு & கடன்களை கண்காணிக்கவும்",
      te: "పొదుపు & రుణాలను ట్రాక్ చేయండి",
      kn: "ಉಳಿತಾಯ & ಸಾಲಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ"
    },
    description: {
      en: "Easily manage weekly savings, loan disbursements, and repayments with automatic calculations.",
      hi: "स्वचालित गणना के साथ साप्ताहिक बचत, ऋण वितरण और पुनर्भुगतान को आसानी से प्रबंधित करें।",
      ta: "தானியங்கி கணக்கீடுகளுடன் வாராந்திர சேமிப்பு, கடன் வழங்கல் மற்றும் திருப்பிச் செலுத்துதலை எளிதாக நிர்வகிக்கவும்.",
      te: "ఆటోమేటిక్ లెక్కింపులతో వారపు పొదుపు, రుణ పంపిణీ మరియు తిరిగి చెల్లింపులను సులభంగా నిర్వహించండి.",
      kn: "ಸ್ವಯಂಚಾಲಿತ ಲೆಕ್ಕಾಚಾರಗಳೊಂದಿಗೆ ವಾರದ ಉಳಿತಾಯ, ಸಾಲ ವಿತರಣೆ ಮತ್ತು ಮರುಪಾವತಿಗಳನ್ನು ಸುಲಭವಾಗಿ ನಿರ್ವಹಿಸಿ."
    },
    icon: PiggyBank,
    color: "text-green-400",
    bgGradient: "from-green-600/30 via-emerald-600/20 to-teal-600/30",
    illustration: (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <defs>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.8"/>
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#grad2)" opacity="0.15"/>
        <rect x="45" y="55" width="110" height="90" rx="12" fill="#10B981"/>
        <rect x="50" y="60" width="100" height="80" rx="10" fill="#34D399"/>
        <text x="100" y="115" textAnchor="middle" fill="#065F46" fontSize="50" fontWeight="bold">₹</text>
        <ellipse cx="155" cy="130" rx="20" ry="8" fill="#FCD34D"/>
        <ellipse cx="155" cy="122" rx="20" ry="8" fill="#FBBF24"/>
        <ellipse cx="155" cy="114" rx="20" ry="8" fill="#F59E0B"/>
        <path d="M60 140 L60 100 L80 100" fill="none" stroke="#065F46" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="60,95 55,105 65,105" fill="#065F46"/>
      </svg>
    )
  },
  {
    title: {
      en: "Voice Commands",
      hi: "वॉयस कमांड",
      ta: "குரல் கட்டளைகள்",
      te: "వాయిస్ కమాండ్స్",
      kn: "ಧ್ವನಿ ಆದೇಶಗಳು"
    },
    description: {
      en: "Use voice in your language to record transactions. Just say 'Savings 500 Lakshmi' and it's done!",
      hi: "लेनदेन रिकॉर्ड करने के लिए अपनी भाषा में आवाज का उपयोग करें। बस बोलें 'बचत 500 लक्ष्मी' और हो गया!",
      ta: "பரிவர்த்தனைகளை பதிவு செய்ய உங்கள் மொழியில் குரலைப் பயன்படுத்தவும். 'சேமிப்பு 500 லட்சுமி' என்று சொல்லுங்கள், முடிந்தது!",
      te: "లావాదేవీలను రికార్డ్ చేయడానికి మీ భాషలో వాయిస్ ఉపయోగించండి. 'పొదుపు 500 లక్ష్మి' అని చెప్పండి, అంతే!",
      kn: "ವಹಿವಾಟುಗಳನ್ನು ದಾಖಲಿಸಲು ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಧ್ವನಿ ಬಳಸಿ. 'ಉಳಿತಾಯ 500 ಲಕ್ಷ್ಮಿ' ಎಂದು ಹೇಳಿ, ಮುಗಿಯಿತು!"
    },
    icon: Mic,
    color: "text-purple-400",
    bgGradient: "from-purple-600/30 via-pink-600/20 to-rose-600/30",
    illustration: (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <defs>
          <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.8"/>
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#grad3)" opacity="0.15"/>
        <rect x="60" y="35" width="80" height="140" rx="16" fill="#1E293B"/>
        <rect x="65" y="50" width="70" height="110" rx="8" fill="#8B5CF6" opacity="0.3"/>
        <rect x="88" y="75" width="24" height="40" rx="12" fill="#A78BFA"/>
        <path d="M82 110 Q82 130 100 130 Q118 130 118 110" fill="none" stroke="#A78BFA" strokeWidth="3"/>
        <line x1="100" y1="130" x2="100" y2="140" stroke="#A78BFA" strokeWidth="3"/>
        <path d="M130 90 Q145 100 130 110" fill="none" stroke="#EC4899" strokeWidth="3" opacity="0.7"/>
        <path d="M140 80 Q160 100 140 120" fill="none" stroke="#EC4899" strokeWidth="3" opacity="0.4"/>
        <path d="M70 90 Q55 100 70 110" fill="none" stroke="#EC4899" strokeWidth="3" opacity="0.7"/>
        <path d="M60 80 Q40 100 60 120" fill="none" stroke="#EC4899" strokeWidth="3" opacity="0.4"/>
        <rect x="85" y="165" width="30" height="4" rx="2" fill="#64748B"/>
      </svg>
    )
  },
  {
    title: {
      en: "Reports & Analytics",
      hi: "रिपोर्ट और विश्लेषण",
      ta: "அறிக்கைகள் & பகுப்பாய்வு",
      te: "నివేదికలు & విశ్లేషణలు",
      kn: "ವರದಿಗಳು & ವಿಶ್ಲೇಷಣೆ"
    },
    description: {
      en: "Generate detailed reports, track group performance, and export data to PDF or Excel.",
      hi: "विस्तृत रिपोर्ट बनाएं, समूह प्रदर्शन ट्रैक करें, और डेटा को PDF या Excel में निर्यात करें।",
      ta: "விரிவான அறிக்கைகளை உருவாக்கவும், குழு செயல்திறனைக் கண்காணிக்கவும், PDF அல்லது Excel க்கு தரவை ஏற்றுமதி செய்யவும்.",
      te: "వివరణాత్మక నివేదికలను రూపొందించండి, గ్రూప్ పనితీరును ట్రాక్ చేయండి, PDF లేదా Excel కు డేటాను ఎగుమతి చేయండి.",
      kn: "ವಿವರವಾದ ವರದಿಗಳನ್ನು ರಚಿಸಿ, ಗುಂಪಿನ ಕಾರ್ಯಕ್ಷಮತೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ, PDF ಅಥವಾ Excel ಗೆ ಡೇಟಾವನ್ನು ರಫ್ತು ಮಾಡಿ."
    },
    icon: BarChart3,
    color: "text-cyan-400",
    bgGradient: "from-cyan-600/30 via-blue-600/20 to-indigo-600/30",
    illustration: (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <defs>
          <linearGradient id="grad4" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.8"/>
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#grad4)" opacity="0.15"/>
        <rect x="35" y="40" width="130" height="120" rx="12" fill="#1E293B"/>
        <line x1="50" y1="70" x2="150" y2="70" stroke="#334155" strokeWidth="1"/>
        <line x1="50" y1="100" x2="150" y2="100" stroke="#334155" strokeWidth="1"/>
        <line x1="50" y1="130" x2="150" y2="130" stroke="#334155" strokeWidth="1"/>
        <rect x="55" y="100" width="20" height="45" rx="4" fill="#06B6D4"/>
        <rect x="82" y="80" width="20" height="65" rx="4" fill="#3B82F6"/>
        <rect x="109" y="60" width="20" height="85" rx="4" fill="#8B5CF6"/>
        <rect x="136" y="50" width="20" height="95" rx="4" fill="#10B981"/>
        <path d="M65 95 Q90 70 100 65 Q120 55 146 45" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.8"/>
      </svg>
    )
  },
  {
    title: {
      en: "Secure & Offline Ready",
      hi: "सुरक्षित और ऑफलाइन तैयार",
      ta: "பாதுகாப்பான & ஆஃப்லைன் தயார்",
      te: "సురక్షితం & ఆఫ్‌లైన్ సిద్ధం",
      kn: "ಸುರಕ್ಷಿತ & ಆಫ್‌ಲೈನ್ ಸಿದ್ಧ"
    },
    description: {
      en: "Your data is protected with device lock. Works offline and syncs when connected.",
      hi: "आपका डेटा डिवाइस लॉक से सुरक्षित है। ऑफलाइन काम करता है और कनेक्ट होने पर सिंक करता है।",
      ta: "உங்கள் தரவு சாதனப் பூட்டுடன் பாதுகாக்கப்படுகிறது. ஆஃப்லைனில் வேலை செய்கிறது, இணைக்கப்படும்போது ஒத்திசைக்கிறது.",
      te: "మీ డేటా పరికర లాక్‌తో రక్షించబడుతుంది. ఆఫ్‌లైన్‌లో పని చేస్తుంది, కనెక్ట్ అయినప్పుడు సింక్ అవుతుంది.",
      kn: "ನಿಮ್ಮ ಡೇಟಾ ಸಾಧನ ಲಾಕ್‌ನೊಂದಿಗೆ ರಕ್ಷಿಸಲ್ಪಟ್ಟಿದೆ. ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ, ಸಂಪರ್ಕಗೊಂಡಾಗ ಸಿಂಕ್ ಆಗುತ್ತದೆ."
    },
    icon: Shield,
    color: "text-amber-400",
    bgGradient: "from-amber-600/30 via-orange-600/20 to-red-600/30",
    illustration: (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <defs>
          <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.8"/>
          </linearGradient>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24"/>
            <stop offset="100%" stopColor="#F59E0B"/>
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#grad5)" opacity="0.15"/>
        <path d="M100 25 L160 50 L160 105 Q160 160 100 180 Q40 160 40 105 L40 50 Z" fill="url(#shieldGrad)"/>
        <path d="M100 40 L145 60 L145 105 Q145 145 100 162 Q55 145 55 105 L55 60 Z" fill="#FCD34D"/>
        <path d="M70 105 L90 125 L135 75" fill="none" stroke="#065F46" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    title: {
      en: "Multiple Languages",
      hi: "कई भाषाएं",
      ta: "பல மொழிகள்",
      te: "బహుళ భాషలు",
      kn: "ಬಹು ಭಾಷೆಗಳು"
    },
    description: {
      en: "Available in English, Hindi, Tamil, Telugu, and Kannada. Switch anytime from settings.",
      hi: "अंग्रेजी, हिंदी, तमिल, तेलुगु और कन्नड़ में उपलब्ध। सेटिंग्स से कभी भी बदलें।",
      ta: "ஆங்கிலம், இந்தி, தமிழ், தெலுங்கு மற்றும் கன்னடத்தில் கிடைக்கும். அமைப்புகளிலிருந்து எப்போது வேண்டுமானாலும் மாற்றவும்.",
      te: "ఇంగ్లీష్, హిందీ, తమిళం, తెలుగు మరియు కన్నడలో అందుబాటులో ఉంది. సెట్టింగ్‌ల నుండి ఎప్పుడైనా మార్చండి.",
      kn: "ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ, ತಮಿಳು, ತೆಲುಗು ಮತ್ತು ಕನ್ನಡದಲ್ಲಿ ಲಭ್ಯವಿದೆ. ಸೆಟ್ಟಿಂಗ್‌ಗಳಿಂದ ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಾಯಿಸಿ."
    },
    icon: Globe,
    color: "text-rose-400",
    bgGradient: "from-rose-600/30 via-pink-600/20 to-purple-600/30",
    illustration: (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <defs>
          <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8"/>
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#grad6)" opacity="0.15"/>
        <circle cx="100" cy="100" r="60" fill="#1E293B" stroke="#F43F5E" strokeWidth="4"/>
        <ellipse cx="100" cy="100" rx="60" ry="22" fill="none" stroke="#F43F5E" strokeWidth="2" opacity="0.4"/>
        <ellipse cx="100" cy="100" rx="60" ry="45" fill="none" stroke="#F43F5E" strokeWidth="2" opacity="0.4"/>
        <ellipse cx="100" cy="100" rx="22" ry="60" fill="none" stroke="#F43F5E" strokeWidth="2" opacity="0.4"/>
        <line x1="100" y1="40" x2="100" y2="160" stroke="#F43F5E" strokeWidth="2" opacity="0.4"/>
        <g transform="translate(30, 50)">
          <rect x="0" y="0" width="40" height="20" rx="10" fill="#3B82F6"/>
          <text x="20" y="14" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">EN</text>
        </g>
        <g transform="translate(130, 45)">
          <rect x="0" y="0" width="45" height="20" rx="10" fill="#10B981"/>
          <text x="22.5" y="14" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">हिंदी</text>
        </g>
        <g transform="translate(20, 130)">
          <rect x="0" y="0" width="45" height="20" rx="10" fill="#F59E0B"/>
          <text x="22.5" y="14" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">தமிழ்</text>
        </g>
        <g transform="translate(135, 135)">
          <rect x="0" y="0" width="50" height="20" rx="10" fill="#8B5CF6"/>
          <text x="25" y="14" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">తెలుగు</text>
        </g>
        <g transform="translate(70, 170)">
          <rect x="0" y="0" width="60" height="20" rx="10" fill="#EC4899"/>
          <text x="30" y="14" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">ಕನ್ನಡ</text>
        </g>
      </svg>
    )
  }
];

// Button text translations
const buttonText: Record<Language, { next: string; getStarted: string; skip: string }> = {
  en: { next: "Next", getStarted: "Get Started", skip: "Skip" },
  hi: { next: "आगे", getStarted: "शुरू करें", skip: "छोड़ें" },
  ta: { next: "அடுத்து", getStarted: "தொடங்கு", skip: "தவிர்" },
  te: { next: "తదుపరి", getStarted: "ప్రారంభించండి", skip: "దాటవేయి" },
  kn: { next: "ಮುಂದೆ", getStarted: "ಪ್ರಾರಂಭಿಸಿ", skip: "ಬಿಟ್ಟುಬಿಡಿ" }
};

export const WelcomeScreens: React.FC<WelcomeScreensProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { tap, notify } = useHaptics();
  const { language } = useLanguage();

  const handleNext = () => {
    tap('light');
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    tap('light');
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = () => {
    notify('success');
    localStorage.setItem('shg_welcome_seen', 'true');
    onComplete();
  };

  const handleSkip = () => {
    tap('medium');
    handleComplete();
  };

  const slide = slides[currentSlide];
  const buttons = buttonText[language];

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden">
      {/* Animated background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgGradient} transition-all duration-700`} />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/10"
            initial={{ 
              x: Math.random() * 400, 
              y: Math.random() * 800,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, Math.random() * -100 - 50],
              opacity: [0.3, 0]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 z-10 px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
      >
        {buttons.skip}
      </button>

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            {/* Illustration */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-10"
            >
              {slide.illustration}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-4"
            >
              {slide.title[language]}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base sm:text-lg text-white/70 leading-relaxed"
            >
              {slide.description[language]}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="absolute bottom-32 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => { tap('light'); setCurrentSlide(index); }}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide 
                  ? 'w-8 h-2 bg-white' 
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="absolute bottom-12 w-full max-w-md px-6 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`p-3 rounded-xl transition-all ${
              currentSlide === 0 
                ? 'opacity-0 pointer-events-none' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 bg-white text-background font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg shadow-white/20"
          >
            {currentSlide === slides.length - 1 ? (
              buttons.getStarted
            ) : (
              <>
                {buttons.next}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={currentSlide === slides.length - 1}
            className={`p-3 rounded-xl transition-all ${
              currentSlide === slides.length - 1 
                ? 'opacity-0 pointer-events-none' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
