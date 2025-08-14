import Badge from "./Badge"

export default function WaitingForResults() {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6">
            <Badge />
            <div className="w-9 h-9 rounded-full border-8 border-violet-500 border-r-transparent animate-spin" />
            <p className="text-center text-lg font-semibold">Wait for the teacher to ask questions...</p>
        </div>
    )
}


