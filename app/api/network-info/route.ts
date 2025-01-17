import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Get client IP from request headers
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');

        // For localhost development
        const isDevelopment = process.env.NODE_ENV === 'development';
        const ip = isDevelopment ? '127.0.0.1' : (forwardedFor ? forwardedFor.split(',')[0] : realIp);

        if (!ip) {
            throw new Error('Could not determine client IP address');
        }

        // For localhost, return development environment info
        if (isDevelopment) {
            return NextResponse.json({
                ip: '127.0.0.1',
                isp: 'Development Environment',
                dataCenter: 'Local Server',
                success: true
            });
        }

        // Fetch server location using Vercel env variables or a default location
        const dataCenter = process.env.VERCEL_REGION || 'Unknown Region';

        // Fetch ISP information using the client IP
        const ispResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,isp,org`);
        if (!ispResponse.ok) {
            throw new Error('Failed to fetch ISP information');
        }
        const ispData = await ispResponse.json();

        if (ispData.status === 'fail') {
            throw new Error(ispData.message || 'IP-API request failed');
        }

        return NextResponse.json({
            ip: ip,
            isp: ispData.isp || "Unknown ISP",
            dataCenter: dataCenter,
            success: true
        });
    } catch (error) {
        console.error('Network info error:', error);
        return NextResponse.json({
            ip: "Unknown",
            isp: "Unknown ISP",
            dataCenter: "Unknown",
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch network information'
        });
    }
} 