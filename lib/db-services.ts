"use server";

import { query } from "./db";

export interface DBService {
  id: number;
  customer_id: number;
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_plate: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in-progress" | "completed";
  observations?: string;
  created_by: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export async function getTenantServices(
  tenantId: string,
): Promise<DBService[]> {
  try {
    const result = await query(
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
      WHERE so.tenant_id = $1
      ORDER BY so.created_at DESC
    `,
      [tenantId],
    );
    return result.rows;
  } catch (error) {
    console.error("[v0] Error fetching tenant services:", error);
    return [];
  }
}

export async function createTenantService(
  tenantId: string,
  data: {
    customerName: string;
    customerPhone: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehiclePlate: string;
    description: string;
    priority: string;
    createdBy: string;
  },
): Promise<{ success: boolean; error?: string; serviceId?: number }> {
  try {
    const client = await query("BEGIN");
    
    const customerResult = await query(
      "SELECT id FROM customers WHERE phone = $1 AND tenant_id = $2",
      [data.customerPhone, tenantId],
    );

    let customerId: number;

    if (customerResult.rows.length > 0) {
      customerId = customerResult.rows[0].id;
    } else {
      const newCustomer = await query(
        "INSERT INTO customers (name, phone, tenant_id) VALUES ($1, $2, $3) RETURNING id",
        [data.customerName, data.customerPhone, tenantId],
      );
      customerId = newCustomer.rows[0].id;
    }

    const vehicleResult = await query(
      "SELECT id FROM vehicles WHERE plate = $1 AND tenant_id = $2",
      [data.vehiclePlate, tenantId],
    );

    let vehicleId: number;

    if (vehicleResult.rows.length > 0) {
      vehicleId = vehicleResult.rows[0].id;
    } else {
      const newVehicle = await query(
        "INSERT INTO vehicles (customer_id, brand, model, plate, tenant_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [customerId, data.vehicleBrand, data.vehicleModel, data.vehiclePlate, tenantId],
      );
      vehicleId = newVehicle.rows[0].id;
    }

    const serviceResult = await query(
      `INSERT INTO service_orders (customer_id, vehicle_id, description, priority, created_by, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [customerId, vehicleId, data.description, data.priority, data.createdBy, tenantId],
    );

    await query("COMMIT");
    return { success: true, serviceId: serviceResult.rows[0].id };
  } catch (error: any) {
    await query("ROLLBACK");
    console.error("[v0] Error creating service:", error);
    return { success: false, error: error.message };
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
    const updates: string[] = ["status = $1", "updated_at = CURRENT_TIMESTAMP"];
    const values: any[] = [status];
    let paramIndex = 2;

    if (observations) {
      updates.push(`observations = $${paramIndex++}`);
      values.push(observations);
    }

    if (completedBy) {
      updates.push(`completed_by = $${paramIndex++}`);
      values.push(completedBy);
    }

    if (status === "completed") {
      updates.push(`completed_at = CURRENT_TIMESTAMP`);
    }

    values.push(serviceId, tenantId);

    await query(
      `UPDATE service_orders SET ${updates.join(", ")} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}`,
      values,
    );

    return { success: true };
  } catch (error: any) {
    console.error("[v0] Error updating service status:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteTenantService(
  tenantId: string,
  serviceId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await query("DELETE FROM service_orders WHERE id = $1 AND tenant_id = $2", [
      serviceId,
      tenantId,
    ]);
    return { success: true };
  } catch (error: any) {
    console.error("[v0] Error deleting service:", error);
    return { success: false, error: error.message };
  }
}