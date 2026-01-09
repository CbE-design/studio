

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
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { Vonage } = require('@vonage/server-sdk');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set global options for functions (e.g., region, memory)
setGlobalOptions({ region: 'us-central1' });

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || "587", 10),
    secure: false, // Explicitly false for port 587, which uses STARTTLS
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});


// Initialize Vonage
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});

/**
 * Sends an email using Nodemailer.
 * This is a callable function that can be invoked from the client-side via a server action.
 * It requires SMTP environment variables to be set (MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS).
 */
exports.sendEmail = onCall(async (request) => {
    // Authentication check
    if (!request.auth) {
        throw new HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }
    
    const { to, subject, html, attachments } = request.data;
    
    if (!to || !subject || !html) {
         throw new HttpsError(
            'invalid-argument',
            'Missing required fields: to, subject, and html.'
        );
    }

    const fromName = "Proof of Payment (Nedbank)";
    const fromEmail = process.env.MAIL_FROM || 'proofofpayment@nedbank.co.za';

    try {
        await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments.map(att => ({
                filename: att.filename,
                content: att.content,
                encoding: 'base64'
            })),
        });
        console.log(`Email sent successfully to ${to}`);
        return { success: true, message: 'Email sent successfully.' };
    } catch (error) {
        console.error('Error sending email with Nodemailer:', error);
        throw new HttpsError('internal', 'Failed to send email.', error);
    }
});


/**
 * Adds a new beneficiary to the user's profile.
 * This is a callable function that requires authentication.
 */
exports.addBeneficiary = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const uid = request.auth.uid;
    const { name, bank, accountNumber } = request.data;

    if (!name || !bank || !accountNumber) {
        throw new HttpsError('invalid-argument', 'Missing required beneficiary details: name, bank, and accountNumber.');
    }

    try {
        const beneficiaryRef = admin.firestore().collection('users').doc(uid).collection('beneficiaries').doc();
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
        throw new HttpsError('internal', 'Failed to add beneficiary.', error);
    }
});


/**
 * Simulates the processing of a scheduled payment.
 * In a real app, this would be triggered by a scheduler (e.g., Cloud Scheduler).
 */
exports.processScheduledPayment = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { paymentId, userId } = request.data;

    if (!paymentId || !userId) {
        throw new HttpsError('invalid-argument', 'Missing paymentId or userId.');
    }
    
    const db = admin.firestore();
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
        throw new HttpsError('internal', 'Failed to process scheduled payment.', error);
    }
});


/**
 * Sends an SMS message using the Vonage API.
 * This is a callable function, meaning it can be invoked directly from the client-side application.
 *
 * @param {object} request - The request object from the client.
 * @param {string} request.data.to - The recipient's phone number in E.164 format (e.g., +14155552671).
 * @param {string} request.data.text - The text content of the message.
 * @returns {Promise<{success: boolean, message: string, messageId?: string}>} - A promise that resolves with the result of the operation.
 */
exports.sendSms = onCall(async (request) => {
    // 1. Authenticate the user if required (recommended for production)
    if (!request.auth) {
        throw new HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }
    
    // 2. Validate the incoming data
    const { to, text } = request.data;
    if (!to || !text) {
        throw new HttpsError(
            'invalid-argument',
            'The function must be called with "to" and "text" arguments.'
        );
    }

    const from = "Nedbank";

    try {
        // 3. Send the SMS using the Vonage SDK
        const response = await vonage.sms.send({ to, from, text });
        const messageId = response.messages[0].messageId;
        
        console.log(`Message sent successfully. Message ID: ${messageId}`);

        // 4. Return a success response to the client
        return { 
            success: true, 
            message: "SMS sent successfully!",
            messageId: messageId
        };
    } catch (error) {
        console.error("Error sending SMS:", error);
        throw new HttpsError(
            'internal',
            'Failed to send SMS.',
            error
        );
    }
});


// This is the specific list of transactions to be seeded into the Savvy Bundle Current Account.
const initialSavvyBundleTransactions = [
    { timestamp: new Date('2022-09-29'), description: 'Banking fee', amount: '-R23987.87', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-01'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-01'), description: 'Hantie lening', amount: '+R20000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-01'), description: 'Hantie lening', amount: '+R10000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-01'), description: 'A de klerk', amount: '-R2000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-01'), description: 'Time square pr377121716833693', amount: '-R8000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-01'), description: 'Pnp crp wonder377121716833693', amount: '-R1535.76', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-01'), description: 'Cltx doornpoor377121716833693', amount: '-R739.37', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-01'), description: 'Https://www.ub377121716833693', amount: '-R665.10', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-01'), description: 'Data kings 377121716833693', amount: '-R500.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-01'), description: 'Doornpoortmoto377121716833693', amount: '-R436.89', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-01'), description: 'Nedbank send-imali', amount: '-R15.00', transactionType: 'EFT_IMMEDIATE' },
    { timestamp: new Date('2022-10-01'), description: 'Atm bidves 0930 0346 balance', amount: '-R10.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-01'), description: 'Instant payment fee', amount: '-R10.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-03'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'Hantie lening', amount: '+R20000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('22022-10-03'), description: 'Hantie lening', amount: '+R15000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'Hantie lening', amount: '+R1500.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'Blom', amount: '-R5000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'H.nel', amount: '-R4000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'H.nel', amount: '-R3000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'H.nel', amount: '-R100.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-03'), description: 'Vodacom airtime t +27791778894', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'Sasw cash 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-03'), description: 'Sasw cash 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-03'), description: 'Sasw cash 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-03'), description: 'Sasw cash 377121716833693', amount: '-R4900.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-03'), description: 'Sasw cash 377121716833693', amount: '-R4000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-03'), description: 'Time square pr377121716833693', amount: '-R20000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'Time square pr377121716833693', amount: '-R18000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'Peermont globa377121716833693', amount: '-R15000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'Time square pr377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'Peermont globa377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'Peermont globa377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'Ae amandelboom377121716833693', amount: '-R1077.43', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'Cltx doornpoor377121716833693', amount: '-R189.92', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-03'), description: 'Instant payment fee', amount: '-R69.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-03'), description: 'Pos peermo 1001 2345 ins funds', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-03'), description: 'Pos peermo 1003 0138 ins funds', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-03'), description: 'Pos peermo 1003 0140 ins funds', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-04'), description: 'Sasw cash 377121716833693', amount: '-R1000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-04'), description: 'Peermont globa377121716833693', amount: '-R15000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'Peermont globa377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'Peermont metco377121716833693', amount: '-R2932.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'Peermont metco377121716833693', amount: '-R2932.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'Peermont globa377121716833693', amount: '-R2000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'Peermont globa377121716833693', amount: '-R300.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'Uber eats 3d 377121716833693', amount: '-R66.51', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-04'), description: 'Nedbank send-imali', amount: '-R15.00', transactionType: 'EFT_IMMEDIATE' },
    { timestamp: new Date('2022-10-04'), description: 'Prepaid airtime', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-05'), description: 'Corrie', amount: '+R420000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-05'), description: 'Br cash r420000.00 fee', amount: '-R9660.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-05'), description: 'Cash transaction fee', amount: '-R80.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-05'), description: 'Oom danna', amount: '-R20000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-05'), description: 'Vodacom airtime top 0608797671', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-05'), description: 'Payflex 5181030004835796', amount: '-R1499.95', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-05'), description: 'Instant payment fee', amount: '-R49.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-06'), description: 'Sasw cash 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-06'), description: 'Sasw cash 377121716833693', amount: '-R4500.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-06'), description: 'Top vending p377121716833693', amount: '-R170.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-06'), description: 'Top vending p377121716833693', amount: '-R140.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-06'), description: 'Top vending p377121716833693', amount: '-R40.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-06'), description: 'Top vending p377121716833693', amount: '-R30.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-06'), description: 'Top vending p377121716833693', amount: '-R17.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-06'), description: 'Top vending p377121716833693', amount: '-R17.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-06'), description: 'Hantie', amount: '-R100000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-06'), description: 'W.joubert', amount: '-R29000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-06'), description: 'Prepaid airtime', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-07'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-07'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-07'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-07'), description: 'Jade', amount: '-R5000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-07'), description: 'H.nel', amount: '-R5000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-07'), description: 'Vodacom airtime top 0608797671', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Peermont globa377121716833693', amount: '-R40000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Peermont globa377121716833693', amount: '-R40000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Peermont globa377121716833693', amount: '-R30000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Peermont globa377121716833693', amount: '-R30000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Peermont globa377121716833693', amount: '-R30000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Peermont globa377121716833693', amount: '-R30000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Peermont globa377121716833693', amount: '-R30000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Peermont globa377121716833693', amount: '-R25000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Peermont globa377121716833693', amount: '-R25000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Peermont globa377121716833693', amount: '-R20000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Peermont globa377121716833693', amount: '-R1500.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-07'), description: 'Instant payment fee', amount: '-R98.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-08'), description: 'Hantie lening', amount: '+R10000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-08'), description: 'Vodacom airtime top 0608797671', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-08'), description: 'Sasw cash 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-08'), description: 'Sasw cash 377121716833693', amount: '-R4900.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-08'), description: 'Peermont globa377121716833693', amount: '-R20000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-08'), description: 'Peermont globa377121716833693', amount: '-R7000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-08'), description: 'Prepaid airtime', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-10'), description: 'Hantie lening', amount: '+R40000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-10'), description: 'J van niekerk', amount: '+R700.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-10'), description: 'Anna', amount: '-R1000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-10'), description: 'Sasw cash 377121716833693', amount: '-R4000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-10'), description: 'Sasw cash 377121716833693', amount: '-R4000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-10'), description: 'Sasw cash 377121716833693', amount: '-R4000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-10'), description: 'Sasw cash 377121716833693', amount: '-R4000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-10'), description: 'Sasw cash 377121716833693', amount: '-R1900.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-10'), description: 'Sasw cash 377121716833693', amount: '-R1000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-10'), description: 'Peermont d ore377121716833693', amount: '-R2740.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-10'), description: 'Peermont globa377121716833693', amount: '-R800.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-10'), description: 'Peermont globa377121716833693', amount: '-R300.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-10'), description: 'Prepaid airtime', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-11'), description: 'Wynand', amount: '+R5000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-11'), description: 'Hantie lening', amount: '+R1300.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-11'), description: 'Vodacom airtime top 0608797671', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'Sasw cash 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-11'), description: 'Sasw cash 377121716833693', amount: '-R900.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-11'), description: 'Peermont globa377121716833693', amount: '-R13000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'Peermont globa377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'Nfs eastpoint377121716833693', amount: '-R1499.95', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'Fortuna poker 377121716833693', amount: '-R700.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'Peermont globa377121716833693', amount: '-R600.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-11'), description: 'Nedbank send-imali', amount: '-R10.00', transactionType: 'EFT_IMMEDIATE' },
    { timestamp: new Date('2022-10-11'), description: 'Pos peermo 1011 0146 ins funds', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-11'), description: 'Pos peermo 1011 0147 ins funds', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-11'), description: 'Pos peermo 1011 0156 ins funds', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-12'), description: 'Hantie lening', amount: '+R15000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-12'), description: 'Hantie lening', amount: '+R15000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-12'), description: 'Hantie lening', amount: '+R10000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-12'), description: 'Wynkas', amount: '-R3000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-12'), description: 'H.nel', amount: '-R1000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-12'), description: 'Micky', amount: '-R400.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-12'), description: 'Vodacom airtime top 0608797671', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'Sasw cash 377121716833693', amount: '-R4900.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-12'), description: 'Atm cash 377121716833693', amount: '-R3500.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-12'), description: 'Atm cash 377121716833693', amount: '-R2000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-12'), description: 'Time square pr377121716833693', amount: '-R20000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'Peermont globa377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'Peermont globa377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'Peermont globa377121716833693', amount: '-R10000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'Peermont metco377121716833693', amount: '-R4620.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'Instant payment fee', amount: '-R30.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-12'), description: 'Atm f.n.b. 1011 0140 balance', amount: '-R10.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-12'), description: 'Prepaid airtime', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-12'), description: 'Pos time s 1012 1005 ins funds', amount: '-R8.50', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-13'), description: 'Hantie lening', amount: '+R500.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-13'), description: 'Prepaid airtime', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-14'), description: 'Atm cash 377121716833693', amount: '-R500.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-15'), description: 'Hantie lening', amount: '+R1000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-15'), description: 'Hantie lening', amount: '+R1000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-15'), description: 'A de klerk', amount: '-R500.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-15'), description: 'Sasw cash 377121716833693', amount: '-R1500.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-15'), description: 'Instant payment fee', amount: '-R10.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-17'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'Hantie lening', amount: '+R25000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'Hantie lening', amount: '+R15000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'Hantie lening', amount: '+R7000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'Hantie lening', amount: '+R2000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'H.nel', amount: '-R6000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'H.nel', amount: '-R2000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'Wynkas', amount: '-R2000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'Capi', amount: '-R1000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'H.nel', amount: '-R1000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'M', amount: '-R300.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'B', amount: '-R100.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-17'), description: 'Sasw cash 377121716833693', amount: '-R5000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-17'), description: 'Atm cash 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-17'), description: 'Atm cash 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-17'), description: 'Sasw cash 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-17'), description: 'Atm cash 377121716833693', amount: '-R2000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-17'), description: 'Sasw cash 377121716833693', amount: '-R1900.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-17'), description: 'Sasw cash 377121716833693', amount: '-R300.00', transactionType: 'ATM_WITHDRAWAL_OWN' },
    { timestamp: new Date('2022-10-17'), description: 'Peermont globa377121716833693', amount: '-R9000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-17'), description: 'Peermont globa377121716833693', amount: '-R5000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-17'), description: 'Doornpoortmoto377121716833693', amount: '-R661.96', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-17'), description: 'Doornpoortmoto377121716833693', amount: '-R637.99', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-17'), description: 'Peermont globa377121716833693', amount: '-R500.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-17'), description: 'Instant payment fee', amount: '-R79.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-18'), description: 'Vodacom airtime top 0608797671', amount: '-R50.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-18'), description: 'Atm cash 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-18'), description: 'Atm cash 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-18'), description: 'Atm cash 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-18'), description: 'Makro wonderbo377121716833693', amount: '-R9594.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-18'), description: 'Time square ma377121716833693', amount: '-R5000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-18'), description: 'Time square pr377121716833693', amount: '-R3000.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-18'), description: 'Makro wonderbo377121716833693', amount: '-R624.00', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-18'), description: 'Nedbank send-imali', amount: '-R10.00', transactionType: 'EFT_IMMEDIATE' },
    { timestamp: new Date('2022-10-18'), description: 'Nedbank send-imali', amount: '-R10.00', transactionType: 'EFT_IMMEDIATE' },
    { timestamp: new Date('2022-10-18'), description: 'Nedbank send-imali', amount: '-R10.00', transactionType: 'EFT_IMMEDIATE' },
    { timestamp: new Date('2022-10-19'), description: 'Prepaid airtime', amount: '-R1.50', transactionType: 'POS_PURCHASE' },
    { timestamp: new Date('2022-10-20'), description: 'Hantie lening', amount: '+R55000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-20'), description: 'December - 2060973570', amount: '+R200.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-20'), description: 'Hantie', amount: '-R10000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-20'), description: 'Atm cash 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-20'), description: 'Atm cash 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-20'), description: 'Atm cash 377121716833693', amount: '-R3000.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-20'), description: 'Atm cash 377121716833693', amount: '-R400.00', transactionType: 'ATM_WITHDRAWAL_OTHER' },
    { timestamp: new Date('2022-10-20'), description: 'Instant payment fee', amount: '-R49.00', transactionType: 'BANK_FEE' },
    { timestamp: new Date('2022-10-21'), description: 'Wynkas', amount: '-R10000.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-21'), description: 'Corrie bussiness enterprise', amount: '+R57100.00', transactionType: 'EFT_STANDARD' },
    { timestamp: new Date('2022-10-21'), description: 'Interaccount transfer from just invest', amount: '+R18949581.42', transactionType: 'EFT_STANDARD' },
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
      firstName: 'Corrie',
      lastName: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await admin.auth().updateUser(uid, { displayName: 'Corrie' });
    console.log(`Successfully created user document for: ${uid}`);

    const accountsCollectionRef = userDocRef.collection('bankAccounts');

    // Create sample accounts
    const savvyAccountRef = accountsCollectionRef.doc();
    const savingsAccountRef = accountsCollectionRef.doc();
    const creditAccountRef = accountsCollectionRef.doc();
    const justInvestAccountRef = accountsCollectionRef.doc();


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

    // Seed failed transactions
    const failedTransactionsBatch = db.batch();
    const failedTransactionsRef = savvyAccountRef.collection('failedTransactions');
    const failedTransactionsToAdd = [
        { returnDate: '30 Sept 2025', fromAccount: '1234066912', toAccount: '4106210638', beneficiaryName: 'Corrie', failureReason: 'Not Authorised' },
        { returnDate: '01 Oct 2025', fromAccount: '1234066912', toAccount: '9876543210', beneficiaryName: 'H.Nel', failureReason: 'Not Authorised' },
    ];
    failedTransactionsToAdd.forEach(tx => {
        const newDocRef = failedTransactionsRef.doc();
        failedTransactionsBatch.set(newDocRef, { ...tx, id: newDocRef.id });
    });
    await failedTransactionsBatch.commit();
    console.log(`Successfully seeded ${failedTransactionsToAdd.length} failed transactions.`);

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

    accountsBatch.set(justInvestAccountRef, {
        name: 'Nedbank Just Invest Money Market Investment',
        type: 'Savings',
        accountNumber: '111122223333',
        balance: 18502191.17,
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

    

    

    

    
