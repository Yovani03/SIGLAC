import React, { useState, useEffect } from 'react';

const OnlineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className={`hidden md:flex items-center px-4 py-2 rounded-2xl border transition-all ${isOnline ? 'bg-slate-50 border-slate-100' : 'bg-rose-50 border-rose-100'
            }`}>
            <span className={`w-2 h-2 rounded-full mr-3 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}></span>
            <span className={`text-xs font-bold ${isOnline ? 'text-slate-600' : 'text-rose-600'
                }`}>
                {isOnline ? 'SISTEMA ONLINE' : 'SISTEMA OFFLINE'}
            </span>
        </div>
    );
};

export default OnlineIndicator;
