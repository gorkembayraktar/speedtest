import { useState, useEffect } from 'react';
import { Monitor, Moon, Laptop, ChevronDown } from "lucide-react";

export type Theme = 'default' | 'dark' | 'dim';

interface ThemeSelectorProps {
    onThemeChange: (theme: Theme) => void;
    initialTheme: Theme;
    language: 'en' | 'tr';
}

export default function ThemeSelector({ onThemeChange, initialTheme, language }: ThemeSelectorProps) {
    const [currentTheme, setCurrentTheme] = useState<Theme>(initialTheme);
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const themes = [
        {
            value: 'default' as Theme,
            icon: <Monitor className="w-4 h-4" />,
            label: {
                en: 'Aurora',
                tr: 'Aurora'
            }
        },
        {
            value: 'dark' as Theme,
            icon: <Moon className="w-4 h-4" />,
            label: {
                en: 'Dark',
                tr: 'Koyu'
            }
        },
        {
            value: 'dim' as Theme,
            icon: <Laptop className="w-4 h-4" />,
            label: {
                en: 'Dim',
                tr: 'Loş'
            }
        }
    ];

    // Component mount kontrolü
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Theme initialization and sync
    useEffect(() => {
        if (!mounted) return;

        const savedTheme = localStorage.getItem('preferred_theme') as Theme;
        if (savedTheme && themes.some(t => t.value === savedTheme)) {
            setCurrentTheme(savedTheme);
            onThemeChange(savedTheme);
        } else {
            setCurrentTheme(initialTheme);
            localStorage.setItem('preferred_theme', initialTheme);
        }
    }, [mounted, initialTheme, onThemeChange]);

    const handleThemeChange = (theme: Theme) => {
        if (!mounted) return;
        setCurrentTheme(theme);
        onThemeChange(theme);
        localStorage.setItem('preferred_theme', theme);
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.theme-selector')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const currentThemeData = themes.find(t => t.value === currentTheme);

    return (
        <div className="relative theme-selector">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
                {currentThemeData?.icon}
                <span>{currentThemeData?.label[language]}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-lg bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 shadow-lg py-1 z-50">
                    {themes.map(theme => (
                        <button
                            key={theme.value}
                            onClick={() => handleThemeChange(theme.value)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors
                                ${currentTheme === theme.value
                                    ? 'bg-gray-700/50 text-white'
                                    : 'text-gray-300 hover:bg-gray-700/30 hover:text-white'
                                }`}
                        >
                            {theme.icon}
                            <span>{theme.label[language]}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
} 