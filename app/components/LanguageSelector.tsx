import { useState, useEffect } from 'react';

interface LanguageSelectorProps {
    onLanguageChange: (lang: 'en' | 'tr') => void;
    initialLanguage: 'en' | 'tr';
}

export default function LanguageSelector({ onLanguageChange, initialLanguage }: LanguageSelectorProps) {
    const [currentLang, setCurrentLang] = useState<'en' | 'tr'>(initialLanguage);

    useEffect(() => {
        setCurrentLang(initialLanguage);
    }, [initialLanguage]);

    const toggleLanguage = () => {
        const newLang = currentLang === 'en' ? 'tr' : 'en';
        setCurrentLang(newLang);
        onLanguageChange(newLang);
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm font-medium transition-colors duration-200"
            >
                <span className={`${currentLang === 'en' ? 'text-blue-400' : 'text-gray-400'}`}>EN</span>
                <span className="text-gray-600">/</span>
                <span className={`${currentLang === 'tr' ? 'text-blue-400' : 'text-gray-400'}`}>TR</span>
            </button>
        </div>
    );
} 