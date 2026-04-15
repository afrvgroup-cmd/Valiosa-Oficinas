"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { login, getAuthState, getCurrentUser, logout } from "@/lib/auth"

export default function HomePage() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      if (user.role === "super-admin") {
        router.push("/licenses")
      } else if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/attendant")
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const handleLogin = async (email: string, password: string) => {
    const user = await login(email, password)

    if (user) {
      if (user.role === "super-admin") {
        router.push("/licenses")
      } else if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/attendant")
      }
    } else {
      setError("Email ou senha incorretos")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return <LoginForm onLogin={handleLogin} error={error} />
}