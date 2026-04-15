"use client";

import { API_BASE_URL } from "./config";
import { getAuthToken, ensureValidToken } from "./auth";

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const valid = await ensureValidToken();
  if (!valid) {
    throw new Error("Token expirado");
  }
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || "Erro na requisição");
    } catch (e: any) {
      throw new Error(e.message || "Erro na requisição");
    }
  }

  return response.json();
}

export interface History {
  id: string
  service_order_id: string
  action: string
  description: string
  performed_by: string
  created_at: string
}

export async function getAllHistory(): Promise<History[]> {
  const result = await fetchWithAuth("/history")
  return result.data || []
}

export async function getHistoryByServiceOrder(serviceOrderId: string): Promise<History[]> {
  const result = await fetchWithAuth(`/history/service/${serviceOrderId}`)
  return result.data || []
}

export async function createHistory(history: {
  service_order_id: string
  action: string
  description: string
  performed_by: string
}): Promise<History> {
  const result = await fetchWithAuth("/history", {
    method: "POST",
    body: JSON.stringify(history),
  })
  return result.data
}