"use client"

import { API_BASE_URL } from "./config"
import { getAuthToken } from "./auth"

export interface License {
  id: number
  company_id: number
  company_name: string
  cnpj: string
  email: string
  phone: string
  plan: "basic" | "professional" | "enterprise"
  status: "active" | "suspended" | "expired" | "trial"
  max_users: number
  current_users: number
  start_date: string
  expiration_date: string
  created_at: string
  notes?: string
}

export interface LicenseStats {
  total: string
  active: string
  suspended: string
  expired: string
  trial: string
  revenue: string
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

export async function getAllLicenses(): Promise<License[]> {
  const result = await fetchWithAuth("/licenses")
  return result.data || []
}

export async function getLicenseStats(): Promise<LicenseStats> {
  const result = await fetchWithAuth("/licenses/stats")
  return result.data
}

export async function createLicense(license: {
  companyName: string
  cnpj: string
  email: string
  phone: string
  plan: string
  status: string
  maxUsers: number
  startDate: string
  expirationDate: string
  notes?: string
}): Promise<License> {
  const result = await fetchWithAuth("/licenses", {
    method: "POST",
    body: JSON.stringify(license),
  })
  return result.data
}

export async function updateLicense(
  id: number,
  data: {
    plan?: string
    status?: string
    maxUsers?: number
    expirationDate?: string
    notes?: string
  },
): Promise<License> {
  const result = await fetchWithAuth(`/licenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return result.data
}

export async function deleteLicense(id: number): Promise<void> {
  await fetchWithAuth(`/licenses/${id}`, {
    method: "DELETE",
  })
}