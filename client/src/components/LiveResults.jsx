export default function LiveResults({ question, options = [], total }) {
    const voteTotal =
        typeof total === 'number' ? total : options.reduce((sum, o) => sum + (o.votes || 0), 0)

    const correctOptions = options.filter(o => o.correct === true)

    return (
        <div className="">
            <div className="flex items-center text-start  justify-between mb-2">
                <h3 className="text-lg font-semibold">Question</h3>
                <span className="text-sm text-gray-500">{voteTotal} responses</span>
            </div>
            <div className="bg-white rounded-md pb-4  border border-[#AF8FF1] ">
                <div className="mb-4 rounded-t-md px-4 py-3 text-sm text-white text-start bg-[linear-gradient(90deg,#343434_0%,#6E6E6E_100%)]">
                    {question || 'No active question'}
                </div>

                <div className="space-y-3">
                    {options.map(opt => {
                        const votes = opt.votes || 0
                        const pct = voteTotal > 0 ? Math.round((votes / voteTotal) * 100) : 0
                        const barColor = 'bg-[#6766D5]'
                        return (
                            <div key={opt.id} className="relative mx-4">
                                <div className={`h-9 rounded-md bg-gray-100 border border-gray-200 overflow-hidden `}>
                                    <div
                                        className={`h-full transition-all ${barColor}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className="absolute inset-0 px-3 flex items-center justify-between">
                                    <div className="inline-flex items-center gap-2 text-sm text-gray-800">
                                        <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] bg-white border border-gray-300 text-gray-500`}>i</span>
                                        <span>{opt.text}</span>
                                        {opt.correct && <span className="ml-2 text-xs text-green-600 font-medium">Correct</span>}
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">{pct}%</span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {correctOptions.length > 0 && (
                    <div className="mt-4 px-4 text-sm text-start">
                        <span className="font-semibold">Correct answer{correctOptions.length > 1 ? 's' : ''}:</span>
                        <span className="ml-2">{correctOptions.map(o => o.text).join(', ')}</span>
                    </div>
                )}
            </div>
        </div>
    )
}


