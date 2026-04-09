"use client"

import { API_BASE_URL } from "./config"
import { getAuthToken } from "./auth"

export interface Company {
  id: string
  name: string
  cnpj: string
  email?: string
  phone?: string
  created_at: string
  updated_at?: string
  license_id?: number
  plan?: string
  license_status?: string
  max_users?: number
  current_users?: number
  expiration_date?: string
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

export async function getAllCompanies(): Promise<Company[]> {
  const result = await fetchWithAuth("/companies")
  return result.data || []
}

export async function getCompany(id: string): Promise<Company> {
  const result = await fetchWithAuth(`/companies/${id}`)
  return result.data
}

export async function createCompany(company: {
  name: string
  cnpj: string
  email?: string
  phone?: string
  plan?: string
  status?: string
  maxUsers?: number
  startDate?: string
  expirationDate?: string
  notes?: string
}): Promise<Company> {
  const result = await fetchWithAuth("/companies", {
    method: "POST",
    body: JSON.stringify(company),
  })
  return result.data
}

export async function updateCompany(
  id: string,
  data: {
    name?: string
    email?: string
    phone?: string
  },
): Promise<Company> {
  const result = await fetchWithAuth(`/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return result.data
}

export async function deleteCompany(id: string): Promise<void> {
  await fetchWithAuth(`/companies/${id}`, {
    method: "DELETE",
  })
}