import { NextRequest, NextResponse } from 'next/server';

// Force dynamic for upload test
export const dynamic = 'force-dynamic';

// Simulated network conditions
const NETWORK_CONDITIONS = {
    PROCESSING_OVERHEAD: 200,   // 200ms overhead for processing
    MAX_SPEED: 12,             // 12 Mbps max speed
    MIN_SPEED: 2,              // 2 Mbps minimum speed
    BASE_LATENCY: 50,          // 50ms base latency
    NETWORK_JITTER: 0.3,       // 30% network jitter
    CONGESTION_FACTOR: 2.0,    // Increased network congestion factor
    SPEED_VARIANCE: 0.4        // 40% speed variance
};

export async function POST(request: NextRequest) {
    try {
        // Initial processing delay with variance
        const processingTime = NETWORK_CONDITIONS.PROCESSING_OVERHEAD * (1 + Math.random() * 0.5); // +50% variance
        await new Promise(resolve => setTimeout(resolve, processingTime));
        const startTime = process.hrtime.bigint();

        // Get the uploaded data
        const data = await request.blob();
        const fileSize = data.size;

        // Calculate base network conditions
        const jitter = 1 + (Math.random() * NETWORK_CONDITIONS.NETWORK_JITTER * 2 - NETWORK_CONDITIONS.NETWORK_JITTER);
        const latency = NETWORK_CONDITIONS.BASE_LATENCY * jitter;

        // Add progressive latency based on file size
        const sizeBasedLatency = Math.log2(fileSize / (1024 * 1024) + 1) * 20; // Additional ms per file size doubling
        const totalLatency = latency + sizeBasedLatency;

        await new Promise(resolve => setTimeout(resolve, Math.floor(totalLatency)));

        // Calculate duration with realistic network simulation
        const endTime = process.hrtime.bigint();
        const durationInNanos = Number(endTime - startTime);
        const networkOverhead = (processingTime + totalLatency) / 1000;
        const baseDuration = (durationInNanos / 1_000_000_000) + networkOverhead;

        // Add progressive congestion effect
        const congestionEffect = Math.max(1, Math.log2(fileSize / (1024 * 1024) + 1) * NETWORK_CONDITIONS.CONGESTION_FACTOR);
        const durationInSeconds = baseDuration * congestionEffect;

        // Calculate initial speed
        const fileSizeInBits = fileSize * 8;
        let speedInMbps = (fileSizeInBits / durationInSeconds) / 1_000_000;

        // Apply realistic speed variance
        const baseSpeedVariation = (Math.random() * NETWORK_CONDITIONS.SPEED_VARIANCE * 2 - NETWORK_CONDITIONS.SPEED_VARIANCE);
        speedInMbps = speedInMbps * (1 + baseSpeedVariation);

        // Apply speed limits
        speedInMbps = Math.min(speedInMbps, NETWORK_CONDITIONS.MAX_SPEED);
        speedInMbps = Math.max(speedInMbps, NETWORK_CONDITIONS.MIN_SPEED);

        // Add small final fluctuation
        const finalVariation = (Math.random() * 0.1 - 0.05); // ±5% final variation
        speedInMbps = speedInMbps * (1 + finalVariation);

        return NextResponse.json({
            success: true,
            size: fileSize,
            duration: durationInSeconds,
            speed: Math.round(speedInMbps * 100) / 100,
            raw_duration: durationInSeconds,
            raw_size: fileSize,
            latency: Math.round(totalLatency * 100) / 100,
            congestion: Math.round(congestionEffect * 100) / 100,
            processing_time: Math.round(processingTime * 100) / 100
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    } catch (error) {
        console.error('Upload test error:', error);
        return NextResponse.json({
            success: false,
            error: 'Upload test failed',
        }, { status: 500 });
    }
} 