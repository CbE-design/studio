'use client';
import { Bell, User, Phone, Lock, Settings, Share2, FileText, Smartphone, ChevronRight, Plus } from 'lucide-react';

const MorePage = ({ setCurrentView }) => {
    const options = [
        { icon: <Bell size={24} className="text-gray-500" />, label: 'Notifications' },
        { icon: <User size={24} className="text-gray-500" />, label: 'Applications' },
        { icon: <Smartphone size={24} className="text-gray-500" />, label: 'Nedbank Connect', new: true },
        { icon: <FileText size={24} className="text-gray-500" />, label: 'Statements and Documents', onClick: () => setCurrentView('statementAccount') },
        { icon: <Phone size={24} className="text-gray-500" />, label: 'Get in touch' },
        { icon: <Lock size={24} className="text-gray-500" />, label: 'Login and security' },
        { icon: <Settings size={24} className="text-gray-500" />, label: 'Settings' },
        { icon: <Share2 size={24} className="text-gray-500" />, label: 'Share the Money App' },
        { icon: <FileText size={24} className="text-gray-500" />, label: 'Terms and conditions' },
    ];

    const profiles = [
      { name: 'John', initial: 'J' },
      { name: 'Jaco', initial: 'J' },
      { name: 'Xavier', initial: 'X' },
      { name: 'Corrie', initial: 'C' },
    ];

    return (
        <div className="flex flex-col h-screen bg-white">
            <main className="flex-1 overflow-y-auto pb-16">
                <div className="p-4 bg-white">
                    <div className="flex justify-around items-center text-center p-4">
                        {profiles.map(profile => (
                            <div key={profile.name} className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mb-2">
                                    <span className="text-2xl font-semibold text-gray-700">{profile.initial}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-800">{profile.name}</span>
                            </div>
                        ))}
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full border border-gray-400 flex items-center justify-center mb-2">
                                <Plus size={24} className="text-gray-500" />
                            </div>
                            <span className="text-sm text-gray-500">Link a Profile</span>
                        </div>
                    </div>
                </div>
                <hr className="border-gray-200" />
                <ul>
                    {options.map((option, index) => (
                        <li 
                            key={index} 
                            onClick={option.onClick}
                            className="flex items-center p-4 border-b border-gray-200 last:border-b-0 cursor-pointer"
                        >
                            <div className="w-10 h-10 flex items-center justify-center rounded-full mr-4">
                                {option.icon}
                            </div>
                            <span className="flex-1 text-gray-800">{option.label}</span>
                            {option.new && <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-md mr-2">New</span>}
                            <ChevronRight size={20} className="text-gray-400" />
                        </li>
                    ))}
                </ul>
                <div className="p-4 text-center text-xs text-gray-500 mt-4">
                    <p>App Version: V9.5.8-0-prod</p>
                    <p className="mt-1">emCertID: 593901787</p>
                    <p className="mt-4">
                        Nedbank Ltd Reg No 1951/000009/06. Licensed financial services
                        provider (FSP9363) and registered credit provider (NCRCP16)
                    </p>
                </div>
            </main>
        </div>
    );
};

export default MorePage;