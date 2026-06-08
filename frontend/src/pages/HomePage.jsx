import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { userAttrs } = useAuth()
  const firstName = userAttrs?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <span className="text-5xl">🌍</span>
      <h1 className="text-3xl font-bold text-gray-900">Welcome back, {firstName}!</h1>
      <p className="text-gray-500 max-w-md">
        Your AI-powered travel planner. Plan trips, discover places, and explore the world.
      </p>
    </div>
  )
}
