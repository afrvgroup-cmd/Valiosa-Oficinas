"use client";

export type ServiceStatus = "pending" | "in-progress" | "completed";
export type ServicePriority = "low" | "medium" | "high" | "urgent";

export interface Service {
  id: string;
  clientName: string;
  clientPhone: string;
  vehicle: string;
  plate: string;
  description: string;
  priority: ServicePriority;
  status: ServiceStatus;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  observations?: string;
  completedBy?: string;
  queue?: string;
  professional?: string;
}

export function getAllServices(): Service[] {
  if (typeof window === "undefined") return [];

  const services = localStorage.getItem("services");
  return services ? JSON.parse(services) : [];
}

export function createService(
  service: Omit<Service, "id" | "createdAt" | "status">,
): Service {
  if (typeof window === "undefined")
    throw new Error("Cannot create service on server");

  const services = getAllServices();
  const newService: Service = {
    ...service,
    id: Date.now().toString(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  services.push(newService);
  localStorage.setItem("services", JSON.stringify(services));

  return newService;
}

export function updateServiceStatus(
  id: string,
  status: ServiceStatus,
  observations?: string,
  completedBy?: string,
): Service | null {
  if (typeof window === "undefined") return null;

  const services = getAllServices();
  const index = services.findIndex((s) => s.id === id);

  if (index !== -1) {
    services[index].status = status;
    services[index].updatedAt = new Date().toISOString();

    if (observations) {
      services[index].observations = observations;
    }

    if (completedBy) {
      services[index].completedBy = completedBy;
    }

    localStorage.setItem("services", JSON.stringify(services));
    return services[index];
  }

  return null;
}

export function deleteService(id: string): boolean {
  if (typeof window === "undefined") return false;

  const services = getAllServices();
  const filtered = services.filter((s) => s.id !== id);
  localStorage.setItem("services", JSON.stringify(filtered));

  return true;
}

export function updateService(
  id: string,
  data: {
    clientName?: string;
    clientPhone?: string;
    vehicle?: string;
    plate?: string;
    description?: string;
    priority?: ServicePriority;
    status?: ServiceStatus;
    queue?: string;
    professional?: string;
  },
): { success: boolean; error?: string } {
  if (typeof window === "undefined")
    return { success: false, error: "Cannot update service on server" };

  try {
    const services = getAllServices();
    const index = services.findIndex((s) => s.id === id);

    if (index === -1)
      return { success: false, error: "Serviço não encontrado" };

    services[index] = {
      ...services[index],
      ...data,
      plate: data.plate ? data.plate.toUpperCase() : services[index].plate,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("services", JSON.stringify(services));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getPerformanceStats() {
  if (typeof window === "undefined") return null;

  const services = getAllServices();
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const totalServices = services.length;
  const completedServices = services.filter(
    (s) => s.status === "completed",
  ).length;
  const inProgressServices = services.filter(
    (s) => s.status === "in-progress",
  ).length;
  const pendingServices = services.filter((s) => s.status === "pending").length;

  const thisMonthServices = services.filter(
    (s) => new Date(s.createdAt) >= thisMonth,
  ).length;
  const lastMonthServices = services.filter((s) => {
    const date = new Date(s.createdAt);
    return date >= lastMonth && date < thisMonth;
  }).length;

  return {
    totalServices,
    completedServices,
    inProgressServices,
    pendingServices,
    thisMonthServices,
    lastMonthServices,
    completionRate:
      totalServices > 0
        ? Math.round((completedServices / totalServices) * 100)
        : 0,
  };
}
