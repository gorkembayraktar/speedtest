import React, { useEffect, useRef } from 'react';

interface SpeedometerProps {
    value: number;
    maxValue: number;
    phase: 'idle' | 'ping' | 'download' | 'upload';
}

const Speedometer: React.FC<SpeedometerProps> = ({ value, maxValue, phase }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Get color based on phase
    const getColor = () => {
        switch (phase) {
            case 'download':
                return {
                    primary: '#60A5FA',
                    secondary: '#2563EB',
                    accent: '#1D4ED8',
                    glow: '#3B82F6',
                    gradient: ['#60A5FA', '#2563EB', '#1D4ED8']
                };
            case 'upload':
                return {
                    primary: '#4ADE80',
                    secondary: '#16A34A',
                    accent: '#15803D',
                    glow: '#22C55E',
                    gradient: ['#4ADE80', '#16A34A', '#15803D']
                };
            default:
                return {
                    primary: '#94A3B8',
                    secondary: '#475569',
                    accent: '#334155',
                    glow: '#64748B',
                    gradient: ['#94A3B8', '#475569', '#334155']
                };
        }
    };

    const drawSpeedometer = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size with device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        const size = 420;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.35;

        const minAngle = -120 * (Math.PI / 180);
        const maxAngle = 120 * (Math.PI / 180);
        const range = maxAngle - minAngle;
        const percentage = Math.min(value / maxValue, 1);
        const currentAngle = minAngle + (range * percentage);

        const colors = getColor();

        // Draw outer glow
        const glowGradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.8,
            centerX, centerY, radius + 30
        );
        glowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        glowGradient.addColorStop(0.5, `${colors.glow}11`);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 30, 0, 2 * Math.PI);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Draw background
        const bgGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius + 10
        );
        bgGradient.addColorStop(0, '#1F2937');
        bgGradient.addColorStop(1, '#030712');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
        ctx.fillStyle = bgGradient;
        ctx.fill();

        // Draw ticks and numbers
        const drawTick = (value: number, angle: number, type: 'major' | 'medium' | 'minor') => {
            const startRadius = radius + 2;
            const endRadius = radius + (type === 'major' ? 18 : type === 'medium' ? 12 : 8);
            const isActive = value <= percentage * maxValue;

            const startX = centerX + Math.cos(angle) * startRadius;
            const startY = centerY + Math.sin(angle) * startRadius;
            const endX = centerX + Math.cos(angle) * endRadius;
            const endY = centerY + Math.sin(angle) * endRadius;

            // Draw tick glow for active ticks
            if (isActive && type !== 'minor') {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = colors.glow + '33';
                ctx.lineWidth = type === 'major' ? 4 : 2;
                ctx.stroke();
            }

            // Draw tick line
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = isActive ? colors.primary : 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = type === 'major' ? 2 : 1;
            ctx.stroke();

            // Draw number for major ticks or specific values
            if (type === 'major' || value === 0 || value === 10 || value === 25 || value === 50 || value === 75) {
                const textRadius = endRadius + 25;
                const textX = centerX + Math.cos(angle) * textRadius;
                const textY = centerY + Math.sin(angle) * textRadius;

                ctx.save();
                ctx.translate(textX, textY);
                ctx.rotate(Math.PI / 2);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = isActive ? colors.primary : 'rgba(255, 255, 255, 0.3)';
                ctx.font = `${type === 'major' ? 'bold' : 'normal'} 11px Inter, sans-serif`;

                // Draw text glow for active values
                if (isActive) {
                    ctx.shadowColor = colors.glow;
                    ctx.shadowBlur = 5;
                }

                ctx.fillText(value.toString(), 0, 0);
                ctx.restore();
            }
        };

        // Draw ticks
        if (maxValue === 100) {
            // Upload mode: 0-100 Mbps with more detailed ticks
            for (let i = 0; i <= maxValue; i += 5) {
                const angle = minAngle + (range * (i / maxValue));
                const type = i % 25 === 0 ? 'major' : i % 10 === 0 ? 'medium' : 'minor';
                drawTick(i, angle, type);
            }
        } else {
            // Download mode: 0-1024 Mbps
            const majorTicks = [0, 128, 256, 384, 512, 640, 768, 896, 1024];
            const mediumTicks = [64, 192, 320, 448, 576, 704, 832, 960];

            // Draw minor ticks
            for (let i = 0; i <= maxValue; i += 32) {
                const angle = minAngle + (range * (i / maxValue));
                if (!majorTicks.includes(i) && !mediumTicks.includes(i)) {
                    drawTick(i, angle, 'minor');
                }
            }

            // Draw medium ticks
            for (const value of mediumTicks) {
                const angle = minAngle + (range * (value / maxValue));
                drawTick(value, angle, 'medium');
            }

            // Draw major ticks
            for (const value of majorTicks) {
                const angle = minAngle + (range * (value / maxValue));
                drawTick(value, angle, 'major');
            }
        }

        // Draw speed arc background
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 5, minAngle, maxAngle, false);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Draw speed arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 5, minAngle, currentAngle, false);
        const arcGradient = ctx.createLinearGradient(
            centerX + Math.cos(minAngle) * radius,
            centerY + Math.sin(minAngle) * radius,
            centerX + Math.cos(maxAngle) * radius,
            centerY + Math.sin(maxAngle) * radius
        );
        arcGradient.addColorStop(0, colors.gradient[0]);
        arcGradient.addColorStop(0.5, colors.gradient[1]);
        arcGradient.addColorStop(1, colors.gradient[2]);

        ctx.strokeStyle = arcGradient;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw needle shadow
        const needleLength = radius - 20;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(currentAngle) * needleLength,
            centerY + Math.sin(currentAngle) * needleLength
        );
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw needle
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(currentAngle) * needleLength,
            centerY + Math.sin(currentAngle) * needleLength
        );
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw needle head
        const needleX = centerX + Math.cos(currentAngle) * needleLength;
        const needleY = centerY + Math.sin(currentAngle) * needleLength;

        ctx.beginPath();
        ctx.arc(needleX, needleY, 4, 0, 2 * Math.PI);
        ctx.fillStyle = colors.primary;
        ctx.fill();

        // Draw center hub
        const hubGradient = ctx.createRadialGradient(
            centerX - 3, centerY - 3, 0,
            centerX, centerY, 15
        );
        hubGradient.addColorStop(0, colors.gradient[0]);
        hubGradient.addColorStop(0.7, colors.gradient[1]);
        hubGradient.addColorStop(1, colors.gradient[2]);

        ctx.beginPath();
        ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
        ctx.fillStyle = hubGradient;
        ctx.fill();
    };

    useEffect(() => {
        drawSpeedometer();
    }, [value, phase]);

    return (
        <div className="relative w-[420px] h-[420px] mx-auto">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ width: '420px', height: '420px', rotate: '-90deg' }}
            />
            <div className="absolute left-1/2 top-[58%] transform -translate-x-1/2 text-center">
                <div
                    className="text-6xl font-bold mb-1 transition-all duration-300"
                    style={{
                        color: getColor().primary,
                        textShadow: `0 0 20px ${getColor().glow}66`
                    }}
                >
                    {value.toFixed(1)}
                </div>
                <div className="text-sm text-gray-400 font-medium tracking-wider">Mbps</div>
                <div
                    className="text-xs font-medium mt-2 tracking-wider transition-all duration-300"
                    style={{ color: getColor().primary }}
                >
                    {phase === 'idle' ? 'READY' : phase.toUpperCase()}
                </div>
            </div>
        </div>
    );
};

export default Speedometer; 