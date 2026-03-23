import React from 'react';

const Button = ({ 
    children, 
    onClick, 
    type = 'button', 
    variant = 'primary', 
    className = '', 
    disabled = false,
    icon: Icon = null,
    fullWidth = false,
    ...props 
}) => {
    const baseStyles = "flex items-center justify-center space-x-2 py-4 rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100",
        secondary: "bg-slate-100 text-slate-600 hover:bg-slate-200",
        ghost: "bg-transparent text-slate-400 hover:bg-slate-50",
        danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-xl shadow-rose-100",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100",
        outline: "bg-white border border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600 shadow-sm"
    };

    const widthStyle = fullWidth ? 'w-full' : 'px-8';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant] || variants.primary} ${widthStyle} ${className}`}
            {...props}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {children && <span>{children}</span>}
        </button>
    );
};

export default Button;
