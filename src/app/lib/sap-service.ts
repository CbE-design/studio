'use server';

/**
 * @fileOverview SAP NetWeaver / ERP Service Bridge
 * Handles OData integration and ledger reconciliation with SAP S/4HANA or ERP systems.
 * 
 * TO GO LIVE:
 * 1. Configure SAP_ERP_URL and SAP_ERP_KEY in .env
 * 2. Ensure your hosting environment has network access to the SAP NetWeaver Gateway.
 * 3. Implement mTLS (Mutual TLS) if required by your bank's security policy.
 */

export type SapStatus = {
  connected: boolean;
  system: string;
  synced: boolean;
  lastLedgerUpdate: string;
  gatewayVersion: string;
};

export async function getSapSystemStatus(): Promise<SapStatus> {
  const apiUrl = process.env.SAP_ERP_URL;
  
  if (!apiUrl) {
    // Simulated SAP NetWeaver Gateway response
    return {
      connected: true,
      system: 'SAP S/4HANA (NetWeaver 7.5)',
      synced: true,
      lastLedgerUpdate: new Date().toISOString(),
      gatewayVersion: 'OData v2.0',
    };
  }

  try {
    const response = await fetch(`${apiUrl}/sap/opu/odata/health`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.SAP_ERP_KEY || '').toString('base64')}`,
        'Accept': 'application/json'
      }
    });
    
    return {
      connected: response.ok,
      system: 'SAP NetWeaver Gateway',
      synced: response.ok,
      lastLedgerUpdate: new Date().toISOString(),
      gatewayVersion: 'OData v4.0',
    };
  } catch (error) {
    console.error('[SAP Status Error]', error);
    return {
      connected: false,
      system: 'SAP Connectivity Error',
      synced: false,
      lastLedgerUpdate: '--',
      gatewayVersion: '--',
    };
  }
}

/**
 * Registers a transaction on the real SAP General Ledger.
 * This is the function that officially records the money movement.
 */
export async function syncTransactionToSap(transactionId: string): Promise<boolean> {
  console.log(`[SAP Bridge] Initiating Ledger Sync for: ${transactionId}`);
  
  const apiUrl = process.env.SAP_ERP_URL;
  if (!apiUrl) {
    // Simulation mode
    await new Promise(r => setTimeout(r, 800));
    return true;
  }

  try {
    const response = await fetch(`${apiUrl}/sap/opu/odata/sap/API_JOURNAL_ENTRY_CREATE_P/JournalEntryBulkCreateConf`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.SAP_ERP_KEY || '').toString('base64')}`,
        'Content-Type': 'application/json',
        'x-csrf-token': 'fetch'
      },
      body: JSON.stringify({
        JournalEntry: {
          OriginalReferenceDocument: transactionId,
          BusinessTransactionType: 'RFBU',
          CompanyCode: '1000',
          DocumentDate: new Date().toISOString(),
          PostingDate: new Date().toISOString(),
        }
      })
    });

    return response.ok;
  } catch (error) {
    console.error('[SAP Ledger Sync Failed]', error);
    return false;
  }
}
