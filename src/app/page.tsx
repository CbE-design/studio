'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  signInAnonymously,
  onAuthStateChanged,
  User,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  writeBatch,
  getDoc,
  query,
  runTransaction,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

import SplashScreen from '@/components/SplashScreen';
import LoginPage from '@/components/LoginPage';
import OverviewPage from '@/components/OverviewPage';
import TransactionsPage from '@/components/TransactionsPage';
import FailedTransactionsPage from '@/components/FailedTransactionsPage';
import TransactionDetailPage from '@/components/TransactionDetailPage';
import PaymentPage from '@/components/PaymentPage';
import RecipientsPage from '@/components/RecipientsPage';
import PaymentConfirmationPage from '@/components/PaymentConfirmationPage';
import BottomNavBar from '@/components/BottomNavBar';
import TransactLandingPage from '@/components/TransactLandingPage';
import { combinedInitialTransactions, initialPlatinumChequeTransactions, initialThirdAccountTransactions, MOCK_CURRENT_DATE } from '@/lib/data';
import { sendPaymentNotification } from '@/ai/flows/send-payment-notification';
import { sendSms } from '@/ai/flows/send-sms';

const App = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [currentView, setCurrentView] = useState('start');
  const [accountBalance, setAccountBalance] = useState(0);
  const [secondAccountBalance, setSecondAccountBalance] = useState(0);
  const [thirdAccountBalance, setThirdAccountBalance] = useState(0);
  const [realTimeTransactions, setRealTimeTransactions] = useState([]);
  const [secondRealTimeTransactions, setSecondRealTimeTransactions] = useState([]);
  const [thirdRealTimeTransactions, setThirdRealTimeTransactions] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [overviewPagesData, setOverviewPagesData] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState({
    recipient: '',
    bankName: 'Select bank',
    accountNumber: '',
    paymentMethod: 'Standard EFT',
    amount: '',
    yourReference: '',
    recipientsReference: '',
    recipientPhone: '',
    sendSms: false,
    saveRecipient: false,
    fromAccount: 'current',
  });
  const [lastPayment, setLastPayment] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [isRecipientSaved, setIsRecipientSaved] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const failedTransactionsData = useMemo(() => {
    const tomorrow = new Date(MOCK_CURRENT_DATE);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return [
      {
        type: 'Internet Banking Payment',
        recipient: 'Mfoloe Attorneys Inc',
        recipientDetails: 'First National Bank 62939163961',
        payerAccount: 'Savvy Bundle Current Account',
        amount: '-R16,300,000.00',
        date: new Date('2025-08-16'),
      },
      {
        type: 'Internet Banking Payment',
        recipient: 'Fransiska Meiring',
        recipientDetails: 'First National Bank 62356388027',
        payerAccount: 'Savvy Bundle Current Account',
        amount: '-R500,000.00',
        date: new Date('2025-08-19'),
      },
    ];
  }, []);

  const combinedTransactions = useMemo(
    () =>
      [...realTimeTransactions].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      ),
    [realTimeTransactions]
  );
  const secondCombinedTransactions = useMemo(
    () =>
      [...secondRealTimeTransactions].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      ),
    [secondRealTimeTransactions]
  );
  const thirdCombinedTransactions = useMemo(
    () =>
      [...thirdRealTimeTransactions].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      ),
    [thirdRealTimeTransactions]
  );

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const authSub = onAuthStateChanged(auth, async (user) => {
          if (user) {
            setUserId(user.uid);
            await fetchData(db, user.uid);
            setCurrentView('login');
          } else {
            try {
              await signInAnonymously(auth);
            } catch (error) {
              console.error('Anonymous sign-in failed:', error);
              setIsLoading(false);
            }
          }
        });
        return () => authSub();
      } catch (error) {
        console.error('Failed to set persistence:', error);
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);


  useEffect(() => {
    if (lastPayment) {
      const alreadySaved = recipients.some(
        (r) => r.accountNumber === lastPayment.accountNumber
      );
      setIsRecipientSaved(alreadySaved);
    }
  }, [lastPayment, recipients]);

  const seedInitialData = async (db, uid) => {
    const appId = 'van-schalkwyk-trust-mobile';
    const seedMarkerRef = doc(db, `artifacts/${appId}/users/${uid}/seededData/marker`);
    
    try {
        const seedMarkerSnap = await getDoc(seedMarkerRef);

        if (!seedMarkerSnap.exists()) {
            console.log("Seeding initial data...");
            const batch = writeBatch(db);
            
            batch.set(doc(db, `artifacts/${appId}/users/${uid}/accountData/balance`), { value: 1590835.19 + 16300000 + 500000 });
            batch.set(doc(db, `artifacts/${appId}/users/${uid}/secondAccountData/balance`), { value: 1600904.90 });
            batch.set(doc(db, `artifacts/${appId}/users/${uid}/thirdAccountData/balance`), { value: 4775.00 });
            batch.set(doc(db, `artifacts/${appId}/users/${uid}/transactionCounter/counter`), { value: 3692825731 });
      
            const transactionsColRef1 = collection(db, `artifacts/${appId}/users/${uid}/transactions`);
            combinedInitialTransactions.forEach(tx => batch.set(doc(transactionsColRef1), tx));
            
            const transactionsColRef2 = collection(db, `artifacts/${appId}/users/${uid}/secondAccountTransactions`);
            initialPlatinumChequeTransactions.forEach(tx => batch.set(doc(transactionsColRef2), tx));
      
            const transactionsColRef3 = collection(db, `artifacts/${appId}/users/${uid}/thirdAccountTransactions`);
            initialThirdAccountTransactions.forEach(tx => batch.set(doc(transactionsColRef3), tx));
      
            const recipientsColRef = collection(db, `artifacts/${appId}/users/${uid}/recipients`);
            const mfoloeRecipient = { name: 'Mfoloe Attorneys Inc', bank: 'First National Bank', accountNumber: '62939163961', lastPaid: new Date('2025-08-15') };
            batch.set(doc(recipientsColRef), mfoloeRecipient);
            const fransiskaRecipient = { name: 'Fransiska Meiring', bank: 'First National Bank', accountNumber: '62356388027', lastPaid: new Date('2025-08-18') };
            batch.set(doc(recipientsColRef), fransiskaRecipient);
      
            const overviewPagesColRef = collection(db, `artifacts/${appId}/users/${uid}/overviewPages`);
            const pagesData = [
              { title: 'Accounts', order: 1, content: JSON.stringify([ { type: 'account', title: 'Savvy Bundle Current Account', balanceKey: 'accountBalance', onClick: 'transactions' }, { type: 'account', title: 'Platinum Cheque', balanceKey: 'secondAccountBalance', onClick: 'secondAccountTransactions' }, { type: 'account', title: 'Platinum Cheque', balanceKey: 'thirdAccountBalance', onClick: 'thirdAccountTransactions' }, { type: 'action', title: 'Free savings feature', value: 'MyPocket', actionText: 'Set up now', color: 'yellow' } ]) },
              { title: 'Savings & Investments', order: 2, content: JSON.stringify([ { type: 'item', title: 'Unit Trust (1)', value: 'R0.00' }, { type: 'item', title: 'Money Market Account', value: 'R25 000.00' }, { type: 'item', title: 'Other Investment Accounts (1)', value: 'R63.55' }, { type: 'item', title: 'Tax certificates', value: 'Tax certificates' }, { type: 'action', title: 'Save & Invest', actionText: 'Explore options', color: 'yellow' } ]) },
              { title: 'Rewards', order: 3, content: JSON.stringify([ { type: 'item', title: 'Membership Rewards', value: 'MR 732 512' }, { type: 'item', title: 'Greenbacks Rewards', value: 'GB 90 000' } ]) },
              { title: 'International banking and travel', order: 4, content: JSON.stringify([ { type: 'action', title: 'Incoming and outgoing payments', value: 'International payments', actionText: 'View', color: 'yellow' }, { type: 'item', title: 'Foreign Currency Accounts', value: 'Your currencies' }, { type: 'item', title: 'Travel Card', value: 'Mr C Van Schalkwyk' } ]) },
              { title: 'Insurance', order: 5, content: JSON.stringify([ { type: 'item', title: 'My policies and applications', value: 'Insurance' }, { type: 'item', title: 'Funeral Plan', value: 'Policy #FP12345' }, { type: 'item', title: 'Car Insurance', value: 'Policy #CI67890' }, { type: 'action', title: 'Insurance', value: 'New policy', actionText: 'Get cover', color: 'yellow' } ]) },
              { title: 'Lifestyle', order: 6, content: JSON.stringify([ { type: 'action', title: 'Unlock greater financial benefits', value: 'Family Banking', actionText: 'View', color: 'yellow' }, { type: 'item', title: 'Greenbacks Rewards', value: 'View your points' }, { type: 'item', title: 'Digital Vouchers', value: 'Buy and send vouchers' }, ]) }
            ];
            pagesData.forEach(page => batch.set(doc(overviewPagesColRef, page.title), page));
            batch.set(seedMarkerRef, { seeded: true, timestamp: serverTimestamp() });
            await batch.commit();
        }
    } catch (error) {
        console.error("Error seeding data:", error);
    }
  };

  const fetchData = async (db, uid) => {
    const appId = 'van-schalkwyk-trust-mobile';
    await seedInitialData(db, uid);

    const docRefs = {
      balance1: doc(db, `artifacts/${appId}/users/${uid}/accountData/balance`),
      balance2: doc(db, `artifacts/${appId}/users/${uid}/secondAccountData/balance`),
      balance3: doc(db, `artifacts/${appId}/users/${uid}/thirdAccountData/balance`),
    };

    const colRefs = {
      trans1: collection(db, `artifacts/${appId}/users/${uid}/transactions`),
      trans2: collection(db, `artifacts/${appId}/users/${uid}/secondAccountTransactions`),
      trans3: collection(db, `artifacts/${appId}/users/${uid}/thirdAccountTransactions`),
      recipients: collection(db, `artifacts/${appId}/users/${uid}/recipients`),
      overviewPages: collection(db, `artifacts/${appId}/users/${uid}/overviewPages`),
    };

    onSnapshot(docRefs.balance1, (docSnap) => docSnap.exists() && setAccountBalance(docSnap.data().value));
    onSnapshot(docRefs.balance2, (docSnap) => docSnap.exists() && setSecondAccountBalance(docSnap.data().value));
    onSnapshot(docRefs.balance3, (docSnap) => docSnap.exists() && setThirdAccountBalance(docSnap.data().value));

    const processSnapshot = (snapshot) =>
      snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        timestamp: d.data().timestamp?.toDate() || new Date(),
      }));

    onSnapshot(colRefs.trans1, (s) => setRealTimeTransactions(processSnapshot(s)));
    onSnapshot(colRefs.trans2, (s) => setSecondRealTimeTransactions(processSnapshot(s)));
    onSnapshot(colRefs.trans3, (s) => setThirdRealTimeTransactions(processSnapshot(s)));
    onSnapshot(colRefs.recipients, (s) => setRecipients(processSnapshot(s)));
    onSnapshot(query(colRefs.overviewPages), (s) => {
      const pagesList = s.docs
        .map((d) => ({
          ...d.data(),
          id: d.id,
          content: JSON.parse(d.data().content),
        }))
        .sort((a, b) => a.order - b.order);
      setOverviewPagesData(pagesList);
      setIsLoading(false); 
    });
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setCurrentView('transactionDetail');
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentDetails.recipient || !paymentDetails.amount || paymentDetails.bankName === 'Select bank' || !paymentDetails.accountNumber) return;
    setIsLoading(true);

    const appId = 'van-schalkwyk-trust-mobile';
    if (!db || !userId) {
      setIsLoading(false);
      return;
    }

    const paymentAmount = parseFloat(paymentDetails.amount);
    let fromAccountInfo = {};

    if (paymentDetails.fromAccount === 'current') {
      fromAccountInfo = { ref: doc(db, `artifacts/${appId}/users/${userId}/accountData/balance`), col: collection(db, `artifacts/${appId}/users/${userId}/transactions`), balance: accountBalance, name: "Savvy Bundle Current Account" };
    } else if (paymentDetails.fromAccount === 'second') {
      fromAccountInfo = { ref: doc(db, `artifacts/${appId}/users/${userId}/secondAccountData/balance`), col: collection(db, `artifacts/${appId}/users/${userId}/secondAccountTransactions`), balance: secondAccountBalance, name: "Platinum Cheque" };
    } else {
      fromAccountInfo = { ref: doc(db, `artifacts/${appId}/users/${userId}/thirdAccountData/balance`), col: collection(db, `artifacts/${appId}/users/${userId}/thirdAccountTransactions`), balance: thirdAccountBalance, name: "Platinum Cheque" };
    }

    const newBalance = fromAccountInfo.balance - paymentAmount;
    if (newBalance < 0) {
      console.error("Insufficient funds");
      setIsLoading(false);
      return;
    }
    
    try {
      const counterRef = doc(db, `artifacts/${appId}/users/${userId}/transactionCounter/counter`);
      const newTransactionRefNumber = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let newCounterValue;
        if (!counterDoc.exists()) {
          newCounterValue = 3692825731; // Initial value
          transaction.set(counterRef, { value: newCounterValue });
        } else {
          newCounterValue = counterDoc.data().value + 1;
          transaction.update(counterRef, { value: newCounterValue });
        }
        return newCounterValue;
      });

      const newTransaction = {
        description: (paymentDetails.yourReference || `${paymentDetails.recipient}`).toUpperCase(),
        amount: `-R${paymentAmount.toFixed(2)}`,
        timestamp: serverTimestamp(),
      };
      await setDoc(fromAccountInfo.ref, { value: newBalance });
      await addDoc(fromAccountInfo.col, newTransaction);
      
      if (paymentDetails.sendSms && paymentDetails.recipientPhone) {
        try {
          const notification = await sendPaymentNotification({
            recipientName: paymentDetails.recipient,
            amount: paymentAmount,
            senderName: 'Van Schalkwyk Family Trust',
            yourReference: paymentDetails.yourReference,
          });

          await sendSms({
            to: paymentDetails.recipientPhone,
            message: notification.smsMessage,
          });

          alert(`SMS sent to ${paymentDetails.recipientPhone}!`);

        } catch (aiError) {
          console.error("Failed to send SMS notification:", aiError);
          alert("Failed to send SMS. Please check server logs.");
        }
      }
      const paymentDate = new Date();
      const formattedDate = `${paymentDate.getFullYear()}-${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}-${paymentDate.getDate().toString().padStart(2, '0')}`;
      setLastPayment({
        ...paymentDetails,
        amount: paymentAmount.toFixed(2),
        date: paymentDate,
        reference: paymentDetails.yourReference || `${paymentDetails.recipient.toUpperCase()}`,
        transactionNumber: `${formattedDate}/Nedbank/00${newTransactionRefNumber}`,
        fromAccountName: fromAccountInfo.name,
      });
      setPaymentDetails({ recipient: '', bankName: 'Select bank', accountNumber: '', paymentMethod: 'Standard EFT', amount: '', yourReference: '', recipientsReference: '', recipientPhone: '', sendSms: false, saveRecipient: false, fromAccount: 'current' });
      setCurrentView('paymentConfirmation');
    } catch (error) {
      console.error("Error processing payment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecipient = async () => {
    if (!lastPayment || !db || !userId || isRecipientSaved) return;
    const appId = 'van-schalkwyk-trust-mobile';
    const recipientsColRef = collection(db, `artifacts/${appId}/users/${userId}/recipients`);
    try {
      await addDoc(recipientsColRef, {
        name: lastPayment.recipient,
        bank: lastPayment.bankName,
        accountNumber: lastPayment.accountNumber,
        lastPaid: serverTimestamp(),
      });
      setIsRecipientSaved(true);
    } catch (error) {
      console.error("Error saving recipient:", error);
    }
  };

  const handleShareProof = () => {
    if (!lastPayment) return;
    const popWindow = window.open('', '_blank');
    const paymentDate = new Date(lastPayment.date);
    const formattedDate = `${paymentDate.getDate().toString().padStart(2, '0')}/${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}/${paymentDate.getFullYear()}`;
    const securityCode = 'DB85BE175B1E35A823EBD2CDE32DC8D542472D1A'; 

    const popContent = `
      <html>
        <head>
          <title>Proof of Payment</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; font-size: 12px; }
            .container { max-width: 750px; margin: auto; padding: 20px; border: 1px solid #ddd; }
            .header { display: flex; align-items: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
            .header img { width: 50px; height: auto; }
            h1 { font-size: 18px; color: #333; margin: 0; }
            .section { margin-top: 20px; }
            .section h2 { font-size: 14px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
            .details-table { width: 100%; border-collapse: collapse; }
            .details-table td { padding: 4px 0; }
            .details-table td:first-child { font-weight: normal; width: 25%; }
            .details-table td:nth-child(2) { width: 5%; text-align: center; }
            .details-table td:nth-child(3) { font-weight: bold; }
            .disclaimer { font-size: 10px; color: #555; margin-top: 20px; }
            .footer { font-size: 9px; color: #777; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://firebasestorage.googleapis.com/v0/b/van-schalkwyk-trust-mobile.firebasestorage.app/o/logo.png?alt=media&token=0b61c15f-3d8b-4a6c-85f0-6c38a161353c" alt="Nedbank Logo">
            </div>
            <div class="section">
              <h1>Notification of Payment</h1>
              <p>Nedbank Limited confirms that the following payment has been made:</p>
              <table class="details-table">
                <tr><td>Date of Payment</td><td>:</td><td>${formattedDate}</td></tr>
                <tr><td>Reference Number</td><td>:</td><td>${lastPayment.transactionNumber}</td></tr>
              </table>
            </div>

            <div class="section">
              <h2>Beneficiary details</h2>
              <table class="details-table">
                <tr><td>Recipient</td><td>:</td><td>${lastPayment.recipient}</td></tr>
                <tr><td>Amount</td><td>:</td><td>R${parseFloat(lastPayment.amount).toFixed(2)}</td></tr>
                <tr><td>Recipient Reference</td><td>:</td><td>${lastPayment.recipientsReference || lastPayment.yourReference || 'N/A'}</td></tr>
                <tr><td>Bank</td><td>:</td><td>${lastPayment.bankName.toUpperCase()}</td></tr>
                <tr><td>Account Number</td><td>:</td><td>...${lastPayment.accountNumber.slice(-6)}</td></tr>
                <tr><td>Channel</td><td>:</td><td>Internet payment</td></tr>
              </table>
            </div>
            
            <div class="section">
              <h2>Payer details</h2>
              <table class="details-table">
                <tr><td>Paid from Account Holder</td><td>:</td><td>VAN SCHALKWYK FAMILY TRUST</td></tr>
              </table>
            </div>
            
            <p class="disclaimer" style="margin-top: 20px;">Nedbank will never send you an e-mail link to access Verify payments, always go to Online Banking on www.nedbank.co.za and click on Verify payments.</p>
            <p class="disclaimer">This notification of payment is sent to you by Nedbank Limited Reg No 1951/000009/06. Enquiries regarding this payment notification should be directed to the Nedbank Contact Centre on 0860 555 111. Please contact the payer for enquiries regarding the contents of this notification. Nedbank Ltd will not be held responsible for the accuracy of the information on this notification and we accept no liability whatsoever arising from the transmission and use of the information. Payments may take up to three business days. Please check your account to verify the existence of the funds.</p>
            <p class="disclaimer">Note: We as a bank will never send you an e-mail requesting you to enter your personal details or private identification and authentication details.</p>

            <div class="section">
              <h2>Nedbank Limited email disclaimer</h2>
              <p class="disclaimer">This email and any accompanying attachments may contain confidential and proprietary information. This information is private and protected by law and, accordingly, if you are not the intended recipient, you are requested to delete this entire communication immediately and are notified that any disclosure, copying or distribution of or taking any action based on this information is prohibited. Emails cannot be guaranteed to be secure or free of errors or viruses. The sender does not accept any liability or responsibility for any interception, corruption, destruction, loss, late arrival or incompleteness of or tampering or interference with any of the information contained in this email or for its incorrect delivery or non-delivery for whatsoever reason or for its effect on any electronic device of the recipient. If verification of this email or any attachment is required, please request a hard copy version.</p>
            </div>
            
            <div class="section">
              <table class="details-table">
                <tr><td>Security Code</td><td>:</td><td>${securityCode}</td></tr>
              </table>
            </div>

            <div class="footer">
              <p>Nedbank Limited Reg No 1951/000009/06 VAT Reg No 4320116074 135 Rivonia Road Sandown Sandton 2196 South Africa</p>
              <p>We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services.<br>We are an authorised financial services provider. We are a registered credit provider in terms of the National Credit Act (NCR Reg No NCRCP16).</p>
            </div>
          </div>
        </body>
      </html>
    `;
    popWindow.document.write(popContent);
    popWindow.document.close();
  };
  
  const handleCarouselScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const newIndex = Math.round(scrollLeft / clientWidth);
      if (newIndex !== carouselIndex) setCarouselIndex(newIndex);
    }
  };

  const scrollToPage = (index) => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({ left: clientWidth * index, behavior: 'smooth' });
      setCarouselIndex(index);
    }
  };

  const handleTabClick = (label, view) => {
    setActiveTab(label);
    const implementedViews = ['overview', 'transactLanding', 'recipients'];
    if (implementedViews.includes(view)) {
      setCurrentView(view);
    } else {
      console.log(`Navigation to '${view}' is not implemented yet.`);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <LoginPage setCurrentView={setCurrentView} />;
      case 'overview':
        return (
          <OverviewPage
            userId={userId}
            overviewPagesData={overviewPagesData}
            balances={{ accountBalance, secondAccountBalance, thirdAccountBalance }}
            carouselIndex={carouselIndex}
            handleCarouselScroll={handleCarouselScroll}
            scrollToPage={scrollToPage}
            setCurrentView={setCurrentView}
            scrollContainerRef={scrollContainerRef}
          />
        );
      case 'transactions':
        return (
          <TransactionsPage
            accountName="Savvy Bundle Current Account"
            currentBalance={accountBalance}
            transactionsList={combinedTransactions}
            backView="overview"
            setCurrentView={setCurrentView}
            handleTransactionClick={handleTransactionClick}
          />
        );
      case 'secondAccountTransactions':
        return (
          <TransactionsPage
            accountName="Platinum Cheque"
            currentBalance={secondAccountBalance}
            transactionsList={secondCombinedTransactions}
            backView="overview"
            setCurrentView={setCurrentView}
            handleTransactionClick={handleTransactionClick}
          />
        );
      case 'thirdAccountTransactions':
        return (
          <TransactionsPage
            accountName="Platinum Cheque"
            currentBalance={thirdAccountBalance}
            transactionsList={thirdCombinedTransactions}
            backView="overview"
            setCurrentView={setCurrentView}
            handleTransactionClick={handleTransactionClick}
          />
        );
      case 'failedTransactions':
        return (
          <FailedTransactionsPage
            failedTransactionsData={failedTransactionsData}
            setCurrentView={setCurrentView}
          />
        );
      case 'transactionDetail':
        return (
          <TransactionDetailPage
            selectedTransaction={selectedTransaction}
            setCurrentView={setCurrentView}
          />
        );
      case 'transactLanding':
        return <TransactLandingPage setCurrentView={setCurrentView} />;
      case 'payment':
        return (
          <PaymentPage
            paymentDetails={paymentDetails}
            setPaymentDetails={setPaymentDetails}
            handlePaymentSubmit={handlePaymentSubmit}
            setCurrentView={setCurrentView}
            showBankModal={showBankModal}
            setShowBankModal={setShowBankModal}
            bankSearchQuery={bankSearchQuery}
            setBankSearchQuery={setBankSearchQuery}
          />
        );
      case 'recipients':
        return <RecipientsPage recipients={recipients} setCurrentView={setCurrentView} />;
      case 'paymentConfirmation':
        return lastPayment ? (
          <PaymentConfirmationPage
            lastPayment={lastPayment}
            onShareProof={handleShareProof}
            onSaveRecipient={handleSaveRecipient}
            isRecipientSaved={isRecipientSaved}
            onDone={() => setCurrentView('overview')}
          />
        ) : (
          <OverviewPage
            userId={userId}
            overviewPagesData={overviewPagesData}
            balances={{ accountBalance, secondAccountBalance, thirdAccountBalance }}
            carouselIndex={carouselIndex}
            handleCarouselScroll={handleCarouselScroll}
            scrollToPage={scrollToPage}
            setCurrentView={setCurrentView}
            scrollContainerRef={scrollContainerRef}
          />
        );
      default:
        return <SplashScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {currentView === 'start' || (isLoading && currentView !== 'login') ? (
        <SplashScreen />
      ) : (
        <div className="flex flex-col h-screen">
          {renderCurrentView()}
          {currentView !== 'start' && currentView !== 'login' &&
            !isLoading &&
            !['paymentConfirmation', 'transactionDetail', 'transactLanding', 'payment'].includes(currentView) && (
              <BottomNavBar activeTab={activeTab} onTabClick={handleTabClick} />
            )}
        </div>
      )}
    </div>
  );
};

export default App;
    