"use client";

import { API_BASE_URL } from "./config";
import { getAuthToken } from "./auth";

export interface Queue {
  id: number;
  service_order_id: number;
  position: number;
  status: "waiting" | "called" | "in-progress" | "completed";
  called_at?: string;
  called_by?: string;
  started_at?: string;
  finished_at?: string;
  created_at: string;
}

export interface QueueCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  created_at: string;
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

export async function getAllQueues(): Promise<Queue[]> {
  const result = await fetchWithAuth("/queue");
  return result.data || [];
}

export async function createQueue(serviceOrderId: number): Promise<Queue> {
  const result = await fetchWithAuth("/queue", {
    method: "POST",
    body: JSON.stringify({ service_order_id: serviceOrderId }),
  });
  return result.data;
}

export async function callQueueItem(id: number, calledBy: string): Promise<void> {
  await fetchWithAuth(`/queue/${id}/call`, {
    method: "POST",
    body: JSON.stringify({ called_by: calledBy }),
  });
}

export async function startQueueItem(id: number): Promise<void> {
  await fetchWithAuth(`/queue/${id}/start`, {
    method: "POST",
  });
}

export async function finishQueueItem(id: number): Promise<void> {
  await fetchWithAuth(`/queue/${id}/finish`, {
    method: "POST",
  });
}

export async function deleteQueueItem(id: number): Promise<void> {
  await fetchWithAuth(`/queue/${id}`, {
    method: "DELETE",
  });
}

export async function reorderQueue(queueItems: { id: number; position: number }[]): Promise<void> {
  await fetchWithAuth("/queue/reorder", {
    method: "PUT",
    body: JSON.stringify({ queueItems }),
  });
}

export async function getAllQueueCategories(): Promise<QueueCategory[]> {
  const result = await fetchWithAuth("/queue-categories");
  return result.data || [];
}

export async function createQueueCategory(category: {
  name: string;
  description?: string;
  color?: string;
}): Promise<QueueCategory> {
  const result = await fetchWithAuth("/queue-categories", {
    method: "POST",
    body: JSON.stringify(category),
  });
  return result.data;
}

export async function updateQueueCategory(
  id: number,
  data: {
    name?: string;
    description?: string;
    color?: string;
    active?: boolean;
  }
): Promise<void> {
  await fetchWithAuth(`/queue-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteQueueCategory(id: number): Promise<void> {
  await fetchWithAuth(`/queue-categories/${id}`, {
    method: "DELETE",
  });
}
