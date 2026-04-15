import React from 'react';
import { motion } from 'framer-motion';
import { Check, Globe } from 'lucide-react';
import { useHaptics } from '../hooks/useNative';
import { Language } from '../translations';

interface LanguageSelectorProps {
  onSelect: (language: Language) => void;
}

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  greeting: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', greeting: 'Hello!' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', greeting: 'नमस्ते!' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', greeting: 'வணக்கம்!' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', greeting: 'నమస్కారం!' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', greeting: 'ನಮಸ್ಕಾರ!' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect }) => {
  const { tap, notify } = useHaptics();
  const [selected, setSelected] = React.useState<Language | null>(null);

  const handleSelect = (code: Language) => {
    tap('light');
    setSelected(code);
  };

  const handleContinue = () => {
    if (selected) {
      tap('medium');
      notify('success');
      // Save language preference
      localStorage.setItem('shg_language', selected);
      onSelect(selected);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-background" />
      
      {/* Decorative circles */}
      <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative h-full flex flex-col items-center justify-center px-6 py-12">
        {/* Globe Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Globe className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Choose Your Language
          </h1>
          <p className="text-white/60 text-sm">
            अपनी भाषा चुनें • உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்
          </p>
        </motion.div>

        {/* Language Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm space-y-3 mb-8"
        >
          {languages.map((lang, index) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              onClick={() => handleSelect(lang.code)}
              className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-300 ${
                selected === lang.code
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-purple-500/30 scale-[1.02]'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                  selected === lang.code
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/80'
                }`}>
                  {lang.nativeName.charAt(0)}
                </div>
                <div className="text-left">
                  <p className={`font-semibold ${selected === lang.code ? 'text-white' : 'text-white/90'}`}>
                    {lang.nativeName}
                  </p>
                  <p className={`text-sm ${selected === lang.code ? 'text-white/80' : 'text-white/50'}`}>
                    {lang.name} • {lang.greeting}
                  </p>
                </div>
              </div>
              
              {selected === lang.code && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <Check className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          onClick={handleContinue}
          disabled={!selected}
          className={`w-full max-w-sm py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
            selected
              ? 'bg-white text-background shadow-lg shadow-white/20 hover:shadow-white/30'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          {selected ? 'Continue' : 'Select a language'}
        </motion.button>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-white/40 text-xs text-center"
        >
          You can change this later in Settings
        </motion.p>
      </div>
    </div>
  );
};
