"use client"

import { API_BASE_URL } from "./config"
import { getAuthToken, ensureValidToken } from "./auth"

export interface Customer {
  id: number
  name: string
  email?: string
  phone: string
  cpf?: string
  address?: string
  created_at: string
  updated_at?: string
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const valid = await ensureValidToken();
  if (!valid) {
    throw new Error("Token expirado");
  }
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

export async function getAllCustomers(): Promise<Customer[]> {
  const result = await fetchWithAuth("/customers")
  return result.data || []
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const result = await fetchWithAuth(`/customers/search?q=${encodeURIComponent(query)}`)
  return result.data || []
}

export async function getCustomer(id: number): Promise<Customer> {
  const result = await fetchWithAuth(`/customers/${id}`)
  return result.data
}

export async function createCustomer(customer: {
  name: string
  email?: string
  phone: string
  cpf?: string
  address?: string
}): Promise<Customer> {
  const result = await fetchWithAuth("/customers", {
    method: "POST",
    body: JSON.stringify(customer),
  })
  return result.data
}

export async function updateCustomer(
  id: number,
  data: {
    name?: string
    email?: string
    phone?: string
    cpf?: string
    address?: string
  },
): Promise<Customer> {
  const result = await fetchWithAuth(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return result.data
}

export async function deleteCustomer(id: number): Promise<void> {
  await fetchWithAuth(`/customers/${id}`, {
    method: "DELETE",
  })
}