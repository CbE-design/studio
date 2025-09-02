'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  signInAnonymously,
  onAuthStateChanged,
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
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

import SplashScreen from '@/components/SplashScreen';
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
  const [userId, setUserId] = useState(null);
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
    const timer = setTimeout(() => setCurrentView('overview'), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchData(db, user.uid);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Anonymous sign-in failed:", error);
          // Handle the error appropriately in a real app
          // For now, we'll just log it and let the app continue without a user
          setIsLoading(false);
        }
      }
    });
    return () => unsubscribe();
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
    const seedMarkerSnap = await getDoc(seedMarkerRef);

    if (!seedMarkerSnap.exists()) {
      console.log("Seeding initial data...");
      const batch = writeBatch(db);
      
      batch.set(doc(db, `artifacts/${appId}/users/${uid}/accountData/balance`), { value: 1590835.19 + 16300000 + 500000 });
      batch.set(doc(db, `artifacts/${appId}/users/${uid}/secondAccountData/balance`), { value: 1600904.90 });
      batch.set(doc(db, `artifacts/${appId}/users/${uid}/thirdAccountData/balance`), { value: 4775.00 });

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
        { title: 'International banking and travel', order: 4, content: JSON.stringify([ { type: 'action', title: 'Incoming and outgoing payments', value: 'International payments', actionText: 'View', color: 'yellow' }, { type: 'item', title: 'Foreign Currency Accounts', value: 'Your currencies' }, { type: 'item', 'title': 'Travel Card', value: 'Mr C Van Schalkwyk' } ]) },
        { title: 'Insurance', order: 5, content: JSON.stringify([ { type: 'item', title: 'My policies and applications', value: 'Insurance' }, { type: 'item', title: 'Funeral Plan', value: 'Policy #FP12345' }, { type: 'item', title: 'Car Insurance', value: 'Policy #CI67890' }, { type: 'action', title: 'Insurance', value: 'New policy', actionText: 'Get cover', color: 'yellow' } ]) },
        { title: 'Lifestyle', order: 6, content: JSON.stringify([ { type: 'action', title: 'Unlock greater financial benefits', value: 'Family Banking', actionText: 'View', color: 'yellow' }, { type: 'item', title: 'Greenbacks Rewards', value: 'View your points' }, { type: 'item', title: 'Digital Vouchers', value: 'Buy and send vouchers' }, ]) }
      ];
      pagesData.forEach(page => batch.set(doc(overviewPagesColRef, page.title), page));
      batch.set(seedMarkerRef, { seeded: true, timestamp: serverTimestamp() });
      await batch.commit();
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
      const newTransaction = {
        description: (paymentDetails.yourReference || `${paymentDetails.recipient}`).toUpperCase(),
        amount: `-R${paymentAmount.toFixed(2)}`,
        timestamp: serverTimestamp(),
      };
      await setDoc(fromAccountInfo.ref, { value: newBalance });
      await addDoc(fromAccountInfo.col, newTransaction);
      setLastPayment({
        ...paymentDetails,
        amount: paymentAmount.toFixed(2),
        date: new Date(),
        reference: paymentDetails.yourReference || `${paymentDetails.recipient.toUpperCase()}`,
        transactionNumber: `20250817/Nedbank/${Math.floor(Math.random() * 1e11)}`,
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
    const popContent = `<html><head><title>Proof of Payment</title><style>body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#333}.container{max-width:680px;margin:auto;border:1px solid #eee;padding:30px}h1{font-size:24px;color:#333;margin:0}p{font-size:14px;line-height:1.6;margin:1em 0}.details-table{width:100%;margin:30px 0}.details-table td{padding:8px 0;font-size:14px;border-bottom:1px solid #eee}.details-table td:first-child{font-weight:700;width:35%}.section-title{font-size:14px;font-weight:700;margin-top:20px;border-bottom:1px solid #ccc;padding-bottom:5px}.footer{font-size:10px;color:#777;margin-top:30px;line-height:1.5}</style></head><body><div class="container"><h1>Notification of Payment</h1><p>Nedbank Limited confirms that the following payment has been made:</p><table class="details-table"><tr><td>Date of Payment</td><td>: ${lastPayment.date.toLocaleDateString('en-ZA')}</td></tr><tr><td>Reference Number</td><td>: ${lastPayment.transactionNumber}</td></tr></table><p class="section-title">Beneficiary details</p><table class="details-table"><tr><td>Recipient</td><td>: ${lastPayment.recipient}</td></tr><tr><td>Amount</td><td>: R ${lastPayment.amount}</td></tr><tr><td>Recipient Reference</td><td>: ${lastPayment.recipientsReference || 'N/A'}</td></tr><tr><td>Bank</td><td>: ${lastPayment.bankName.toUpperCase()}</td></tr><tr><td>Account Number</td><td>: ...${lastPayment.accountNumber.slice(-6)}</td></tr><tr><td>Channel</td><td>: Internet payment</td></tr></table><p class="section-title">Payer details</p><table class="details-table"><tr><td>Paid from Account Holder</td><td>: JOHN DOE</td></tr><tr><td>Paid from Account</td><td>: ${lastPayment.fromAccountName}</td></tr></table><div class="footer">This notification of payment is sent to you by Nedbank Limited Reg No 1951/000009/06. Enquiries regarding this payment notification should be directed to the Nedbank Contact Centre on 0860 555 111. Please contact the payer for enquiries regarding the contents of this notification.<br/><br/>Payments may take up to three business days. Please check your account to verify the existence of the funds.</div></div></body></html>`;
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
      {currentView === 'start' ? (
        <SplashScreen />
      ) : (
        <div className="flex flex-col h-screen">
          {renderCurrentView()}
          {currentView !== 'start' &&
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
