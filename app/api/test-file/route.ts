import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simulated network conditions
const NETWORK_CONDITIONS = {
  LATENCY_MIN: 5,    // Minimum latency in ms
  LATENCY_MAX: 20,   // Maximum latency in ms
  JITTER_MIN: 1,     // Minimum jitter in ms
  JITTER_MAX: 5,     // Maximum jitter in ms
  DOWNLOAD_SPEED: {
    MIN: 45,       // Minimum speed in Mbps
    MAX: 65,       // Maximum speed in Mbps
    VARIANCE: 0.15 // 15% variance
  }
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export async function HEAD() {
  // Calculate base latency
  const baseLatency = getRandomInRange(NETWORK_CONDITIONS.LATENCY_MIN, NETWORK_CONDITIONS.LATENCY_MAX);

  // Add jitter
  const jitter = getRandomInRange(NETWORK_CONDITIONS.JITTER_MIN, NETWORK_CONDITIONS.JITTER_MAX);
  const totalLatency = baseLatency + (Math.random() > 0.5 ? jitter : -jitter);

  await sleep(Math.max(1, totalLatency));

  return new Response(null, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Base-Latency': baseLatency.toString(),
      'X-Jitter': jitter.toString()
    },
  });
}

export async function GET() {
  const size = 2 * 1024 * 1024; // 2MB chunks
  const buffer = new Uint8Array(size);

  // Add base latency
  const latency = getRandomInRange(NETWORK_CONDITIONS.LATENCY_MIN, NETWORK_CONDITIONS.LATENCY_MAX);
  await sleep(latency);

  // Calculate speed with variance
  const baseSpeed = NETWORK_CONDITIONS.DOWNLOAD_SPEED.MIN +
    Math.random() * (NETWORK_CONDITIONS.DOWNLOAD_SPEED.MAX - NETWORK_CONDITIONS.DOWNLOAD_SPEED.MIN);
  const variance = baseSpeed * NETWORK_CONDITIONS.DOWNLOAD_SPEED.VARIANCE * (Math.random() * 2 - 1);
  const speed = Math.max(NETWORK_CONDITIONS.DOWNLOAD_SPEED.MIN, baseSpeed + variance);

  // Calculate delay based on speed
  const bits = size * 8;
  const megabits = bits / 1_000_000;
  const seconds = megabits / speed;
  const delay = seconds * 1000; // Convert to milliseconds

  await sleep(delay);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'no-store',
    },
  });
}