"use client";

import { ThemeProvider } from './contexts/ThemeContext';

interface ClientLayoutProps {
    children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
    return (
        <ThemeProvider>
            {children}
        </ThemeProvider>
    );
} 