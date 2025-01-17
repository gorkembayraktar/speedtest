import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Download, Upload, Gauge, Activity, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { TestResults, TestHistory as TestHistoryType } from '../types';

interface TestHistoryProps {
    testHistory: TestHistoryType;
    showHistory: boolean;
    setShowHistory: (show: boolean) => void;
    language: 'en' | 'tr';
}

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index' as const,
        intersect: false,
    },
    plugins: {
        legend: {
            position: 'top' as const,
            labels: {
                color: '#fff',
                padding: 20,
                font: {
                    size: 14
                }
            }
        },
        title: {
            display: false
        }
    },
    scales: {
        x: {
            grid: {
                color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
                color: '#fff',
                maxRotation: 0,
                minRotation: 0,
                padding: 10,
                autoSkip: true,
                maxTicksLimit: 6,
                font: {
                    size: 12
                }
            }
        },
        y: {
            grid: {
                color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
                color: '#fff',
                padding: 10,
                font: {
                    size: 12
                }
            }
        }
    }
};

export default function TestHistory({ testHistory, showHistory, setShowHistory, language }: TestHistoryProps) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(testHistory.tests.length / itemsPerPage);

    const clearHistory = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('speedtest_history', JSON.stringify({ tests: [], lastUpdate: new Date().toISOString() }));
            window.location.reload();
        }
    };

    const getCurrentPageItems = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return testHistory.tests.slice(startIndex, endIndex);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `${language === 'tr' ? 'Bugün' : 'Today'} ${date.toLocaleTimeString()}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `${language === 'tr' ? 'Dün' : 'Yesterday'} ${date.toLocaleTimeString()}`;
        } else {
            return date.toLocaleString();
        }
    };

    const getChartData = () => {
        const labels = testHistory.tests.map((test: TestResults) => {
            const date = new Date(test.date);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) {
                return `${language === 'tr' ? 'Bugün' : 'Today'} ${date.toLocaleTimeString()}`;
            } else if (date.toDateString() === yesterday.toDateString()) {
                return `${language === 'tr' ? 'Dün' : 'Yesterday'} ${date.toLocaleTimeString()}`;
            } else {
                return date.toLocaleString();
            }
        }).reverse();

        return {
            labels,
            datasets: [
                {
                    label: 'Download (Mbps)',
                    data: testHistory.tests.map((test: TestResults) => test.download).reverse(),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    tension: 0.4
                },
                {
                    label: 'Upload (Mbps)',
                    data: testHistory.tests.map((test: TestResults) => test.upload).reverse(),
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.5)',
                    tension: 0.4
                }
            ]
        };
    };

    return (
        <>
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 text-lg font-medium text-gray-300 hover:text-white transition-colors"
                    >
                        {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        {language === 'tr' ? 'Test Geçmişi' : 'Test History'}
                    </button>
                    {showHistory && testHistory.tests.length > 0 && (
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            {language === 'tr' ? 'Geçmişi Temizle' : 'Clear History'}
                        </button>
                    )}
                </div>

                {showHistory && (
                    <div className="bg-gray-900/50 backdrop-blur-xl shadow-2xl border border-gray-800/50 rounded-2xl p-4 overflow-x-auto">
                        {testHistory.tests.length > 0 ? (
                            <>
                                <div className="w-full h-[400px] mb-8">
                                    <Line options={chartOptions} data={getChartData()} />
                                </div>
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-sm text-gray-400">
                                            <th className="py-2 px-4 font-medium">{language === 'tr' ? 'Tarih & Saat' : 'Date & Time'}</th>
                                            <th className="py-2 px-4 font-medium">Download</th>
                                            <th className="py-2 px-4 font-medium">Upload</th>
                                            <th className="py-2 px-4 font-medium">Ping</th>
                                            <th className="py-2 px-4 font-medium">Jitter</th>
                                            <th className="py-2 px-4 font-medium">Server</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getCurrentPageItems().map((test: TestResults, index: number) => (
                                            <tr key={index} className="border-t border-gray-800/50 text-sm hover:bg-gray-800/30">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-gray-300">{formatDate(test.date)}</div>
                                                    <div className="text-xs text-gray-500">{test.isp}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Download className="w-4 h-4 text-blue-400" />
                                                        <span className="font-medium text-blue-400">
                                                            {test.download.toFixed(2)}
                                                            <span className="text-xs text-gray-400 ml-1">Mbps</span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Upload className="w-4 h-4 text-green-400" />
                                                        <span className="font-medium text-green-400">
                                                            {test.upload.toFixed(2)}
                                                            <span className="text-xs text-gray-400 ml-1">Mbps</span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Gauge className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium text-gray-200">
                                                            {test.ping.toFixed(1)}
                                                            <span className="text-xs text-gray-400 ml-1">ms</span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium text-gray-200">
                                                            {test.jitter.toFixed(1)}
                                                            <span className="text-xs text-gray-400 ml-1">ms</span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-400">{test.server}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4 px-4">
                                    <div className="text-sm text-gray-400">
                                        {language === 'tr'
                                            ? `${((currentPage - 1) * itemsPerPage) + 1} - ${Math.min(currentPage * itemsPerPage, testHistory.tests.length)} arası gösteriliyor (Toplam: ${testHistory.tests.length})`
                                            : `Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, testHistory.tests.length)} of ${testHistory.tests.length} results`
                                        }
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="px-2 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                                        >
                                            {language === 'tr' ? 'İlk' : 'First'}
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-2 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                                        >
                                            {language === 'tr' ? 'Önceki' : 'Previous'}
                                        </button>
                                        <span className="text-gray-400">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-2 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                                        >
                                            {language === 'tr' ? 'Sonraki' : 'Next'}
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="px-2 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                                        >
                                            {language === 'tr' ? 'Son' : 'Last'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                {language === 'tr' ? 'Henüz test geçmişi bulunmuyor.' : 'No test history available.'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-semibold mb-2">
                            {language === 'tr' ? 'Geçmişi Temizle' : 'Clear History'}
                        </h3>
                        <p className="text-gray-400 mb-6">
                            {language === 'tr'
                                ? 'Tüm test geçmişiniz silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?'
                                : 'All your test history will be deleted. This action cannot be undone. Do you want to continue?'}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                            >
                                {language === 'tr' ? 'İptal' : 'Cancel'}
                            </button>
                            <button
                                onClick={clearHistory}
                                className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                            >
                                {language === 'tr' ? 'Evet, Temizle' : 'Yes, Clear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 