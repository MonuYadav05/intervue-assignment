import { useEffect, useState } from 'react'
import Button from './Button'
import Badge from './Badge'

export default function NameModal({ open = true, onConfirm }) {
    const [name, setName] = useState('')

    useEffect(() => {
        const savedName = sessionStorage.getItem('studentName')
        if (savedName) setName(savedName)
    }, [])

    function ensureSessionId() {
        let id = sessionStorage.getItem('sessionId')
        if (!id && window.crypto?.randomUUID) {
            id = crypto.randomUUID()
            sessionStorage.setItem('sessionId', id)
        }
        if (!id) {
            id = String(Date.now())
            sessionStorage.setItem('sessionId', id)
        }
        return id
    }

    function handleContinue(e) {
        e.preventDefault()
        const trimmed = name.trim()
        if (!trimmed) return
        sessionStorage.setItem('studentName', trimmed)
        const sessionId = ensureSessionId()
        onConfirm?.({ name: trimmed, sessionId })
    }

    if (!open) return null

    return (
        <div className="fixed inset-0  flex items-center justify-center p-4">
            <form
                onSubmit={handleContinue}
                className="w-full max-w-2xl bg-white rounded-2xl text-center"
            >
                <Badge />

                <h2 className="mt-5 text-[40px] ">
                    Let's <span className="font-semibold">Get Started</span>
                </h2>
                <p className="mt-2 text-gray-500 text-sm max-w-xl mx-auto">
                    If you're a student, you'll be able to <span className="font-medium text-gray-700">submit your answers</span>, participate in live polls, and see how your responses compare with your classmates
                </p>

                <div className="mt-8 text-left max-w-sm mx-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter your Name</label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Rahul Bajaj"
                        className="w-full rounded-md px-4 py-3 placeholder:text-black/70 bg-[#F2F2F2] focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>

                <div className="mt-8 flex justify-center">
                    <Button type="submit" className="w-auto h-auto px-6 py-2">
                        Continue
                    </Button>
                </div>
            </form>
        </div>
    )
}


