"use client"

import { API_BASE_URL, DEMO_MODE } from "./config"

export type UserRole = "mechanic" | "attendant" | "admin" | "super-admin"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  tenantId?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

export interface LoginResponse {
  message?: string
  token: string
  refreshToken: string
  user: {
    id: number
    nome: string
    email: string
    cargo: string
    cliente_id: number
  }
}

const ROLE_MAP: Record<string, UserRole> = {
  admin: "admin",
  atendente: "attendant",
  mecanico: "mechanic",
  "super-admin": "super-admin",
}

export async function login(email: string, password: string): Promise<User | null> {
  if (typeof window === "undefined") return null

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, senha: password }),
    })

    if (!response.ok) {
      try {
        const error = await response.json()
        console.error("Login failed:", error)
      } catch {
        console.error("Login failed:", response.statusText)
      }
      return null
    }

    const data: LoginResponse = await response.json()

    const user: User = {
      id: data.user.id.toString(),
      name: data.user.nome,
      email: data.user.email,
      role: ROLE_MAP[data.user.cargo] || "attendant",
      tenantId: data.user.cliente_id?.toString(),
    }

    localStorage.setItem("authToken", data.token)
    localStorage.setItem("refreshToken", data.refreshToken)
    localStorage.setItem("currentUser", JSON.stringify(user))

    console.log("[API] Login successful:", user)
    return user
  } catch (error) {
    console.error("[API] Login error:", error)
    return null
  }
}

export function logout() {
  if (typeof window === "undefined") return
  localStorage.removeItem("authToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("currentUser")
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem("currentUser")
  return user ? JSON.parse(user) : null
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("authToken")
}

export function getAuthState(): AuthState {
  const user = getCurrentUser()
  return {
    user,
    isAuthenticated: user !== null,
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return false

  const refreshToken = localStorage.getItem("refreshToken")
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_BASE_URL}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) return false

    const data = await response.json()
    localStorage.setItem("authToken", data.token)
    localStorage.setItem("refreshToken", data.refreshToken)
    return true
  } catch {
    return false
  }
}

export function getAllUsers() {
  if (typeof window === "undefined") return []

  const users = JSON.parse(localStorage.getItem("users") || "[]")
  return users.map((u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
}

export function createUser(name: string, email: string, password: string, role: UserRole): boolean {
  if (typeof window === "undefined") return false

  const users = JSON.parse(localStorage.getItem("users") || "[]")

  if (users.some((u: any) => u.email === email)) {
    return false
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    role,
  }

  users.push(newUser)
  localStorage.setItem("users", JSON.stringify(users))
  return true
}

export function deleteUser(id: string): boolean {
  if (typeof window === "undefined") return false

  const users = JSON.parse(localStorage.getItem("users") || "[]")
  const filtered = users.filter((u: any) => u.id !== id)
  localStorage.setItem("users", JSON.stringify(filtered))
  return true
}

export function isDemoMode(): boolean {
  return DEMO_MODE
}