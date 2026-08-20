import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name in interfaces) {
    for (const net of interfaces[name] || []) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }

  // Fallback to localhost if no LAN interface found
  const primaryIp = addresses.length > 0 ? addresses[0] : 'localhost';

  return NextResponse.json({
    primaryIp,
    addresses,
    port: 3000,
  });
}
