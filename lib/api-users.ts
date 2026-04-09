"use client"

import { API_BASE_URL } from "./config"
import { getAuthToken } from "./auth"

export interface QueueCategory {
  id: number
  name: string
  color: string
}

export interface User {
  id: number
  nome_completo: string
  email: string
  cpf?: string
  cargo: string
  ativo: boolean
  created_at: string
  updated_at?: string
  queues?: QueueCategory[]
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken()
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    try {
      const error = await response.json()
      throw new Error(error.error || "Erro na requisição")
    } catch (e: any) {
      throw new Error(e.message || "Erro na requisição")
    }
  }

  return response.json()
}

export async function getAllUsers(): Promise<User[]> {
  const result = await fetchWithAuth("/users")
  return result.data || []
}

export async function getUsersByQueue(queueId?: number): Promise<User[]> {
  const endpoint = queueId ? `/users/queue?queue_id=${queueId}` : "/users/queue"
  const result = await fetchWithAuth(endpoint)
  return result.data || []
}

export async function createUser(user: {
  nome_completo: string
  email: string
  cpf?: string
  senha: string
  cargo: string
  queues?: number[]
}): Promise<User> {
  const result = await fetchWithAuth("/users", {
    method: "POST",
    body: JSON.stringify(user),
  })
  return result.data
}

export async function updateUser(
  id: number,
  data: {
    nome_completo?: string
    email?: string
    cargo?: string
    ativo?: boolean
    nova_senha?: string
    queues?: number[]
  },
): Promise<User> {
  const result = await fetchWithAuth(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return result.data
}

export async function deleteUser(id: number): Promise<void> {
  await fetchWithAuth(`/users/${id}`, {
    method: "DELETE",
  })
}