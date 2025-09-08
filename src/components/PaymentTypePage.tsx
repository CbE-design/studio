'use client';
import { ArrowLeft } from 'lucide-react';

const PaymentTypePage = ({ onSelect, setCurrentView }) => {
    const paymentTypes = [
        { name: 'Standard EFT', details: 'Clears within 48 hours', enabled: true },
        { name: 'Instant Pay', details: 'Clears within 30 minutes at a fee', enabled: true },
        { name: 'PayShap', details: "Not available for recipient's bank", enabled: false },
    ];

    const handleSelect = (type) => {
        if (type.enabled) {
            onSelect(type.name);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            <header className="bg-white text-gray-800 p-4 flex items-center w-full shadow-sm">
                <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('payment')} />
                <h1 className="text-xl font-semibold ml-4">Payment Type</h1>
            </header>
            <main className="flex-1 overflow-y-auto">
                <ul>
                    {paymentTypes.map((type, index) => (
                        <li
                            key={index}
                            onClick={() => handleSelect(type)}
                            className={`p-4 border-b ${type.enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                        >
                            <p className="font-semibold text-gray-900">{type.name}</p>
                            <p className="text-sm text-gray-500">{type.details}</p>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
};

export default PaymentTypePage;
