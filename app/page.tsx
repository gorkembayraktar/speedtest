"use client";

import { useState, useEffect } from "react";
import { Download, Upload, Gauge, Wifi, Activity, Zap, RotateCw } from "lucide-react";
import Speedometer from "./components/Speedometer";
import * as htmlToImage from 'html-to-image';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { TestResults, TestHistory as TestHistoryType } from './types';
import TestHistory from './components/TestHistory';
import LanguageSelector from './components/LanguageSelector';
import { translations } from './translations';
import ThemeSelector from './components/ThemeSelector';
import { useTheme } from './contexts/ThemeContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  // Theme context'i en başta kullan
  const { theme, setTheme, colors } = useTheme();

  // State hooks
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'tr'>('en');
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [ping, setPing] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [isp, setIsp] = useState("Detecting...");
  const [ipAddress, setIpAddress] = useState("");
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'ping' | 'download' | 'upload'>('idle');
  const [timeLeft, setTimeLeft] = useState(10);
  const [speedHistory, setSpeedHistory] = useState<{ download: number[]; upload: number[] }>({
    download: [],
    upload: []
  });
  const [location, setLocation] = useState("Detecting...");
  const [dataCenter, setDataCenter] = useState("Detecting...");
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [exportType, setExportType] = useState<'json' | 'png'>('json');
  const [testHistory, setTestHistory] = useState<TestHistoryType>({ tests: [], lastUpdate: '' });
  const [showHistory, setShowHistory] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('speedtest_show_history');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Mounted effect - should be first
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize all preferences after mount
  useEffect(() => {
    if (!mounted) return;

    // Initialize language
    const savedLang = localStorage.getItem('preferred_language');
    if (savedLang === 'en' || savedLang === 'tr') {
      setLanguage(savedLang);
    } else {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('tr')) {
        setLanguage('tr');
      }
    }

    // Initialize history visibility
    const savedHistoryVisibility = localStorage.getItem('speedtest_history_visible');
    if (savedHistoryVisibility !== null) {
      setShowHistory(JSON.parse(savedHistoryVisibility));
    }

    // Load test history
    const savedHistory = localStorage.getItem('speedtest_history');
    if (savedHistory) {
      setTestHistory(JSON.parse(savedHistory));
    }
  }, [mounted]);

  // Save preferences effect
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('preferred_language', language);
    localStorage.setItem('speedtest_show_history', JSON.stringify(showHistory));
  }, [mounted, language, showHistory]);

  // Network info effect
  useEffect(() => {
    if (!mounted) return;

    const fetchNetworkInfo = async () => {
      try {
        const response = await fetch('/api/network-info');
        const data = await response.json();

        if (data.success) {
          setIpAddress(data.ip);
          setIsp(data.isp);
          setDataCenter(data.dataCenter);
        } else {
          console.error('Failed to fetch network info:', data.error);
          setIsp('Unknown ISP');
          setIpAddress('Unknown');
          setDataCenter('Unknown');
        }
      } catch (error) {
        console.error('Error fetching network info:', error);
        setIsp('Unknown ISP');
        setIpAddress('Unknown');
        setDataCenter('Unknown');
      }
    };

    fetchNetworkInfo();
  }, [mounted]);

  // Timer effect for testing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (testing && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [testing, timeLeft]);

  // Update title based on language
  useEffect(() => {
    if (!mounted) return;
    document.title = language === 'tr' ? 'Hız Testi - İnternet Bağlantınızı Test Edin' : 'Speed Test - Test Your Internet Connection';
  }, [language, mounted]);

  // Loading state
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                Speed Test
              </h1>
              <p className="text-gray-400 mt-1">Test your internet connection speed</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const t = translations[language];

  const measurePing = async () => {
    const results: Array<{ latency: number; jitter: number }> = [];

    for (let i = 0; i < 8; i++) {
      const start = performance.now();
      const response = await fetch('/api/test-file', { method: 'HEAD' });
      const end = performance.now();

      const baseLatency = parseFloat(response.headers.get('X-Base-Latency') || '0');
      const jitterValue = parseFloat(response.headers.get('X-Jitter') || '0');

      results.push({
        latency: end - start,
        jitter: jitterValue
      });

      // Add small delay between measurements
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Sort by latency and remove outliers
    results.sort((a, b) => a.latency - b.latency);
    const filteredResults = results.slice(2, -2); // Remove 2 highest and 2 lowest

    // Calculate average ping
    const avgPing = filteredResults.reduce((sum, r) => sum + r.latency, 0) / filteredResults.length;
    setPing(avgPing);

    // Calculate average jitter
    const avgJitter = filteredResults.reduce((sum, r) => sum + r.jitter, 0) / filteredResults.length;
    setJitter(avgJitter);

    return { ping: avgPing, jitter: avgJitter };
  };

  const measureDownloadSpeed = async (onProgress: (speed: number) => void) => {
    const measurements: number[] = [];
    const testSizes = Array(8).fill(2 * 1024 * 1024);

    for (const size of testSizes) {
      const start = performance.now();
      const response = await fetch('/api/test-file');
      const data = await response.arrayBuffer();
      const end = performance.now();

      const durationInSeconds = (end - start) / 1000;
      const fileSizeInBits = data.byteLength * 8;
      const speedInMbps = (fileSizeInBits / durationInSeconds) / 1_000_000;

      measurements.push(speedInMbps);
      setSpeedHistory(prev => ({
        ...prev,
        download: [...prev.download, speedInMbps]
      }));
      onProgress(speedInMbps);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const weightedSum = measurements.reduce((sum, speed, index) =>
      sum + speed * (index + 1), 0);
    const weightSum = measurements.reduce((sum, _, index) =>
      sum + (index + 1), 0);
    return weightedSum / weightSum;
  };

  const measureUploadSpeed = async (onProgress: (speed: number) => void) => {
    const measurements: number[] = [];

    // Test dosyalarını public klasöründen al
    async function getTestFile(size: string) {
      try {
        const response = await fetch(`/test_${size}mb.bin`);
        if (!response.ok) {
          throw new Error(`Failed to fetch test file: ${response.statusText}`);
        }
        return await response.arrayBuffer();
      } catch (error) {
        console.error(`Error loading test file: ${error}`);
        throw new Error('Failed to load test file');
      }
    }

    try {
      // İlk hız testi (1MB ile)
      console.log('Starting initial test with 1MB file...');
      const initialData = await getTestFile('1');
      console.log('1MB file loaded, size:', initialData.byteLength);

      const initialResponse = await fetch('/api/upload-test', {
        method: 'POST',
        body: initialData,
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      });

      if (!initialResponse.ok) {
        throw new Error(`Upload test failed: ${initialResponse.statusText}`);
      }

      const initialResult = await initialResponse.json();
      console.log('Initial test result:', initialResult);
      const initialSpeedMbps = initialResult.speed;

      // İlk test sonucunu kaydet
      measurements.push(initialSpeedMbps);
      onProgress(initialSpeedMbps);
      setSpeedHistory(prev => ({
        ...prev,
        upload: [...prev.upload, initialSpeedMbps]
      }));

      // Hıza göre uygun dosya boyutunu seç (Vercel limiti nedeniyle maksimum 4MB)
      let testFileSize: string;
      if (initialSpeedMbps < 2) {
        testFileSize = '1';  // Yavaş bağlantı: 1MB
      } else if (initialSpeedMbps < 5) {
        testFileSize = '2'; // Orta hız: 2MB
      } else {
        testFileSize = '4'; // Yüksek hız: 4MB
      }

      console.log(`Selected test file size: ${testFileSize}MB`);
      const testData = await getTestFile(testFileSize);
      console.log(`Test file loaded, size: ${testData.byteLength}`);

      // 3 kez test yap
      for (let i = 0; i < 3; i++) {
        console.log(`Running test ${i + 1}/3...`);
        const response = await fetch('/api/upload-test', {
          method: 'POST',
          body: testData,
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        });

        if (!response.ok) {
          throw new Error(`Upload test ${i + 1} failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`Test ${i + 1} result:`, result);
        const speedInMbps = result.speed;

        // Her test sonucunu kaydet
        measurements.push(speedInMbps);
        onProgress(speedInMbps);
        setSpeedHistory(prev => ({
          ...prev,
          upload: [...prev.upload, speedInMbps]
        }));

        // Testler arası bekleme
        if (i < 2) { // Son testte beklemeye gerek yok
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Tüm ölçümlerin medyanını hesapla
      console.log('Raw measurements:', measurements);

      // Son 3 ölçümü al (büyük dosya testleri)
      const lastThreeMeasurements = measurements.slice(-3);
      console.log('Last three measurements:', lastThreeMeasurements);

      // Medyanı hesapla
      const sortedMeasurements = [...lastThreeMeasurements].sort((a, b) => a - b);
      const medianSpeed = sortedMeasurements[Math.floor(sortedMeasurements.length / 2)];

      console.log('Sorted measurements:', sortedMeasurements);
      console.log('Median speed:', medianSpeed);

      return medianSpeed;
    } catch (error) {
      console.error('Upload test error:', error);
      throw error;
    }
  };

  const startTest = async () => {
    // Reset all values
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setPing(0);
    setJitter(0);
    setSpeedHistory({ download: [], upload: [] });
    setTestResults(null);

    // Start test
    setTesting(true);
    setProgress(0);
    setTimeLeft(10);

    try {
      setCurrentPhase('ping');
      setProgress(10);
      const { ping: pingResult, jitter: jitterResult } = await measurePing();
      setPing(pingResult);
      setJitter(jitterResult);

      setCurrentPhase('download');
      setProgress(30);
      const downloadResult = await measureDownloadSpeed((speed) => {
        setDownloadSpeed(speed);
        setProgress(prev => Math.min(60, prev + 4));
      });
      setDownloadSpeed(downloadResult);

      setCurrentPhase('upload');
      setProgress(60);
      const uploadResult = await measureUploadSpeed((speed) => {
        setUploadSpeed(speed);
        setProgress(prev => Math.min(100, prev + 5));
      });
      setUploadSpeed(uploadResult);

      setProgress(100);

      // Save test results
      const newResults = {
        date: new Date().toISOString(),
        isp,
        ip: ipAddress,
        server: dataCenter,
        ping: pingResult,
        jitter: jitterResult,
        download: downloadResult,
        upload: uploadResult
      };

      setTestResults(newResults);

      // Save to history
      const updatedHistory = {
        tests: [newResults, ...testHistory.tests].slice(0, 100), // Keep last 100 tests
        lastUpdate: new Date().toISOString()
      };
      setTestHistory(updatedHistory);
      if (typeof window !== 'undefined') {
        localStorage.setItem('speedtest_history', JSON.stringify(updatedHistory));
      }

    } catch (error) {
      console.error('Speed test failed:', error);
    } finally {
      setCurrentPhase('idle');
      setTesting(false);
    }
  };

  const getPhaseText = () => {
    switch (currentPhase) {
      case 'ping':
        return 'Measuring ping...';
      case 'download':
        return 'Testing download speed...';
      case 'upload':
        return 'Testing upload speed...';
      default:
        return 'Start Speed Test';
    }
  };

  const getCurrentValue = () => {
    switch (currentPhase) {
      case 'download':
        return speedHistory.download.length > 0
          ? speedHistory.download[speedHistory.download.length - 1].toFixed(2)
          : '0.00';
      case 'upload':
        return speedHistory.upload.length > 0
          ? speedHistory.upload[speedHistory.upload.length - 1].toFixed(2)
          : '0.00';
      case 'ping':
        return ping.toFixed(1);
      default:
        return '0.00';
    }
  };

  const downloadResults = async () => {
    if (!testResults) return;

    if (exportType === 'json') {
      const results = {
        ...testResults,
        downloadHistory: speedHistory.download,
        uploadHistory: speedHistory.upload
      };

      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speedtest-results-${new Date().toISOString().split('.')[0].replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Create a temporary div for the results
      const resultsDiv = document.createElement('div');
      resultsDiv.className = 'fixed top-0 left-0 bg-gray-900 p-8 rounded-xl text-white';
      resultsDiv.style.cssText = 'width: 600px; padding: 32px; z-index: -1000; font-family: system-ui, -apple-system, sans-serif;';
      resultsDiv.innerHTML = `
        <div class="space-y-4">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
            <h2 style="font-size: 24px; font-weight: bold;">Speed Test Results</h2>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <p style="color: #94A3B8; margin-bottom: 4px;">Date</p>
              <p style="font-weight: 500;">${new Date(testResults.date).toLocaleString()}</p>
            </div>
            <div>
              <p style="color: #94A3B8; margin-bottom: 4px;">ISP</p>
              <p style="font-weight: 500;">${testResults.isp}</p>
            </div>
            <div>
              <p style="color: #94A3B8; margin-bottom: 4px;">Server</p>
              <p style="font-weight: 500;">${testResults.server}</p>
            </div>
            <div>
              <p style="color: #94A3B8; margin-bottom: 4px;">IP Address</p>
              <p style="font-weight: 500;">${testResults.ip}</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
            <div style="background: rgba(37, 99, 235, 0.1); padding: 16px; border-radius: 12px;">
              <p style="color: #94A3B8; margin-bottom: 4px;">Download</p>
              <p style="font-size: 32px; font-weight: bold; color: #60A5FA;">${testResults.download.toFixed(2)} <span style="font-size: 14px;">Mbps</span></p>
            </div>
            <div style="background: rgba(22, 163, 74, 0.1); padding: 16px; border-radius: 12px;">
              <p style="color: #94A3B8; margin-bottom: 4px;">Upload</p>
              <p style="font-size: 32px; font-weight: bold; color: #4ADE80;">${testResults.upload.toFixed(2)} <span style="font-size: 14px;">Mbps</span></p>
            </div>
            <div style="background: rgba(255, 255, 255, 0.05); padding: 16px; border-radius: 12px;">
              <p style="color: #94A3B8; margin-bottom: 4px;">Ping</p>
              <p style="font-size: 32px; font-weight: bold; color: #ffffff;">${testResults.ping.toFixed(1)} <span style="font-size: 14px;">ms</span></p>
            </div>
            <div style="background: rgba(255, 255, 255, 0.05); padding: 16px; border-radius: 12px;">
              <p style="color: #94A3B8; margin-bottom: 4px;">Jitter</p>
              <p style="font-size: 32px; font-weight: bold; color: #ffffff;">${testResults.jitter.toFixed(1)} <span style="font-size: 14px;">ms</span></p>
            </div>
          </div>
        </div>
      `;

      // Add the div to DOM
      document.body.appendChild(resultsDiv);

      try {
        // Add some delay to ensure rendering
        await new Promise(resolve => setTimeout(resolve, 500));

        // Convert to PNG with higher quality settings
        const dataUrl = await htmlToImage.toPng(resultsDiv, {
          quality: 1,
          pixelRatio: 3,
          backgroundColor: '#111827',
          style: {
            margin: '0',
            padding: '32px'
          },
          fontEmbedCSS: '',
          skipFonts: true
        });

        // Create download link
        const link = document.createElement('a');
        link.download = `speedtest-results-${new Date().toISOString().split('.')[0].replace(/[:.]/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Error generating PNG:', error);
      } finally {
        // Remove the temporary div
        document.body.removeChild(resultsDiv);
      }
    }
  };

  return (
    <main className={`min-h-screen ${colors.background} ${colors.text} p-4 sm:p-8`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
            {language === 'tr' ? 'Hız Testi' : 'Speed Test'}
          </h1>
          <div className="flex items-center gap-4">
            <ThemeSelector
              onThemeChange={setTheme}
              initialTheme={theme}
              language={language}
            />
            <LanguageSelector
              onLanguageChange={setLanguage}
              initialLanguage={language}
            />
          </div>
        </div>

        <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-8 ${!testing && testResults ? `${colors.background} backdrop-blur-xl shadow-2xl ${colors.border}` : ''}`}>
          <div className="flex flex-col lg:flex-row items-center">
            {/* Left Section - Speedometer and Button */}
            <div className={`flex flex-col items-center justify-between ${!testing && testResults ? 'lg:w-1/2' : 'w-full'}`}>
              <div className="scale-90 sm:scale-100 transform-gpu">
                <Speedometer
                  value={currentPhase === 'download' ? downloadSpeed : uploadSpeed}
                  maxValue={currentPhase === 'upload' ? 100 : 1024}
                  phase={currentPhase}
                />
              </div>

              {/* Data Center Info */}
              <div className="flex items-center justify-center space-x-2 mt-4 mb-6 bg-gray-800/50 px-4 py-2 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className="text-sm text-gray-300 font-medium">
                  {t.testingServer}: <span className="text-white">{dataCenter}</span>
                </div>
              </div>

              <button
                onClick={startTest}
                disabled={testing}
                className={`
                  px-8 py-4 
                  rounded-full text-lg font-medium 
                  transition-all duration-300 
                  relative
                  w-56 h-14
                  ${testing
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 animate-button-glow'
                  }
                  ${currentPhase === 'download' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : ''}
                  ${currentPhase === 'upload' ? 'bg-gradient-to-r from-green-500 to-green-600' : ''}
                `}
              >
                {!testing && (
                  <div className="absolute inset-0 rounded-full animate-pulse-ring bg-blue-500/20" />
                )}
                <div className="relative flex items-center justify-center gap-2">
                  {testing ? (
                    <>
                      {currentPhase === 'ping' && (
                        <Gauge className="w-5 h-5 text-white animate-[spin_2s_linear_infinite]" />
                      )}
                      {currentPhase === 'download' && (
                        <Download className="w-5 h-5 text-white animate-bounce" />
                      )}
                      {currentPhase === 'upload' && (
                        <Upload className="w-5 h-5 text-white animate-bounce" />
                      )}
                      <span className="ml-2">{currentPhase === 'download' ? t.download : t.upload}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 text-white animate-pulse" />
                      <span className="text-white font-semibold">{t.startTest}</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Right Section - Test Results */}
            <div className={`lg:w-1/2 space-y-6 transition-all duration-500 transform ${!testing && testResults ? 'opacity-100 translate-x-0 lg:block' : 'opacity-0 translate-x-24 hidden'}`}>
              {/* ISP Information */}
              <div className="bg-gray-800/50 p-4 rounded-xl transition-all duration-300 delay-100">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-700/50 rounded-lg">
                    <Wifi className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{isp}</div>
                    <div className="text-sm text-gray-400">{ipAddress}</div>
                  </div>
                </div>
              </div>

              {/* PING and JITTER */}
              <div className="grid grid-cols-2 gap-4 transition-all duration-300 delay-200">
                <div className="bg-gray-800/50 p-4 rounded-xl transform transition hover:scale-105">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-700/50 rounded-lg">
                      <Gauge className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">PING</div>
                      <div className="text-3xl font-bold">{ping.toFixed(1)}</div>
                      <div className="text-sm text-gray-400">ms</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl transform transition hover:scale-105">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-700/50 rounded-lg">
                      <Activity className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">JITTER</div>
                      <div className="text-3xl font-bold">{jitter.toFixed(1)}</div>
                      <div className="text-sm text-gray-400">ms</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DOWNLOAD */}
              <div className="bg-gray-800/50 p-4 rounded-xl transition-all duration-300 delay-300 transform hover:scale-[1.02]">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-2 bg-gray-700/50 rounded-lg">
                    <Download className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">{t.download}</div>
                    <div className="text-3xl font-bold text-blue-400">{downloadSpeed.toFixed(1)}</div>
                    <div className="text-sm text-gray-400">Mbps</div>
                  </div>
                </div>
                <div className="relative">
                  {/* Tick marks */}
                  <div className="absolute -top-3 left-0 right-0 flex justify-between text-[10px] sm:text-xs text-gray-500">
                    {[0, 128, 256, 384, 512, 640, 768, 896, 1024].map((value) => (
                      <div key={value} className="flex flex-col items-center">
                        <div className="h-2 w-0.5 bg-gray-700 mb-1"></div>
                        <span className="hidden sm:inline">{value}</span>
                        <span className="sm:hidden">{value >= 1000 ? '1K' : value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-blue-400/20 rounded-full">
                    <div
                      className="bg-blue-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((downloadSpeed / 1024) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* UPLOAD */}
              <div className="bg-gray-800/50 p-4 rounded-xl transition-all duration-300 delay-400 transform hover:scale-[1.02]">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-2 bg-gray-700/50 rounded-lg">
                    <Upload className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">{t.upload}</div>
                    <div className="text-3xl font-bold text-green-400">{uploadSpeed.toFixed(1)}</div>
                    <div className="text-sm text-gray-400">Mbps</div>
                  </div>
                </div>
                <div className="relative">
                  {/* Tick marks */}
                  <div className="absolute -top-3 left-0 right-0 flex justify-between text-[10px] sm:text-xs text-gray-500">
                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
                      <div key={value} className="flex flex-col items-center">
                        <div className="h-2 w-0.5 bg-gray-700 mb-1"></div>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-green-400/20 rounded-full">
                    <div
                      className="bg-green-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((uploadSpeed / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Download Results Button */}
              <div className="flex flex-col items-center gap-3 transition-all duration-300 delay-500">
                <div className="flex gap-2 p-1 bg-gray-800/50 rounded-lg">
                  <button
                    onClick={() => setExportType('json')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${exportType === 'json' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setExportType('png')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${exportType === 'png' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    PNG
                  </button>
                </div>
                <button
                  onClick={downloadResults}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  Download as {exportType.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>

        <TestHistory
          testHistory={testHistory}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          language={language}
        />

        {/* Footer */}
        <footer className="mt-8 pb-4 text-center text-sm text-gray-400">
          <div className="flex items-center justify-center gap-2">
            <a
              href="https://github.com/gorkembayraktar/speedtest"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors duration-200 flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline-block"
              >
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              {language === 'tr' ? 'Kaynak Kodu' : 'Source Code'}
            </a>
            <span className="mx-2">•</span>
            <span>{new Date().getFullYear()} © Speed Test</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {language === 'tr' ? 'İnternet hızınızı test edin' : 'Test your internet connection speed'}
          </div>
        </footer>
      </div>
    </main>
  );
}