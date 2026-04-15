"use client";

import { API_BASE_URL } from "./config";
import { getAuthToken } from "./auth";

export type ServiceStatus = "pending" | "in-progress" | "completed";
export type ServicePriority = "low" | "medium" | "high" | "urgent";

export interface Service {
  id: number;
  service_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  brand: string;
  model: string;
  obs: string;
  description: string;
  priority: ServicePriority;
  status: ServiceStatus;
  observations?: string;
  created_by: string;
  completed_by?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  queue?: string;
  professional?: string;
}

export interface ServiceStats {
  total: string;
  pending: string;
  in_progress: string;
  completed: string;
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
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

export async function getAllServices(): Promise<Service[]> {
  const result = await fetchWithAuth("/services");
  return result.data || [];
}

export async function getServiceStats(): Promise<ServiceStats> {
  const result = await fetchWithAuth("/services/stats");
  return result.data;
}

export async function createService(service: {
  customerName: string;
  customerPhone: string;
  brand: string;
  model: string;
  obs: string;
  description: string;
  priority: ServicePriority;
  queue: string;
  professional: string;
  createdBy: string;
}): Promise<Service> {
  const result = await fetchWithAuth("/services", {
    method: "POST",
    body: JSON.stringify(service),
  });
  return result.data;
}

export async function updateService(
  id: number,
  data: {
    status?: ServiceStatus;
    observations?: string;
    completedBy?: string;
    priority?: ServicePriority;
    description?: string;
    queueId?: string;
    assignedTo?: string;
  },
): Promise<Service> {
  const result = await fetchWithAuth(`/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return result.data;
}

export async function deleteService(id: number): Promise<void> {
  await fetchWithAuth(`/services/${id}`, {
    method: "DELETE",
  });
}
