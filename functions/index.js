
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Resend } = require('resend');
const { Vonage } = require('@vonage/server-sdk');

admin.initializeApp();
const db = admin.firestore();

// ---- Callable Functions (v1 Syntax) ----

exports.sendEmail = functions.region('us-central1').https.onCall(async (data, context) => {
    const { to, subject, html, attachments } = data;
    
    if (!to || !subject || !html) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Missing required fields: to, subject, and html.'
        );
    }
    
    const fromName = "Nedbank";
    const fromEmail = process.env.MAIL_FROM || 'noreply@notificationsnedbank.com';
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
        console.error('Email service not configured. RESEND_API_KEY is missing.');
        throw new functions.https.HttpsError('failed-precondition', 'Email service not configured.');
    }
    const resend = new Resend(resendApiKey);

    const signatureHtml = `
      <br><br>
      <div style="font-family: Arial, sans-serif; font-size: 12px; color: #555555; border-top: 1px solid #dddddd; padding-top: 15px; margin-top: 20px;">
        <img src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.png?alt=media&token=9c75c65e-fc09-4827-9a36-91caa0ae3ee5" alt="Nedbank Logo" width="100" style="margin-bottom: 10px;" />
        <p style="margin: 0;"><strong>Nedbank Digital Team</strong></p>
        <p style="font-size: 10px; color: #777777; margin: 5px 0 0 0;">
          Nedbank Ltd Reg No 1951/000009/06. Licensed financial services provider (FSP9363) and registered credit provider (NCRCP16).
        </p>
        <p style="font-size: 10px; color: #777777; margin-top: 5px;">
            This email and any accompanying attachments may contain confidential and proprietary information. This information is private and protected by law and, accordingly, if you are not the intended recipient, you are requested to delete this entire communication immediately and are notified that any disclosure, copying or distribution of or taking any action based on this information is prohibited.
        </p>
      </div>
    `;

    const fullHtml = `${html}${signatureHtml}`;

    try {
        const emailPayload = {
            from: `"${fromName}" <${fromEmail}>`,
            to: to,
            subject: subject,
            html: fullHtml,
            attachments: attachments || [],
        };
        await resend.emails.send(emailPayload);
        console.log(`Email sent successfully to ${to}`);
        return { success: true, message: 'Email sent successfully.' };
    } catch (error) {
        console.error('Error sending email with Resend:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send email.', error.message);
    }
});


exports.addBeneficiary = functions.region('us-central1').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const uid = context.auth.uid;
    const { name, bank, accountNumber } = data;

    if (!name || !bank || !accountNumber) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required beneficiary details: name, bank, and accountNumber.');
    }

    try {
        const beneficiaryRef = db.collection('users').doc(uid).collection('beneficiaries').doc();
        await beneficiaryRef.set({
            id: beneficiaryRef.id,
            name: name,
            bank: bank,
            accountNumber: accountNumber,
            userId: uid,
        });

        return { success: true, message: 'Beneficiary added successfully.', beneficiaryId: beneficiaryRef.id };
    } catch (error) {
        console.error('Error adding beneficiary:', error);
        throw new functions.https.HttpsError('internal', 'Failed to add beneficiary.', error.message);
    }
});


exports.processScheduledPayment = functions.region('us-central1').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { paymentId, userId } = data;

    if (!paymentId || !userId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing paymentId or userId.');
    }
    
    const paymentRef = db.doc(`users/${userId}/scheduledPayments/${paymentId}`);

    try {
        const result = await db.runTransaction(async (transaction) => {
            const paymentDoc = await transaction.get(paymentRef);
            if (!paymentDoc.exists || paymentDoc.data().status !== 'scheduled') {
                throw new Error('Scheduled payment not found or already processed.');
            }

            const paymentData = paymentDoc.data();
            const fromAccountRef = db.doc(`users/${userId}/bankAccounts/${paymentData.fromAccountId}`);
            const fromAccountDoc = await transaction.get(fromAccountRef);

            if (!fromAccountDoc.exists) {
                throw new Error('Source account not found.');
            }

            const fromAccountData = fromAccountDoc.data();
            if (fromAccountData.balance < paymentData.amount) {
                transaction.update(paymentRef, { status: 'failed', failureReason: 'Insufficient funds' });
                return { success: false, message: 'Insufficient funds.' };
            }
            
            const newBalance = fromAccountData.balance - paymentData.amount;
            transaction.update(fromAccountRef, { balance: newBalance });

            const newTransactionRef = fromAccountRef.collection('transactions').doc();
            transaction.set(newTransactionRef, {
                id: newTransactionRef.id,
                amount: paymentData.amount,
                date: new Date().toISOString(),
                description: `Scheduled Payment: ${paymentData.reference}`,
                type: 'debit',
                transactionType: 'EFT_STANDARD',
                userId: userId,
            });

            transaction.update(paymentRef, { status: 'processed', processedDate: new Date().toISOString() });
            
            return { success: true, message: 'Scheduled payment processed successfully.' };
        });
        
        return result;

    } catch (error) {
        console.error('Error processing scheduled payment:', error);
        throw new functions.https.HttpsError('internal', 'Failed to process scheduled payment.', error.message);
    }
});


exports.sendSms = functions.region('us-central1').runWith({ memory: '512MiB', timeoutSeconds: 60 }).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    
    const { to, text } = data;
    if (!to || !text) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The function must be called with "to" and "text" arguments.'
        );
    }

    const from = "Nedbank";
    const vonageApiKey = process.env.VONAGE_API_KEY;
    const vonageApiSecret = process.env.VONAGE_API_SECRET;
    
    if (!vonageApiKey || !vonageApiSecret) {
        console.error('Vonage API credentials are not configured.');
        throw new functions.https.HttpsError('failed-precondition', 'SMS service not configured.');
    }

    try {
        const vonageClient = new Vonage({
            apiKey: vonageApiKey,
            apiSecret: vonageApiSecret
        });
        
        const response = await vonageClient.sms.send({ to, from, text });
        console.log("Vonage response:", JSON.stringify(response));
        
        if (!response.messages || response.messages.length === 0) {
            throw new functions.https.HttpsError('internal', 'No response from SMS service.');
        }
        
        const message = response.messages[0];
        
        if (message.status !== '0') {
            const errorText = message['error-text'] || 'Unknown error';
            console.error(`Vonage error - Status: ${message.status}, Error: ${errorText}`);
            throw new functions.https.HttpsError(
                'internal',
                `SMS failed: ${errorText} (code: ${message.status})`
            );
        }
        
        console.log(`Message sent successfully. Message ID: ${message.messageId}`);

        return { 
            success: true, 
            message: "SMS sent successfully!",
            messageId: message.messageId
        };
    } catch (error) {
        console.error("Error sending SMS:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to send SMS.');
    }
});

exports.getAllUsers = functions.region('us-central1').https.onCall(async (data, context) => {
    // IMPORTANT: Add admin check here in a real application.
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    try {
        const listUsersResult = await admin.auth().listUsers(1000); // paginate if more than 1000 users
        return { success: true, users: listUsersResult.users };
    } catch (error) {
        console.error('Error listing users:', error);
        throw new functions.https.HttpsError('internal', 'Unable to list users.');
    }
});


// This is the specific list of transactions to be seeded into the Savvy Bundle Current Account.
const initialSavvyBundleTransactions = [
    { timestamp: new Date(), description: 'NEDBANK SEND-IMALI', amount: '-R3000.00', transactionType: 'EFT_IMMEDIATE' },
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
    { timestamp: new Date('2022-10-03'), description: 'Hantie lening', amount: '+R15000.00', transactionType: 'EFT_STANDARD' },
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
    { timestamp: new Date('2022-10-17'), description: 'SASW CASH 377121716833693', amount: '-R300.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
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
    { timestamp: new Date('2022-10-21'), description: 'Van Wyk Bussiness Enterprise', amount: '+R57100.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-21'), description: 'INTERACCOUNT TRANSFER FROM JUST INVEST', amount: '+R18949581.42', transactionType: 'EFT_STANDARD' },
];

/**
 * Triggered when a new user is created in Firebase Authentication.
 * This function creates a corresponding user document in Firestore,
 * along with sample bank accounts and detailed transaction history for one account.
 */
exports.provisionNewUser = functions.auth.user().onCreate(async (userRecord) => {
  const { uid, email } = userRecord;
  const batch = db.batch();

  try {
    const userDocRef = db.collection('users').doc(uid);
    batch.set(userDocRef, {
      id: uid,
      email: email,
      firstName: 'Van Wyk Bussiness Enterprise',
      lastName: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await admin.auth().updateUser(uid, { displayName: 'Van Wyk Bussiness Enterprise' });
    console.log(`Successfully created user document for: ${uid}`);

    const accountsCollectionRef = userDocRef.collection('bankAccounts');
    const savvyAccountRef = accountsCollectionRef.doc();
    let savvyBalance = 0;

    initialSavvyBundleTransactions.forEach(tx => {
      const isCredit = tx.amount.startsWith('+');
      const numericAmount = parseFloat(tx.amount.replace(/[+R,]/g, ''));
      
      if (!isNaN(numericAmount)) {
        savvyBalance += isCredit ? numericAmount : -numericAmount;
        const newTransactionRef = savvyAccountRef.collection('transactions').doc();
        batch.set(newTransactionRef, {
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

    batch.set(savvyAccountRef, {
      name: 'Savvy Bundle Current Account',
      type: 'Cheque',
      accountNumber: '1234567890',
      balance: savvyBalance,
      currency: 'ZAR',
      userId: uid,
    });
    console.log(`Prepared to seed Savvy account with ${initialSavvyBundleTransactions.length} transactions.`);

    const otherAccounts = [
      { name: 'Savings Account', type: 'Savings', accountNumber: '0987654321', balance: 0.00 },
      { name: 'Gold Credit Card', type: 'Credit', accountNumber: '5555666677778888', balance: 0.00 },
      { name: 'Nedbank Just Invest Money Market Investment', type: 'Savings', accountNumber: '111122223333', balance: 18502191.17 },
      { name: 'Holiday Fund', type: 'Savings', accountNumber: '2000000001', balance: 500.00 },
      { name: 'Emergency Fund', type: 'Savings', accountNumber: '2000000002', balance: 1000.00 },
      { name: 'New Car', type: 'Savings', accountNumber: '2000000003', balance: 250.00 },
      { name: 'Gadgets', type: 'Savings', accountNumber: '2000000004', balance: 100.00 },
    ];

    otherAccounts.forEach(acc => {
      const accRef = accountsCollectionRef.doc();
      batch.set(accRef, { ...acc, userId: uid, currency: 'ZAR' });
      
      if (['Holiday Fund', 'Emergency Fund', 'New Car', 'Gadgets'].includes(acc.name)) {
        const txRef = accRef.collection('transactions').doc();
        batch.set(txRef, {
            id: txRef.id,
            userId: uid,
            date: new Date().toISOString(),
            description: 'Initial Deposit',
            amount: acc.balance,
            type: 'credit',
            transactionType: 'SAVINGS_TRANSFER',
        });
      }
    });

    const failedTransactionsToAdd = [
        { returnDate: '30 Sept 2025', fromAccount: '1234066912', toAccount: '4106210638', beneficiaryName: 'Van Wyk Bussiness Enterprise', failureReason: 'Not Authorised' },
        { returnDate: '01 Oct 2025', fromAccount: '1234066912', toAccount: '9876543210', beneficiaryName: 'H.Nel', failureReason: 'Not Authorised' },
    ];
    failedTransactionsToAdd.forEach(tx => {
        const newDocRef = savvyAccountRef.collection('failedTransactions').doc();
        batch.set(newDocRef, { ...tx, id: newDocRef.id });
    });
    console.log(`Prepared to seed ${failedTransactionsToAdd.length} failed transactions.`);

    await batch.commit();
    console.log(`Successfully provisioned all accounts and transactions for user: ${uid}`);

  } catch (error) {
    console.error(`Failed to provision new user ${uid}:`, error);
  }

  return null;
});

exports.provisionExistingUserPockets = functions.region('us-central1').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const uid = context.auth.uid;
    const batch = db.batch();

    try {
        const accountsCollectionRef = db.collection('users').doc(uid).collection('bankAccounts');
        const existingAccountsSnap = await accountsCollectionRef.get();
        const existingAccountNames = new Set(existingAccountsSnap.docs.map(doc => doc.data().name));

        const pocketAccountsWithData = [
            { name: 'Holiday Fund', balance: 500, transactions: [{ date: new Date(), description: 'Initial Deposit', amount: 500, type: 'credit' }] },
            { name: 'Emergency Fund', balance: 1000, transactions: [{ date: new Date(), description: 'Initial Deposit', amount: 1000, type: 'credit' }] },
            { name: 'New Car', balance: 250, transactions: [{ date: new Date(), description: 'Initial Deposit', amount: 250, type: 'credit' }] },
            { name: 'Gadgets', balance: 100, transactions: [{ date: new Date(), description: 'Initial Deposit', amount: 100, type: 'credit' }] },
        ];
        
        let pocketsAdded = 0;
        pocketAccountsWithData.forEach((pocket, index) => {
            if (!existingAccountNames.has(pocket.name)) {
                pocketsAdded++;
                const newAccountRef = accountsCollectionRef.doc();
                batch.set(newAccountRef, {
                    name: pocket.name,
                    balance: pocket.balance,
                    type: 'Savings',
                    accountNumber: `200000000${index + 1}`,
                    currency: 'ZAR',
                    userId: uid,
                });

                pocket.transactions.forEach(tx => {
                    const txRef = newAccountRef.collection('transactions').doc();
                    batch.set(txRef, {
                        id: txRef.id,
                        userId: uid,
                        date: tx.date.toISOString(),
                        description: tx.description,
                        amount: tx.amount,
                        type: tx.type,
                        transactionType: 'SAVINGS_TRANSFER',
                    });
                });
            }
        });

        if (pocketsAdded > 0) {
            await batch.commit();
            return { success: true, message: `Added ${pocketsAdded} new pocket accounts.` };
        }

        return { success: true, message: 'All pocket accounts already exist.' };
    } catch (error) {
        console.error("Error in provisionExistingUserPockets:", error);
        throw new functions.https.HttpsError('internal', 'Failed to provision pocket accounts for existing user.');
    }
});
