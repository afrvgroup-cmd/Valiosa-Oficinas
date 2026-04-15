"use client";

import { API_BASE_URL } from "./config";
import { getAuthToken, ensureValidToken } from "./auth";

export interface Role {
  id: number;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  created_at: string;
}

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

export async function getAllRoles(): Promise<Role[]> {
  const result = await fetchWithAuth("/roles");
  return result.data || [];
}

export async function createRole(role: {
  name: string;
  description?: string;
  color?: string;
}): Promise<Role> {
  const result = await fetchWithAuth("/roles", {
    method: "POST",
    body: JSON.stringify(role),
  });
  return result.data;
}

export async function updateRole(
  id: number,
  data: {
    name?: string;
    description?: string;
    color?: string;
    active?: boolean;
  }
): Promise<void> {
  await fetchWithAuth(`/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteRole(id: number): Promise<void> {
  await fetchWithAuth(`/roles/${id}`, {
    method: "DELETE",
  });
}
