"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import type { Theme } from '../components/ThemeSelector';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    colors: {
        background: string;
        text: string;
        primary: string;
        secondary: string;
        accent: string;
        border: string;
    };
}

const themeColors = {
    default: {
        background: 'bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900',
        text: 'text-white',
        primary: 'bg-gradient-to-r from-blue-500 to-blue-600',
        secondary: 'bg-gradient-to-r from-green-500 to-green-600',
        accent: 'bg-purple-500',
        border: 'border-gray-800/50',
    },
    dark: {
        background: 'bg-gradient-to-br from-gray-950 via-black to-gray-900',
        text: 'text-gray-100',
        primary: 'bg-gradient-to-r from-blue-500 to-blue-600',
        secondary: 'bg-gradient-to-r from-emerald-500 to-green-600',
        accent: 'bg-gradient-to-r from-violet-500 to-purple-600',
        border: 'border-gray-800/50',
    },
    dim: {
        background: 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800',
        text: 'text-gray-200',
        primary: 'bg-gradient-to-r from-blue-500 to-blue-600',
        secondary: 'bg-gradient-to-r from-green-500 to-green-600',
        accent: 'bg-gradient-to-r from-purple-500 to-violet-600',
        border: 'border-gray-700/50',
    },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get initial theme from localStorage or default
const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('preferred_theme') as Theme;
        if (savedTheme && Object.keys(themeColors).includes(savedTheme)) {
            return savedTheme;
        }
    }
    return 'default';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<Theme>('default');

    // Component mount kontrolü
    useEffect(() => {
        setMounted(true);
        // Mount olduktan sonra localStorage'dan theme'i al
        const savedTheme = getInitialTheme();
        setTheme(savedTheme);
    }, []);

    // Theme değişikliklerini localStorage'a kaydet
    useEffect(() => {
        if (mounted && typeof window !== 'undefined') {
            localStorage.setItem('preferred_theme', theme);
        }
    }, [theme, mounted]);

    const defaultContextValue: ThemeContextType = {
        theme,
        setTheme,
        colors: themeColors[theme]
    };

    return (
        <ThemeContext.Provider value={defaultContextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
} 