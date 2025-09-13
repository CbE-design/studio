
'use client';
import { ShieldAlert } from 'lucide-react';

const AuthError = ({ errorCode }: { errorCode: string | null }) => {
    
    const getErrorMessage = () => {
        switch(errorCode) {
            case 'ANONYMOUS_SIGN_IN_DISABLED':
                return {
                    title: 'Configuration Required',
                    message: "This app uses Firebase for its backend, but a necessary feature, 'Anonymous Authentication', is not enabled. This is a one-time setup.",
                    steps: [
                        "Go to your Firebase Console.",
                        "Navigate to the 'Authentication' section.",
                        "Click on the 'Sign-in method' tab.",
                        "Find 'Anonymous' in the list of providers and enable it."
                    ],
                    footer: "After enabling it, please refresh this page."
                };
            default:
                return {
                    title: 'An Unexpected Error Occurred',
                    message: 'Something went wrong during the application startup. Please check the browser console for more details or try again later.',
                    steps: [],
                    footer: 'If the problem persists, please contact support.'
                };
        }
    }
    
    const { title, message, steps, footer } = getErrorMessage();

    return (
        <div className="flex flex-col h-screen items-center justify-center bg-gray-100 p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
                <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
                <p className="text-gray-600 mb-6">{message}</p>
                {steps.length > 0 && (
                    <div className="text-left bg-gray-50 p-4 rounded-lg border">
                        <h2 className="font-semibold mb-2">How to fix this:</h2>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                            {steps.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ol>
                    </div>
                )}
                <p className="text-sm text-gray-500 mt-6">{footer}</p>
            </div>
        </div>
    );
};

export default AuthError;
