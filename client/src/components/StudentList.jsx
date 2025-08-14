export default function StudentList({ students = [], onRemove }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Participants</h3>
            </div>
            <ul className="divide-y">
                {students.map(s => (
                    <li key={s.sessionId} className="flex items-center justify-between py-3">
                        <span className="text-sm text-gray-800">{s.name}</span>
                        <button
                            onClick={() => onRemove?.(s)}
                            className="text-violet-600 text-sm hover:underline"
                        >
                            Kick out
                        </button>
                    </li>
                ))}
                {students.length === 0 && (
                    <li className="py-6 text-sm text-gray-500">No participants yet</li>
                )}
            </ul>
        </div>
    )
}


