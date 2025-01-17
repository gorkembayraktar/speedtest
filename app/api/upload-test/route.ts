import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Maksimum dosya boyutu kontrolü (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

export async function POST(request: NextRequest) {
    try {
        const contentLength = parseInt(request.headers.get('content-length') || '0', 10);

        // Dosya boyutu kontrolü
        if (contentLength > MAX_FILE_SIZE) {
            return NextResponse.json({
                success: false,
                error: 'File size exceeds the maximum limit of 50MB'
            }, { status: 413 });
        }

        // Dosya boyutuna göre simüle edilmiş hız hesaplama
        const data = await request.arrayBuffer();
        const fileSizeInBytes = data.byteLength;
        const fileSizeMB = fileSizeInBytes / (1024 * 1024);

        // Dosya boyutuna göre baz hız belirleme
        // - 1MB için ~2Mbps
        // - 5MB için ~8Mbps
        // - 10MB için ~12Mbps
        // - 25MB için ~15Mbps
        let baseMbps;
        if (fileSizeMB <= 1) {
            baseMbps = 2;
        } else if (fileSizeMB <= 5) {
            baseMbps = 8;
        } else if (fileSizeMB <= 10) {
            baseMbps = 12;
        } else {
            baseMbps = 15;
        }

        // Gerçekçi network koşulları simülasyonu (±20% varyasyon)
        const variance = baseMbps * 0.2;
        const finalSpeed = Math.max(
            Math.min(
                baseMbps + (Math.random() * variance * 2 - variance),
                20 // maksimum 20Mbps
            ),
            1 // minimum 1Mbps
        );

        // Network overhead simülasyonu (10-30% daha yavaş)
        const adjustedSpeed = finalSpeed * (0.7 + Math.random() * 0.2);

        // Simüle edilmiş süre (saniye)
        // Küçük dosyalar için minimum süre daha az, büyük dosyalar için daha fazla
        const minDuration = Math.max(fileSizeMB * 0.5, 1); // Her MB için en az 0.5 saniye
        const calculatedDuration = (fileSizeInBytes * 8) / (adjustedSpeed * 1_000_000);
        const simulatedDuration = Math.max(calculatedDuration, minDuration);

        return NextResponse.json({
            success: true,
            speed: adjustedSpeed,
            size: fileSizeInBytes,
            duration: simulatedDuration
        });
    } catch (error) {
        console.error('Upload test error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 