"use client"

export interface License {
  id: string
  companyName: string
  cnpj: string
  email: string
  phone: string
  plan: "basic" | "professional" | "enterprise"
  status: "active" | "suspended" | "expired" | "trial"
  maxUsers: number
  currentUsers: number
  startDate: string
  expirationDate: string
  createdAt: string
  notes?: string
}

export interface LicenseStats {
  total: number
  active: number
  suspended: number
  expired: number
  trial: number
  revenue: number
}

// Initialize demo licenses for testing
export function initializeLicenses() {
  if (typeof window === "undefined") return

  const existingLicenses = localStorage.getItem("licenses")
  if (!existingLicenses) {
    const demoLicenses: License[] = [
      {
        id: "1",
        companyName: "Oficina do João",
        cnpj: "12.345.678/0001-90",
        email: "contato@oficinajao.com",
        phone: "(11) 98765-4321",
        plan: "professional",
        status: "active",
        maxUsers: 10,
        currentUsers: 5,
        startDate: "2024-01-01",
        expirationDate: "2025-01-01",
        createdAt: new Date().toISOString(),
        notes: "Cliente desde janeiro de 2024",
      },
      {
        id: "2",
        companyName: "Auto Mecânica Silva",
        cnpj: "98.765.432/0001-10",
        email: "contato@autosilva.com",
        phone: "(11) 91234-5678",
        plan: "basic",
        status: "active",
        maxUsers: 5,
        currentUsers: 3,
        startDate: "2024-03-15",
        expirationDate: "2025-03-15",
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        companyName: "Mega Oficina Express",
        cnpj: "45.678.901/0001-23",
        email: "contato@megaoficina.com",
        phone: "(11) 99876-5432",
        plan: "trial",
        status: "trial",
        maxUsers: 3,
        currentUsers: 2,
        startDate: "2024-12-01",
        expirationDate: "2024-12-31",
        createdAt: new Date().toISOString(),
        notes: "Período de teste - 30 dias",
      },
    ]
    localStorage.setItem("licenses", JSON.stringify(demoLicenses))
  }
}

export function getAllLicenses(): License[] {
  if (typeof window === "undefined") return []
  const licenses = localStorage.getItem("licenses")
  return licenses ? JSON.parse(licenses) : []
}

export function getLicenseById(id: string): License | null {
  const licenses = getAllLicenses()
  return licenses.find((l) => l.id === id) || null
}

export function createLicense(license: Omit<License, "id" | "createdAt" | "currentUsers">): boolean {
  if (typeof window === "undefined") return false

  const licenses = getAllLicenses()

  // Check if CNPJ already exists
  if (licenses.some((l) => l.cnpj === license.cnpj)) {
    return false
  }

  const newLicense: License = {
    ...license,
    id: Date.now().toString(),
    currentUsers: 0,
    createdAt: new Date().toISOString(),
  }

  licenses.push(newLicense)
  localStorage.setItem("licenses", JSON.stringify(licenses))
  return true
}

export function updateLicense(id: string, updates: Partial<License>): boolean {
  if (typeof window === "undefined") return false

  const licenses = getAllLicenses()
  const index = licenses.findIndex((l) => l.id === id)

  if (index === -1) return false

  licenses[index] = { ...licenses[index], ...updates }
  localStorage.setItem("licenses", JSON.stringify(licenses))
  return true
}

export function deleteLicense(id: string): boolean {
  if (typeof window === "undefined") return false

  const licenses = getAllLicenses()
  const filtered = licenses.filter((l) => l.id !== id)
  localStorage.setItem("licenses", JSON.stringify(filtered))
  return true
}

export function getLicenseStats(): LicenseStats {
  const licenses = getAllLicenses()

  const stats: LicenseStats = {
    total: licenses.length,
    active: licenses.filter((l) => l.status === "active").length,
    suspended: licenses.filter((l) => l.status === "suspended").length,
    expired: licenses.filter((l) => l.status === "expired").length,
    trial: licenses.filter((l) => l.status === "trial").length,
    revenue: 0,
  }

  // Calculate estimated revenue
  licenses.forEach((license) => {
    if (license.status === "active" || license.status === "trial") {
      const planPrices = { basic: 99, professional: 249, enterprise: 499 }
      stats.revenue += planPrices[license.plan]
    }
  })

  return stats
}

export function checkLicenseExpiration(license: License): number {
  const today = new Date()
  const expiration = new Date(license.expirationDate)
  const daysUntilExpiration = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilExpiration
}

export function getExpiringLicenses(days = 30): License[] {
  const licenses = getAllLicenses()
  return licenses.filter((license) => {
    const daysLeft = checkLicenseExpiration(license)
    return daysLeft > 0 && daysLeft <= days && license.status === "active"
  })
}
