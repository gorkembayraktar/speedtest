import { NextRequest, NextResponse } from 'next/server';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '100mb'
        },
        responseLimit: '100mb'
    }
};

// Yapay gecikme ekleyen yardımcı fonksiyon
const artificialDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
    try {
        const start = performance.now();

        // TCP connection ve initial handshake simülasyonu (100-200ms)
        await artificialDelay(100 + Math.random() * 100);

        const data = await request.arrayBuffer();
        const fileSizeInBytes = data.byteLength;

        // Dosya boyutuna göre minimum süre hesaplama (1MB = en az 1 saniye)
        const minTimeInSeconds = (fileSizeInBytes / (1024 * 1024));

        // Network koşullarına göre ek gecikme (dosya boyutunun %20-40'ı kadar)
        const additionalDelay = minTimeInSeconds * (0.2 + Math.random() * 0.2) * 1000;
        await artificialDelay(additionalDelay);

        const end = performance.now();
        const durationInSeconds = (end - start) / 1000;

        // Gerçekçi bir upload hızı hesaplaması
        // 1. Network overhead ve protokol yükü (40%)
        const adjustedDuration = durationInSeconds * 1.4;

        // 2. TCP/IP ve diğer protokol overhead'leri için dosya boyutunu ayarla
        const adjustedSize = fileSizeInBytes * 1.1; // 10% ek protokol verisi

        // 3. Hız hesaplaması (bits per second)
        const bitsPerSecond = (adjustedSize * 8) / adjustedDuration;

        // 4. Mbps'ye çevirme ve daha gerçekçi hız sınırlaması (maksimum 20 Mbps)
        const megabitsPerSecond = Math.min((bitsPerSecond / 1_000_000), 20);

        // 5. Gerçekçi network koşulları simülasyonu
        // - Base speed: maksimum hızın %60-80'i arasında
        const baseSpeed = megabitsPerSecond * (0.6 + Math.random() * 0.2);

        // - Network jitter ve latency simülasyonu (±15%)
        const variance = baseSpeed * 0.15;
        const finalSpeed = baseSpeed + (Math.random() * variance * 2 - variance);

        return NextResponse.json({
            success: true,
            speed: finalSpeed,
            size: fileSizeInBytes,
            duration: adjustedDuration
        });
    } catch (error) {
        console.error('Upload test error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 