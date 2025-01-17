export interface TestResults {
    date: string;
    isp: string;
    ip: string;
    server: string;
    ping: number;
    jitter: number;
    download: number;
    upload: number;
}

export interface TestHistory {
    tests: TestResults[];
    lastUpdate: string;
} 