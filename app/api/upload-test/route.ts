import { NextRequest, NextResponse } from 'next/server';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '100mb'
        },
        responseLimit: '100mb'
    }
};

export async function POST(request: NextRequest) {
    try {
        const start = performance.now();
        const data = await request.arrayBuffer();
        const end = performance.now();

        const fileSizeInBytes = data.byteLength;
        const durationInSeconds = (end - start) / 1000;
        const bitsPerSecond = (fileSizeInBytes * 8) / durationInSeconds;
        const megabitsPerSecond = bitsPerSecond / 1_000_000;

        return NextResponse.json({
            success: true,
            speed: megabitsPerSecond,
            size: fileSizeInBytes,
            duration: durationInSeconds
        });
    } catch (error) {
        console.error('Upload test error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 