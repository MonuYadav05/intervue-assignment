import React from 'react'

export default function Button({
    children,
    onClick,
    type = 'button',
    disabled = false,
    className = '',
    ...props
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                w-[306px] h-[58px] 
                rounded-[34px] 
                bg-[linear-gradient(99.18deg,#8F64E1_-46.89%,#1D68BD_223.45%)]
                text-white font-medium text-base
                transition-all duration-200 ease-in-out
                hover:shadow-lg hover:scale-105
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    )
}
