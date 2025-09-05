'use client';
import { useRef } from 'react';
import { Check, Share2, Save, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Image from 'next/image';

const ProofOfPaymentContent = ({ lastPayment, forwardedRef }) => {
  if (!lastPayment) return null;

  const paymentDate = new Date(lastPayment.date);
  const formattedDate = `${paymentDate.getDate().toString().padStart(2, '0')}/${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}/${paymentDate.getFullYear()}`;
  const securityCode = 'DB85BE175B1E35A823EBD2CDE32DC8D542472D1A';

  return (
    <div ref={forwardedRef} className="p-4 bg-white" style={{ fontFamily: 'Arial, sans-serif', color: '#333', fontSize: '12px', width: '750px' }}>
      <div style={{ maxWidth: '750px', margin: 'auto', padding: '20px', border: '1px solid #ddd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
            {/* Replace the placeholder with your actual Firebase Storage URL */}
            <img src="https://firebasestorage.googleapis.com/v0/b/van-schalkwyk-trust-mobile.appspot.com/o/nedbank-logo.png?alt=media" alt="Nedbank Logo" style={{ width: '120px', height: 'auto' }} />
        </div>
        <div style={{ marginTop: '20px' }}>
          <h1 style={{ fontSize: '18px', color: '#333', margin: '0' }}>Notification of Payment</h1>
          <p>Nedbank Limited confirms that the following payment has been made:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 0', fontWeight: 'normal', width: '25%' }}>Date of Payment</td><td style={{ width: '5%', textAlign: 'center' }}>:</td><td style={{ fontWeight: 'bold' }}>{formattedDate}</td></tr>
              <tr><td style={{ padding: '4px 0', fontWeight: 'normal', width: '25%' }}>Reference Number</td><td style={{ width: '5%', textAlign: 'center' }}>:</td><td style={{ fontWeight: 'bold' }}>{lastPayment.transactionNumber}</td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Beneficiary details</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 0', fontWeight: 'normal', width: '25%' }}>Recipient</td><td style={{ width: '5%', textAlign: 'center' }}>:</td><td style={{ fontWeight: 'bold' }}>{lastPayment.recipient}</td></tr>
              <tr><td style={{ padding: '4px 0', fontWeight: 'normal', width: '25%' }}>Amount</td><td style={{ width: '5%', textAlign: 'center' }}>:</td><td style={{ fontWeight: 'bold' }}>R{parseFloat(lastPayment.amount).toFixed(2)}</td></tr>
              <tr><td style={{ padding: '4px 0', fontWeight: 'normal', width: '25%' }}>Recipient Reference</td><td style={{ width: '5%', textAlign: 'center' }}>:</td><td style={{ fontWeight: 'bold' }}>{lastPayment.recipientsReference || lastPayment.yourReference || 'N/A'}</td></tr>
              <tr><td style={{ padding: '4px 0', fontWeight: 'normal', width: '25%' }}>Bank</td><td style={{ width: '5%', textAlign: 'center' }}>:</td><td style={{ fontWeight: 'bold' }}>{lastPayment.bankName.toUpperCase()}</td></tr>
              <tr><td style={{ padding: '4px 0', fontWeight: 'normal', width: '25%' }}>Account Number</td><td style={{ width: '5%', textAlign: 'center' }}>:</td><td style={{ fontWeight: 'bold' }}>...{lastPayment.accountNumber.slice(-6)}</td></tr>
              <tr><td style={{ padding: '4px 0', fontWeight: 'normal', width: '25%' }}>Channel</td><td style={{ width: '5%', textAlign: 'center' }}>:</td><td style={{ fontWeight: 'bold' }}>Internet payment</td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Payer details</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 0', fontWeight: 'normal', width: '25%' }}>Paid from Account Holder</td><td style={{ width: '5%', textAlign: 'center' }}>:</td><td style={{ fontWeight: 'bold' }}>VAN SCHALKWYK FAMILY TRUST</td></tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '10px', color: '#555', marginTop: '20px' }}>Nedbank will never send you an e-mail link to access Verify payments, always go to Online Banking on www.nedbank.co.za and click on Verify payments.</p>
        <p style={{ fontSize: '10px', color: '#555', marginTop: '20px' }}>This notification of payment is sent to you by Nedbank Limited Reg No 1951/000009/06. Enquiries regarding this payment notification should be directed to the Nedbank Contact Centre on 0860 555 111. Please contact the payer for enquiries regarding the contents of this notification. Nedbank Ltd will not be held responsible for the accuracy of the information on this notification and we accept no liability whatsoever arising from the transmission and use of the information. Payments may take up to three business days. Please check your account to verify the existence of the funds.</p>
        <p style={{ fontSize: '10px', color: '#555', marginTop: '20px' }}>Note: We as a bank will never send you an e-mail requesting you to enter your personal details or private identification and authentication details.</p>
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Nedbank Limited email disclaimer</h2>
          <p style={{ fontSize: '10px', color: '#555' }}>This email and any accompanying attachments may contain confidential and proprietary information. This information is private and protected by law and, accordingly, if you are not the intended recipient, you are requested to delete this entire communication immediately and are notified that any disclosure, copying or distribution of or taking any action based on this information is prohibited. Emails cannot be guaranteed to be secure or free of errors or viruses. The sender does not accept any liability or responsibility for any interception, corruption, destruction, loss, late arrival or incompleteness of or tampering or interference with any of the information contained in this email or for its incorrect delivery or non-delivery for whatsoever reason or for its effect on any electronic device of the recipient. If verification of this email or any attachment is required, please request a hard copy version.</p>
        </div>
        <div style={{ marginTop: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 0', fontWeight: 'normal', width: '25%' }}>Security Code</td><td style={{ width: '5%', textAlign: 'center' }}>:</td><td style={{ fontWeight: 'bold' }}>{securityCode}</td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: '9px', color: '#777', marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
          <p>Nedbank Limited Reg No 1951/000009/06 VAT Reg No 4320116074 135 Rivonia Road Sandown Sandton 2196 South Africa</p>
          <p>We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services.<br />We are an authorised financial services provider. We are a registered credit provider in terms of the National Credit Act (NCR Reg No NCRCP16).</p>
        </div>
      </div>
    </div>
  );
};

const PaymentConfirmationPage = ({ lastPayment, onShareProof, onSaveRecipient, isRecipientSaved, onDone }) => {
  const popRef = useRef(null);

  const handleDownloadPdf = async () => {
    const element = popRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2, // Improves quality
      useCORS: true, // Important for external images
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('ProofOfPayment.pdf');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      {/* Hidden element for PDF generation */}
      <div className="absolute -z-10 -left-[9999px] top-0">
        <ProofOfPaymentContent lastPayment={lastPayment} forwardedRef={popRef} />
      </div>

      <header className="bg-white p-4 flex justify-between items-center w-full shadow-md">
        <span className="text-lg font-semibold">Payment successful</span>
        <Check size={24} className="text-green-500" />
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md mx-auto">
          <div className="text-center mb-6 pb-4 border-b">
            <p className="text-3xl font-bold text-gray-900">-R {lastPayment.amount}</p>
            <p className="text-lg font-semibold mt-2">{lastPayment.recipient}</p>
            <p className="text-sm text-gray-500">{lastPayment.bankName} - ...{lastPayment.accountNumber.slice(-4)}</p>
          </div>
          <div className="space-y-3 text-left text-sm">
            <div className="flex justify-between"><p className="text-gray-500">Date</p><p className="font-medium">{lastPayment.date.toLocaleDateString('en-ZA')}</p></div>
            <div className="flex justify-between"><p className="text-gray-500">From account</p><p className="font-medium">{lastPayment.fromAccountName}</p></div>
            <div className="flex justify-between"><p className="text-gray-500">Your reference</p><p className="font-medium">{lastPayment.yourReference || 'N/A'}</p></div>
            <div className="flex justify-between"><p className="text-gray-500">Recipient's reference</p><p className="font-medium">{lastPayment.recipientsReference || 'N/A'}</p></div>
          </div>
          <div className="mt-6 space-y-3">
            <button onClick={onShareProof} className="w-full flex items-center justify-center bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold"><Share2 size={18} className="mr-2" /> Share proof of payment</button>
            <button onClick={handleDownloadPdf} className="w-full flex items-center justify-center bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold"><Download size={18} className="mr-2" /> Download PDF</button>
            <button onClick={onSaveRecipient} disabled={isRecipientSaved} className={`w-full flex items-center justify-center py-3 rounded-xl font-semibold ${isRecipientSaved ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-800'}`}><Save size={18} className="mr-2" /> {isRecipientSaved ? 'Recipient Saved' : 'Save recipient'}</button>
          </div>
        </div>
      </main>
      <footer className="p-4 bg-white border-t">
        <button onClick={onDone} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold">Done</button>
      </footer>
    </div>
  );
};

export default PaymentConfirmationPage;
