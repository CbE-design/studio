

/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/onCall");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require('firebase-functions/v2');
const { onUserCreate } = require('firebase-functions/v2/auth');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set global options for functions (e.g., region, memory)
setGlobalOptions({ region: 'us-central1' });

// This is the specific list of transactions to be seeded into the Savvy Bundle Current Account.
const initialSavvyBundleTransactions = [
    { timestamp: new Date('2022-09-29'), description: 'BANKING FEE', amount: '-R23987.87', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-01'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-01'), description: 'Hantie lening', amount: '+R20000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-01'), description: 'Hantie lening', amount: '+R10000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-01'), description: 'A DE KLERK', amount: '-R2000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-01'), description: 'TIME SQUARE PR377121716833693', amount: '-R8000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-01'), description: 'PNP CRP WONDER377121716833693', amount: '-R1535.76', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-01'), description: 'CLTX DOORNPOOR377121716833693', amount: '-R739.37', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-01'), description: 'HTTPS://WWW.UB377121716833693', amount: '-R665.10', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-01'), description: 'DATA KINGS 377121716833693', amount: '-R500.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-01'), description: 'DOORNPOORTMOTO377121716833693', amount: '-R436.89', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-01'), description: 'NEDBANK SEND-IMALI', amount: '-R15.00', transactionType: 'EFT_IMMEDIATE' },
    { timestamp: new Date('2022-10-01'), description: 'ATM BIDVES 0930 0346 BALANCE', amount: '-R10.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-01'), description: 'INSTANT PAYMENT FEE', amount: '-R10.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-03'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'Hantie lening', amount: '+R20000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('22022-10-03'), description: 'Hantie lening', amount: '+R15000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'Hantie lening', amount: '+R1500.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'BLOM', amount: '-R5000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'H.NEL', amount: '-R4000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'H.NEL', amount: '-R3000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'H.NEL', amount: '-R100.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'VODACOM AIRTIME T +27791778894', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'SASW CASH 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-03'), description: 'SASW CASH 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-03'), description: 'SASW CASH 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-03'), description: 'SASW CASH 377121716833693', amount: '-R4900.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-03'), description: 'SASW CASH 377121716833693', amount: '-R4000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-03'), description: 'TIME SQUARE PR377121716833693', amount: '-R20000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'TIME SQUARE PR377121716833693', amount: '-R18000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'PEERMONT GLOBA377121716833693', amount: '-R15000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'TIME SQUARE PR377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'PEERMONT GLOBA377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'PEERMONT GLOBA377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'AE AMANDELBOOM377121716833693', amount: '-R1077.43', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'CLTX DOORNPOOR377121716833693', amount: '-R189.92', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'INSTANT PAYMENT FEE', amount: '-R69.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-03'), description: 'POS PEERMO 1001 2345 INS FUNDS', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-03'), description: 'POS PEERMO 1003 0138 INS FUNDS', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-03'), description: 'POS PEERMO 1003 0140 INS FUNDS', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-04'), description: 'SASW CASH 377121716833693', amount: '-R1000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-04'), description: 'PEERMONT GLOBA377121716833693', amount: '-R15000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'PEERMONT GLOBA377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'PEERMONT METCO377121716833693', amount: '-R2932.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'PEERMONT METCO377121716833693', amount: '-R2932.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'PEERMONT GLOBA377121716833693', amount: '-R2000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'PEERMONT GLOBA377121716833693', amount: '-R300.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'UBER EATS 3D 377121716833693', amount: '-R66.51', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'NEDBANK SEND-IMALI', amount: '-R15.00', transactionType: 'EFT_IMMEDIATE' },
    { timestamp: new Date('2022-10-04'), description: 'PREPAID AIRTIME', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-05'), description: 'CORRIE', amount: '+R420000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-05'), description: 'BR CASH R420000.00 FEE', amount: '-R9660.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-05'), description: 'CASH TRANSACTION FEE', amount: '-R80.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-05'), description: 'OOM DANNA', amount: '-R20000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-05'), description: 'VODACOM AIRTIME TOP 0608797671', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-05'), description: 'PAYFLEX 5181030004835796', amount: '-R1499.95', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-05'), description: 'INSTANT PAYMENT FEE', amount: '-R49.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-06'), description: 'SASW CASH 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-06'), description: 'SASW CASH 377121716833693', amount: '-R4500.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-06'), description: 'TOP VENDING P377121716833693', amount: '-R170.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-06'), description: 'TOP VENDING P377121716833693', amount: '-R140.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-06'), description: 'TOP VENDING P377121716833693', amount: '-R40.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-06'), description: 'TOP VENDING P377121716833693', amount: '-R30.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-06'), description: 'TOP VENDING P377121716833693', amount: '-R17.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-06'), description: 'TOP VENDING P377121716833693', amount: '-R17.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-06'), description: 'HANTIE', amount: '-R100000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-06'), description: 'W.JOUBERT', amount: '-R29000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-06'), description: 'PREPAID AIRTIME', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-07'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-07'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-07'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-07'), description: 'JADE', amount: '-R5000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-07'), description: 'H.NEL', amount: '-R5000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-07'), description: 'VODACOM AIRTIME TOP 0608797671', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'PEERMONT GLOBA377121716833693', amount: '-R40000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'PEERMONT GLOBA377121716833693', amount: '-R40000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'PEERMONT GLOBA377121716833693', amount: '-R30000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'PEERMONT GLOBA377121716833693', amount: '-R30000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'PEERMONT GLOBA377121716833693', amount: '-R30000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'PEERMONT GLOBA377121716833693', amount: '-R30000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'PEERMONT GLOBA377121716833693', amount: '-R30000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'PEERMONT GLOBA377121716833693', amount: '-R25000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'PEERMONT GLOBA377121716833693', amount: '-R25000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'PEERMONT GLOBA377121716833693', amount: '-R20000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'PEERMONT GLOBA377121716833693', amount: '-R1500.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'INSTANT PAYMENT FEE', amount: '-R98.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-08'), description: 'Hantie lening', amount: '+R10000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-08'), description: 'VODACOM AIRTIME TOP 0608797671', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-08'), description: 'SASW CASH 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-08'), description: 'SASW CASH 377121716833693', amount: '-R4900.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-08'), description: 'PEERMONT GLOBA377121716833693', amount: '-R20000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-08'), description: 'PEERMONT GLOBA377121716833693', amount: '-R7000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-08'), description: 'PREPAID AIRTIME', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-10'), description: 'Hantie lening', amount: '+R40000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-10'), description: 'J VAN NIEKERK', amount: '+R700.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-10'), description: 'ANNA', amount: '-R1000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-10'), description: 'SASW CASH 377121716833693', amount: '-R4000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-10'), description: 'SASW CASH 377121716833693', amount: '-R4000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-10'), description: 'SASW CASH 377121716833693', amount: '-R4000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-10'), description: 'SASW CASH 377121716833693', amount: '-R4000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-10'), description: 'SASW CASH 377121716833693', amount: '-R1900.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-10'), description: 'SASW CASH 377121716833693', amount: '-R1000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-10'), description: 'PEERMONT D ORE377121716833693', amount: '-R2740.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-10'), description: 'PEERMONT GLOBA377121716833693', amount: '-R800.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-10'), description: 'PEERMONT GLOBA377121716833693', amount: '-R300.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-10'), description: 'PREPAID AIRTIME', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-11'), description: 'WYNAND', amount: '+R5000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-11'), description: 'Hantie lening', amount: '+R1300.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-11'), description: 'VODACOM AIRTIME TOP 0608797671', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'SASW CASH 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-11'), description: 'SASW CASH 377121716833693', amount: '-R900.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-11'), description: 'PEERMONT GLOBA377121716833693', amount: '-R13000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'PEERMONT GLOBA377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'NFS EASTPOINT377121716833693', amount: '-R1499.95', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'FORTUNA POKER 377121716833693', amount: '-R700.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'PEERMONT GLOBA377121716833693', amount: '-R600.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'NEDBANK SEND-IMALI', amount: '-R10.00', transactionType: 'EFT_IMMEDIATE' },
    { timestamp: new Date('2022-10-11'), description: 'POS PEERMO 1011 0146 INS FUNDS', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-11'), description: 'POS PEERMO 1011 0147 INS FUNDS', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-11'), description: 'POS PEERMO 1011 0156 INS FUNDS', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-12'), description: 'Hantie lening', amount: '+R15000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-12'), description: 'Hantie lening', amount: '+R15000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-12'), description: 'Hantie lening', amount: '+R10000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-12'), description: 'WYNKAS', amount: '-R3000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-12'), description: 'H.NEL', amount: '-R1000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-12'), description: 'MICKY', amount: '-R400.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-12'), description: 'VODACOM AIRTIME TOP 0608797671', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'SASW CASH 377121716833693', amount: '-R4900.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-12'), description: 'ATM CASH 377121716833693', amount: '-R3500.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-12'), description: 'ATM CASH 377121716833693', amount: '-R2000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-12'), description: 'TIME SQUARE PR377121716833693', amount: '-R20000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'PEERMONT GLOBA377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'PEERMONT GLOBA377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'PEERMONT GLOBA377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'PEERMONT METCO377121716833693', amount: '-R4620.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'INSTANT PAYMENT FEE', amount: '-R30.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-12'), description: 'ATM F.N.B. 1011 0140 BALANCE', amount: '-R10.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-12'), description: 'PREPAID AIRTIME', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'POS TIME S 1012 1005 INS FUNDS', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-13'), description: 'Hantie lening', amount: '+R500.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-13'), description: 'PREPAID AIRTIME', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-14'), description: 'ATM CASH 377121716833693', amount: '-R500.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-15'), description: 'Hantie lening', amount: '+R1000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-15'), description: 'Hantie lening', amount: '+R1000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-15'), description: 'A DE KLERK', amount: '-R500.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-15'), description: 'SASW CASH 377121716833693', amount: '-R1500.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-15'), description: 'INSTANT PAYMENT FEE', amount: '-R10.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-17'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'Hantie lening', amount: '+R15000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'Hantie lening', amount: '+R7000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'Hantie lening', amount: '+R2000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'H.NEL', amount: '-R6000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'H.NEL', amount: '-R2000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'WYNKAS', amount: '-R2000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'CAPI', amount: '-R1000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'H.NEL', amount: '-R1000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'M', amount: '-R300.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'B', amount: '-R100.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'SASW CASH 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-17'), description: 'ATM CASH 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-17'), description: 'ATM CASH 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-17'), description: 'SASW CASH 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-17'), description: 'ATM CASH 377121716833693', amount: '-R2000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-17'), description: 'SASW CASH 377121716833693', amount: '-R1900.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-17'), description: 'SASW CASH 377121716833693', amount: '-R300.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-17'), description: 'PEERMONT GLOBA377121716833693', amount: '-R9000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-17'), description: 'PEERMONT GLOBA377121716833693', amount: '-R5000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-17'), description: 'DOORNPOORTMOTO377121716833693', amount: '-R661.96', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-17'), description: 'DOORNPOORTMOTO377121716833693', amount: '-R637.99', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-17'), description: 'PEERMONT GLOBA377121716833693', amount: '-R500.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-17'), description: 'INSTANT PAYMENT FEE', amount: '-R79.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-18'), description: 'VODACOM AIRTIME TOP 0608797671', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-18'), description: 'ATM CASH 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-18'), description: 'ATM CASH 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-18'), description: 'ATM CASH 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-18'), description: 'MAKRO WONDERBO377121716833693', amount: '-R9594.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-18'), description: 'TIME SQUARE MA377121716833693', amount: '-R5000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-18'), description: 'TIME SQUARE PR377121716833693', amount: '-R3000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-18'), description: 'MAKRO WONDERBO377121716833693', amount: '-R624.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-18'), description: 'NEDBANK SEND-IMALI', amount: '-R10.00', transactionType: 'EFT_IMMEDIATE' },
    { timestamp: new Date('2022-10-18'), description: 'NEDBANK SEND-IMALI', amount: '-R10.00', transactionType: 'EFT_IMMEDIATE' },
    { timestamp: new Date('2022-10-18'), description: 'NEDBANK SEND-IMALI', amount: '-R10.00', transactionType: 'EFT_IMMEDIATE' },
    { timestamp: new Date('2022-10-19'), description: 'PREPAID AIRTIME', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-20'), description: 'Hantie lening', amount: '+R55000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-20'), description: 'December - 2060973570', amount: '+R200.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-20'), description: 'HANTIE', amount: '-R10000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-20'), description: 'ATM CASH 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-20'), description: 'ATM CASH 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-20'), description: 'ATM CASH 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-20'), description: 'ATM CASH 377121716833693', amount: '-R400.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-20'), description: 'INSTANT PAYMENT FEE', amount: '-R49.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-21'), description: 'WYNKAS', amount: '-R10000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-21'), description: 'INTERACCOUNT TRANSFER FROM JUST INVEST', amount: '+R18949581.42', transactionType: 'EFT_STANDARD' },
];

/**
 * Triggered when a new user is created in Firebase Authentication.
 * This function creates a corresponding user document in Firestore,
 * along with sample bank accounts and detailed transaction history for one account.
 */
exports.provisionNewUser = onUserCreate(async (event) => {
  const user = event.data;
  const { uid, email } = user;
  const db = admin.firestore();

  try {
    // Create the main user document
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.set({
      id: uid,
      email: email,
      firstName: 'Van Schalkwyk',
      lastName: 'Family Trust',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Successfully created user document for: ${uid}`);

    const accountsCollectionRef = userDocRef.collection('bankAccounts');

    // Create sample accounts
    const savvyAccountRef = accountsCollectionRef.doc();
    const savingsAccountRef = accountsCollectionRef.doc();
    const creditAccountRef = accountsCollectionRef.doc();

    let savvyBalance = 0; // Start with a zero balance

    // Seed transactions for the Savvy Bundle account
    const savvyTransactionsBatch = db.batch();
    const transactionsCollectionRef = savvyAccountRef.collection('transactions');

    initialSavvyBundleTransactions.forEach(tx => {
      const isCredit = tx.amount.startsWith('+');
      const numericAmount = parseFloat(tx.amount.replace(/[+R,]/g, ''));
      
      if (!isNaN(numericAmount)) {
        if (isCredit) {
          savvyBalance += numericAmount;
        } else {
          savvyBalance -= numericAmount;
        }

        const newTransactionRef = transactionsCollectionRef.doc();
        savvyTransactionsBatch.set(newTransactionRef, {
          id: newTransactionRef.id,
          userId: uid,
          date: tx.timestamp.toISOString(),
          description: tx.description,
          amount: numericAmount,
          type: isCredit ? 'credit' : 'debit',
          transactionType: tx.transactionType,
          recipientReference: tx.user_reference || null
        });
      }
    });

    // Commit the transactions batch first
    await savvyTransactionsBatch.commit();
    console.log(`Successfully seeded ${initialSavvyBundleTransactions.length} transactions for Savvy account.`);

    // Now create the accounts with the calculated balance
    const accountsBatch = db.batch();
    
    accountsBatch.set(savvyAccountRef, {
      name: 'Savvy Bundle Current Account',
      type: 'Cheque',
      accountNumber: '1234567890',
      balance: savvyBalance,
      currency: 'ZAR',
      userId: uid,
    });

    accountsBatch.set(savingsAccountRef, {
      name: 'Savings Account',
      type: 'Savings',
      accountNumber: '0987654321',
      balance: 0.00,
      currency: 'ZAR',
      userId: uid,
    });

    accountsBatch.set(creditAccountRef, {
      name: 'Gold Credit Card',
      type: 'Credit',
      accountNumber: '5555666677778888',
      balance: 0.00,
      currency: 'ZAR',
      userId: uid,
    });

    // Commit the accounts batch
    await accountsBatch.commit();
    console.log(`Successfully provisioned sample accounts for user: ${uid}`);

  } catch (error) {
    console.error(`Failed to provision new user ${uid}:`, error);
  }

  return null;
});

    

    