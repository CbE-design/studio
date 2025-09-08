'use client';

import { X } from 'lucide-react';

const PayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 7.5H21.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.5 13.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17.5 13.5V17.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19.5 15.5H15.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.5 4.5H3.5C2.9 4.5 2.5 4.9 2.5 5.5V18.5C2.5 19.1 2.9 19.5 3.5 19.5H20.5C21.1 19.5 21.5 19.1 21.5 18.5V5.5C21.5 4.9 21.1 4.5 20.5 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const TransferIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.5 14.5H3.5L7.5 18.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.5 9.5H20.5L16.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const BuyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2L3 6V22H21V2H7Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 2V6H3" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 14H16" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 18H13" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 10H10" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


const TransactModal = ({ onClose, onNavigate }) => {
    const handleActionClick = (view) => {
        if (view) {
            onNavigate(view);
        } else {
            alert('This feature is not yet implemented.');
            onClose();
        }
    };
    
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex flex-col justify-end items-center" 
            onClick={onClose}
        >
            <div 
                className="w-full max-w-lg mb-24 flex justify-around items-center"
                onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking on the buttons area
            >
                <div className="flex flex-col items-center" onClick={() => handleActionClick(null)}>
                    <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center text-gray-800 shadow-lg">
                        <TransferIcon />
                    </div>
                    <span className="text-white mt-2 text-sm">Transfer</span>
                </div>
                
                <div className="flex flex-col items-center transform -translate-y-10" onClick={() => handleActionClick('payment')}>
                    <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center text-gray-800 shadow-lg">
                        <PayIcon />
                    </div>
                    <span className="text-white mt-2 text-sm">Pay</span>
                </div>
                
                <div className="flex flex-col items-center" onClick={() => handleActionClick(null)}>
                    <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center text-gray-800 shadow-lg">
                        <BuyIcon />
                    </div>
                    <span className="text-white mt-2 text-sm">Buy</span>
                </div>
            </div>
            
            <button
                onClick={onClose}
                className="absolute bottom-16 mb-2 text-white bg-gray-800 rounded-full p-2"
                style={{ transform: 'translateY(50%)' }} // Position half-way over the bottom edge
            >
                <X size={24} />
            </button>
        </div>
    );
};

export default TransactModal;
