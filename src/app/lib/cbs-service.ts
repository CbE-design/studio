'use server';

import type { CbsStatus } from './definitions';

/**
 * @fileOverview CBS Service Bridge (Live Integration)
 * This service handles standardized communication with the Core Banking System.
 * To enable real-time mode, set CBS_API_URL and CBS_API_KEY in your .env file.
 */

export async function getCbsSystemStatus(): Promise<CbsStatus> {
  const apiUrl = process.env.CBS_API_URL;
  const startTime = Date.now();

  if (!apiUrl) {
    // Fallback to simulated data if no endpoint is configured
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      connected: true,
      systemName: 'Oracle FLEXCUBE (Simulated)',
      latency: '34ms',
      lastSync: new Date().toISOString(),
      environment: 'Mock',
      isoReadiness: 'Active'
    };
  }

  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.CBS_API_KEY || '',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    const latency = `${Date.now() - startTime}ms`;

    if (response.ok) {
      const data = await response.json();
      return {
        connected: true,
        systemName: data.systemName || 'Production Gateway',
        latency,
        lastSync: new Date().toISOString(),
        environment: 'Production',
        isoReadiness: 'Active'
      };
    }

    throw new Error('CBS Node Unreachable');
  } catch (error) {
    console.error('CBS Connection Error:', error);
    return {
      connected: false,
      systemName: 'Network Error',
      latency: '--',
      lastSync: new Date().toISOString(),
      environment: 'Production',
      isoReadiness: 'Legacy'
    };
  }
}

export async function triggerCbsHandshake(): Promise<{ success: boolean; message: string }> {
  const apiUrl = process.env.CBS_API_URL;

  if (!apiUrl) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, message: 'Simulated handshake successful. ISO 20022 pacs.008 schema validated.' };
  }

  try {
    const response = await fetch(`${apiUrl}/auth/handshake`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CBS_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      return { success: true, message: 'Live CBS Handshake successful.' };
    }
    return { success: false, message: 'Handshake rejected by host.' };
  } catch (error) {
    return { success: false, message: 'Failed to reach CBS gateway.' };
  }
}

export async function fetchCbsAccountBalance(accountNumber: string): Promise<number> {
  const apiUrl = process.env.CBS_API_URL;

  if (!apiUrl) {
    // In a prototype, we return a high-value balance for the investment account to show liquidity
    if (accountNumber === '111122223333') return 18502191.17;
    return 0;
  }

  const response = await fetch(`${apiUrl}/ledger/balance?account=${accountNumber}`, {
    headers: { 'X-API-Key': process.env.CBS_API_KEY || '' }
  });
  
  const data = await response.json();
  return data.balance;
}
