import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Badge from '../components/Badge'

function RoleCard({ title, description, selected, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                `text-left w-full rounded-xl border p-4 transition-colors ` +
                (selected
                    ? 'border-violet-500 ring-2 ring-violet-200 bg-white'
                    : 'border-[#D9D9D9] hover:border-violet-300 bg-white')
            }
        >
            <div className="font-semibold ">{title}</div>
            <p className="mt-1 text-xs text-gray-800 leading-relaxed">{description}</p>
        </button>
    )
}

export default function Landing() {
    const navigate = useNavigate()
    const [role, setRole] = useState(null) // 'student' | 'teacher'

    function onContinue() {
        if (!role) return
        navigate(role === 'student' ? '/student' : '/teacher')
    }

    return (
        <div className=" flex items-center justify-center  mt-34 bg-white">
            <div className="max-w-2xl w-full px-6 text-center">
                <Badge />

                <h1 className="mt-5 text-2xl sm:text-3xl ">
                    Welcome to the <span className=" font-semibold">Live Polling System</span>
                </h1>
                <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                    Please select the role that best describes you to begin using the live polling system
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <RoleCard
                        title="I'm a Student"
                        description="Lorem ipsum is simply dummy text of the printing and typesetting industry"
                        selected={role === 'student'}
                        onClick={() => setRole('student')}
                    />
                    <RoleCard
                        title="I'm a Teacher"
                        description="Submit answers and view live poll results in real-time."
                        selected={role === 'teacher'}
                        onClick={() => setRole('teacher')}
                    />
                </div>

                <div className="mt-8 flex justify-center">
                    <Button
                        onClick={onContinue}
                        disabled={!role}
                        className="w-auto h-auto px-6 py-2"
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    )
}


