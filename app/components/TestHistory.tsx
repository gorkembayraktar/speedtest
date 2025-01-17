import { Line } from 'react-chartjs-2';
import { Download, Upload, Gauge, Activity, RotateCw } from "lucide-react";
import { TestResults, TestHistory as TestHistoryType } from '../types';
import { translations } from '../translations';
import { useState } from 'react';

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
            display: true,
            text: 'Speed Test History',
            color: '#fff',
            padding: 20,
            font: {
                size: 16,
                weight: 'bold' as const
            }
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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(testHistory.tests.length / itemsPerPage);

    const t = translations[language];

    const getCurrentPageItems = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return testHistory.tests.slice(startIndex, endIndex);
    };

    const PaginationControls = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex items-center justify-between mt-4 px-4">
                <div className="text-sm text-gray-400">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, testHistory.tests.length)} of {testHistory.tests.length} results
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                    >
                        First
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-1">
                        {startPage > 1 && (
                            <>
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    className="px-3 py-1 rounded text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    1
                                </button>
                                {startPage > 2 && <span className="text-gray-600">...</span>}
                            </>
                        )}
                        {pageNumbers.map(number => (
                            <button
                                key={number}
                                onClick={() => setCurrentPage(number)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${currentPage === number
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {number}
                            </button>
                        ))}
                        {endPage < totalPages && (
                            <>
                                {endPage < totalPages - 1 && <span className="text-gray-600">...</span>}
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    className="px-3 py-1 rounded text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}
                    </div>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                    >
                        Next
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                    >
                        Last
                    </button>
                </div>
            </div>
        );
    };

    const getChartData = () => {
        const labels = testHistory.tests.map((test: TestResults) => {
            const date = new Date(test.date);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Bugün ise
            if (date.toDateString() === today.toDateString()) {
                return `Today ${date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })}`;
            }
            // Dün ise
            else if (date.toDateString() === yesterday.toDateString()) {
                return `Yesterday ${date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })}`;
            }
            // Diğer günler için
            else {
                return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
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

    if (testHistory.tests.length === 0) {
        return null;
    }

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{t.testHistory}</h2>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                    <RotateCw className="w-4 h-4" />
                    {showHistory ? t.hideHistory : t.showHistory}
                </button>
            </div>

            {showHistory && (
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-4 sm:p-8 shadow-2xl border border-gray-800/50">
                    <div className="w-full h-[400px] mb-8">
                        <Line options={chartOptions} data={getChartData()} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    <th className="sticky top-0 bg-gray-800/50 backdrop-blur-xl px-4 py-3 text-sm font-medium text-gray-400 rounded-tl-lg">{t.dateTime}</th>
                                    <th className="sticky top-0 bg-gray-800/50 backdrop-blur-xl px-4 py-3 text-sm font-medium text-gray-400">{t.download}</th>
                                    <th className="sticky top-0 bg-gray-800/50 backdrop-blur-xl px-4 py-3 text-sm font-medium text-gray-400">{t.upload}</th>
                                    <th className="sticky top-0 bg-gray-800/50 backdrop-blur-xl px-4 py-3 text-sm font-medium text-gray-400">{t.ping}</th>
                                    <th className="sticky top-0 bg-gray-800/50 backdrop-blur-xl px-4 py-3 text-sm font-medium text-gray-400">{t.jitter}</th>
                                    <th className="sticky top-0 bg-gray-800/50 backdrop-blur-xl px-4 py-3 text-sm font-medium text-gray-400 rounded-tr-lg">{t.server}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getCurrentPageItems().map((test: TestResults, index: number) => {
                                    const date = new Date(test.date);
                                    const today = new Date();
                                    const yesterday = new Date(today);
                                    yesterday.setDate(yesterday.getDate() - 1);

                                    let dateDisplay;
                                    if (date.toDateString() === today.toDateString()) {
                                        dateDisplay = `${t.today} ${date.toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        })}`;
                                    } else if (date.toDateString() === yesterday.toDateString()) {
                                        dateDisplay = `${t.yesterday} ${date.toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        })}`;
                                    } else {
                                        dateDisplay = date.toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        });
                                    }

                                    return (
                                        <tr
                                            key={test.date}
                                            className="group hover:bg-gray-800/30 transition-colors duration-150"
                                        >
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium text-gray-300">{dateDisplay}</div>
                                                <div className="text-xs text-gray-500">{test.isp}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Download className="w-4 h-4 text-blue-400" />
                                                    <span className="font-medium text-blue-400">
                                                        {test.download.toFixed(2)}
                                                        <span className="text-xs text-gray-400 ml-1">Mbps</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Upload className="w-4 h-4 text-green-400" />
                                                    <span className="font-medium text-green-400">
                                                        {test.upload.toFixed(2)}
                                                        <span className="text-xs text-gray-400 ml-1">Mbps</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Gauge className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-200">
                                                        {test.ping.toFixed(1)}
                                                        <span className="text-xs text-gray-400 ml-1">ms</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-200">
                                                        {test.jitter.toFixed(1)}
                                                        <span className="text-xs text-gray-400 ml-1">ms</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-400">{test.server}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="flex items-center justify-between mt-4 px-4">
                            <div className="text-sm text-gray-400">
                                {t.showing} {((currentPage - 1) * itemsPerPage) + 1} {t.to} {Math.min(currentPage * itemsPerPage, testHistory.tests.length)} {t.of} {testHistory.tests.length} {t.results}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="px-2 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                                >
                                    {t.first}
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-2 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                                >
                                    {t.previous}
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-2 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                                >
                                    {t.next}
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-2 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                                >
                                    {t.last}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 