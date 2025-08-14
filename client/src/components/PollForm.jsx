import { useState } from 'react'
import Button from './Button'
import Badge from './Badge'

const durations = [30, 60, 90, 120]

export default function PollForm({ onStart }) {
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState([
        { id: 'opt_1', text: '', correct: null },
        { id: 'opt_2', text: '', correct: null },
    ])
    const [duration, setDuration] = useState(60)

    function addOption() {
        setOptions(prev => [...prev, { id: `opt_${prev.length + 1}`, text: '', correct: null }])
    }

    function updateOptionText(index, value) {
        setOptions(prev => prev.map((o, i) => (i === index ? { ...o, text: value } : o)))
    }

    function updateOptionCorrect(index, value) {
        setOptions(prev => prev.map((o, i) => (i === index ? { ...o, correct: value } : o)))
    }

    function handleSubmit(e) {
        e.preventDefault()
        if (!question.trim()) {
            alert('Please enter your question before submitting.')
            return
        }
        const filtered = options.filter(o => o.text.trim())
        if (filtered.length < 2) return
        onStart?.({ question: question.trim(), options: filtered, duration })
    }

    const handleQuestionChange = (e) => {
        const value = e.target.value
        if (value.length <= 100) {
            setQuestion(value)
        } else {
            setQuestion(value.slice(0, 100))
        }
    }

    return (
        <form onSubmit={handleSubmit} className=" max-w-3xl text-start">
            <div className="mb-6">
                <Badge />
                <h2 className="mt-4 text-3xl ">
                    Let's <span className="font-semibold">Get Started</span>
                </h2>
                <p className="mt-2 text-gray-500 text-sm">
                    You'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
                </p>
            </div>

            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold">Enter your question</label>
                <div>
                    <select
                        value={duration}
                        onChange={e => setDuration(Number(e.target.value))}
                        className="text-sm bg-[#F2F2F2] rounded-md px-5 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        {durations.map(d => (
                            <option key={d} value={d}>{d} seconds</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="relative">
                <textarea
                    value={question}
                    onChange={handleQuestionChange}
                    placeholder="Type your question here..."
                    rows={4}
                    className="w-full resize-none  bg-[#F2F2F2]  p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <div className="absolute bottom-3 right-4 text-xs text-gray-700">{question.length}/100</div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <p className="text-sm font-semibold mb-2">Edit Options</p>
                    <div className="space-y-3">
                        {options.map((opt, idx) => (
                            <div key={opt.id} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full border bg-[#8F64E1] text-white flex items-center justify-center text-xs">
                                    {idx + 1}
                                </div>
                                <input
                                    value={opt.text}
                                    onChange={e => updateOptionText(idx, e.target.value)}
                                    placeholder={`Option ${idx + 1}`}
                                    className="flex-1 bg-[#F2F2F2] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addOption}
                        className="mt-6 w-auto ml-9 h-auto px-4 py-2 border-2 border-[#7451B6] text-[#7451B6] rounded-lg  text-xs "
                    >
                        + Add More option
                    </button>
                </div>

                <div>
                    <p className="text-sm font-semibold mb-2">Is it Correct?</p>
                    <div className="space-y-9">
                        {options.map((opt, idx) => (
                            <div key={opt.id} className="flex items-center gap-9">
                                <label className="inline-flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        name={`correct_${idx}`}
                                        checked={opt.correct === true}
                                        onChange={() => updateOptionCorrect(idx, true)}
                                        className="accent-violet-600"
                                    />
                                    Yes
                                </label>
                                <label className="inline-flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        name={`correct_${idx}`}
                                        checked={opt.correct === false}
                                        onChange={() => updateOptionCorrect(idx, false)}
                                        className="accent-violet-600"
                                    />
                                    No
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Button type="submit" className="w-auto h-auto px-6 py-2">
                    Ask Question
                </Button>
            </div>
        </form>
    )
}


