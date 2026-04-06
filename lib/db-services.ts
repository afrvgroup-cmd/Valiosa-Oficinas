"use server"

import { tenantQuery } from "./db"

export interface DBService {
  id: number
  customer_id: number
  vehicle_id: number
  customer_name: string
  customer_phone: string
  vehicle_brand: string
  vehicle_model: string
  vehicle_plate: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in-progress" | "completed"
  observations?: string
  created_by: string
  completed_by?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export async function getTenantServices(tenantId: string): Promise<DBService[]> {
  try {
    const result = await tenantQuery(
      tenantId,
      `
      SELECT 
        so.id,
        so.customer_id,
        so.vehicle_id,
        c.name as customer_name,
        c.phone as customer_phone,
        v.brand as vehicle_brand,
        v.model as vehicle_model,
        v.plate as vehicle_plate,
        so.description,
        so.priority,
        so.status,
        so.observations,
        so.created_by,
        so.completed_by,
        so.created_at::text,
        so.updated_at::text,
        so.completed_at::text
      FROM service_orders so
      JOIN customers c ON so.customer_id = c.id
      JOIN vehicles v ON so.vehicle_id = v.id
      ORDER BY so.created_at DESC
    `,
    )
    return result.rows
  } catch (error) {
    console.error("[v0] Error fetching tenant services:", error)
    return []
  }
}

export async function createTenantService(
  tenantId: string,
  data: {
    customerName: string
    customerPhone: string
    vehicleBrand: string
    vehicleModel: string
    vehiclePlate: string
    description: string
    priority: string
    createdBy: string
  },
): Promise<{ success: boolean; error?: string; serviceId?: number }> {
  try {
    // Check/Create customer
    const customerResult = await tenantQuery(tenantId, "SELECT id FROM customers WHERE phone = $1", [
      data.customerPhone,
    ])

    let customerId: number

    if (customerResult.rows.length > 0) {
      customerId = customerResult.rows[0].id
    } else {
      const newCustomer = await tenantQuery(
        tenantId,
        "INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING id",
        [data.customerName, data.customerPhone],
      )
      customerId = newCustomer.rows[0].id
    }

    // Check/Create vehicle
    const vehicleResult = await tenantQuery(tenantId, "SELECT id FROM vehicles WHERE plate = $1", [data.vehiclePlate])

    let vehicleId: number

    if (vehicleResult.rows.length > 0) {
      vehicleId = vehicleResult.rows[0].id
    } else {
      const newVehicle = await tenantQuery(
        tenantId,
        "INSERT INTO vehicles (customer_id, brand, model, plate) VALUES ($1, $2, $3, $4) RETURNING id",
        [customerId, data.vehicleBrand, data.vehicleModel, data.vehiclePlate],
      )
      vehicleId = newVehicle.rows[0].id
    }

    // Create service order
    const serviceResult = await tenantQuery(
      tenantId,
      `INSERT INTO service_orders (customer_id, vehicle_id, description, priority, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [customerId, vehicleId, data.description, data.priority, data.createdBy],
    )

    return { success: true, serviceId: serviceResult.rows[0].id }
  } catch (error: any) {
    console.error("[v0] Error creating service:", error)
    return { success: false, error: error.message }
  }
}

export async function updateServiceStatus(
  tenantId: string,
  serviceId: number,
  status: string,
  observations?: string,
  completedBy?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: string[] = ["status = $1", "updated_at = CURRENT_TIMESTAMP"]
    const values: any[] = [status]
    let paramIndex = 2

    if (observations) {
      updates.push(`observations = $${paramIndex++}`)
      values.push(observations)
    }

    if (completedBy) {
      updates.push(`completed_by = $${paramIndex++}`)
      values.push(completedBy)
    }

    if (status === "completed") {
      updates.push(`completed_at = CURRENT_TIMESTAMP`)
    }

    values.push(serviceId)

    await tenantQuery(tenantId, `UPDATE service_orders SET ${updates.join(", ")} WHERE id = $${paramIndex}`, values)

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error updating service status:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteTenantService(
  tenantId: string,
  serviceId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await tenantQuery(tenantId, "DELETE FROM service_orders WHERE id = $1", [serviceId])
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting service:", error)
    return { success: false, error: error.message }
  }
}
