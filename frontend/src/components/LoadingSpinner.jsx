import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="flex flex-col w-full min-h-[50vh] items-center justify-center space-y-6 animate-fadeIn bg-slate-50/10 rounded-3xl">
            <div className="w-16 h-16 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="text-center">
                <p className="text-xl font-black text-slate-800 animate-pulse uppercase tracking-widest">
                    CARGANDO...
                </p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
