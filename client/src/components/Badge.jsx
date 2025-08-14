import React from 'react'

export default function Badge({ className = '', size = 'xs', showIcon = true }) {
    const sizeClass = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-xs'
    const iconSizeClass = size === 'md' ? 'text-base' : 'text-sm'
    return (
        <div
            className={`inline-flex items-center gap-2 ${sizeClass} text-white px-3 py-1 rounded-full bg-[linear-gradient(90deg,#7565D9_0%,#4D0ACD_100%)] ${className}`}
        >
            {showIcon && <span className={iconSizeClass}><img src="Vector.png" alt="" /></span>}
            Intervue Poll
        </div>
    )
}
