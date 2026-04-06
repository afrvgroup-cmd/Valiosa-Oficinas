"use client"

import { DEMO_MODE } from "./config"

export type UserRole = "mechanic" | "attendant" | "admin" | "super-admin"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  tenantId?: string // Added for multi-tenant support
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

// Demo users only loaded in demo mode
const DEMO_USERS = [
  { id: "1", name: "Carlos Silva", email: "mecanico@oficina.com", password: "123456", role: "mechanic" as UserRole },
  { id: "2", name: "Ana Santos", email: "atendente@oficina.com", password: "123456", role: "attendant" as UserRole },
  { id: "3", name: "João Admin", email: "admin@oficina.com", password: "123456", role: "admin" as UserRole },
  { id: "4", name: "Antonello", email: "antonello@oficina.com", password: "123456", role: "super-admin" as UserRole },
]

function simpleHash(password: string): string {
  // This is a basic hash - in production use bcrypt or similar with a backend
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}

export function initializeUsers() {
  if (typeof window === "undefined") return

  if (DEMO_MODE) {
    const hashedUsers = DEMO_USERS.map((user) => ({
      ...user,
      password: simpleHash(user.password),
    }))
    localStorage.setItem("users", JSON.stringify(hashedUsers))
    console.log(
      "[v0] Users reinitialized with super-admin:",
      DEMO_USERS.map((u) => ({ email: u.email, role: u.role })),
    )
  } else {
    // Production mode: check if there are any users
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    if (users.length === 0) {
      // First time setup - admin should create first user
      console.info("No users found. Please contact administrator for setup.")
    }
  }
}

export function login(email: string, password: string): User | null {
  if (typeof window === "undefined") return null

  const usersString = localStorage.getItem("users")
  const users = JSON.parse(usersString || "[]")

  console.log("[v0] Attempting login with:", email)
  console.log(
    "[v0] Available users:",
    users.map((u: any) => ({ email: u.email, role: u.role })),
  )

  const hashedPassword = simpleHash(password)
  const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === hashedPassword)

  if (user) {
    const authUser = { id: user.id, name: user.name, email: user.email, role: user.role }
    localStorage.setItem("currentUser", JSON.stringify(authUser))
    console.log("[v0] Login successful:", authUser)
    return authUser
  }

  console.log("[v0] Login failed for:", email)
  return null
}

export function logout() {
  if (typeof window === "undefined") return
  localStorage.removeItem("currentUser")
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const user = localStorage.getItem("currentUser")
  return user ? JSON.parse(user) : null
}

export function getAuthState(): AuthState {
  const user = getCurrentUser()
  return {
    user,
    isAuthenticated: user !== null,
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

  // Check if email already exists
  if (users.some((u: any) => u.email === email)) {
    return false
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password: simpleHash(password), // Hash password before storing
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
