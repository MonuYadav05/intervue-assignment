import { useEffect, useMemo, useState } from 'react'
import Button from './Button'

export default function PollView({ poll, remainingSeconds, onSubmit }) {
    const [selected, setSelected] = useState(null)

    useEffect(() => {
        setSelected(null)
    }, [poll?.id])

    const timerText = useMemo(() => {
        const s = Math.max(0, remainingSeconds ?? 0)
        const mm = String(Math.floor(s / 60)).padStart(2, '0')
        const ss = String(s % 60).padStart(2, '0')
        return `${mm}:${ss}`
    }, [remainingSeconds])

    function handleSubmit(e) {
        e.preventDefault()
        if (!selected) return
        onSubmit?.(selected)
    }

    if (!poll) return null

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-sm font-semibold  mb-2 flex items-center gap-3">
                <span>Question 1</span>
                <span className="inline-flex items-center gap-1 text-red-600">
                    <span>⏱</span>
                    <span className="text-xs font-medium">{timerText}</span>
                </span>
            </div>

            <form onSubmit={handleSubmit} className="rounded-xl overflow-hidden border border-[#AF8FF1]">
                <div className="mb-4 rounded-t-md px-4 py-3 text-sm text-white text-start bg-[linear-gradient(90deg,#343434_0%,#6E6E6E_100%)]">
                    {poll.question || 'No active question'}
                </div>
                <div className="p-4 space-y-3">
                    {poll.options.map(opt => (
                        <button
                            type="button"
                            key={opt.id}
                            onClick={() => setSelected(opt.id)}
                            className={
                                `w-full text-left px-4 py-3 rounded border ` +
                                (selected === opt.id
                                    ? 'border-violet-500 ring-2 ring-violet-200 bg-white'
                                    : 'border-transparent bg-[#F2F2F2] hover:bg-gray-200')
                            }
                        >
                            <span className="inline-flex items-center gap-2 text-sm text-gray-800">
                                <span className="w-5 h-5 rounded-full bg-[#8F64E1] inline-flex items-center justify-center text-[10px] text-white">i</span>
                                {opt.text}
                            </span>
                        </button>
                    ))}
                </div>
            </form>

            <div className="mt-6 flex justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={!selected}
                    className={`w-auto h-auto px-6 py-2 ${!selected ? 'opacity-50' : ''}`}
                >
                    Submit
                </Button>
            </div>
        </div>
    )
}


