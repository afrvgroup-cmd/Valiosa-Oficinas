"use server";

import { query } from "./db";

export interface DBLicense {
  id: number;
  company_id: number;
  company_name: string;
  cnpj: string;
  email: string;
  phone: string;
  plan: "basic" | "professional" | "enterprise";
  status: "active" | "suspended" | "expired" | "trial";
  max_users: number;
  current_users: number;
  start_date: string;
  expiration_date: string;
  created_at: string;
  notes?: string;
}

export async function getAllLicensesDB(): Promise<DBLicense[]> {
  try {
    const result = await query(`
      SELECT 
        l.id,
        l.company_id,
        c.name as company_name,
        c.cnpj,
        c.email,
        c.phone,
        l.plan,
        l.status,
        l.max_users,
        l.current_users,
        l.start_date::text,
        l.expiration_date::text,
        l.created_at::text,
        l.notes
      FROM licenses l
      JOIN companies c ON l.company_id = c.id
      ORDER BY l.created_at DESC
    `);
    return result.rows;
  } catch (error) {
    console.error("[v0] Error fetching licenses:", error);
    return [];
  }
}

export async function createLicenseDB(data: {
  companyName: string;
  cnpj: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  maxUsers: number;
  startDate: string;
  expirationDate: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const existingCompany = await query("SELECT id FROM companies WHERE cnpj = $1", [data.cnpj]);

    let companyId: number;

    if (existingCompany.rows.length > 0) {
      companyId = existingCompany.rows[0].id;
    } else {
      const companyResult = await query(
        `INSERT INTO companies (name, cnpj, email, phone)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [data.companyName, data.cnpj, data.email, data.phone],
      );
      companyId = companyResult.rows[0].id;
    }

    await query(
      `INSERT INTO licenses 
       (company_id, plan, status, max_users, current_users, start_date, expiration_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [companyId, data.plan, data.status, data.maxUsers, 0, data.startDate, data.expirationDate, data.notes],
    );

    return { success: true };
  } catch (error: any) {
    console.error("[v0] Error creating license:", error);
    return { success: false, error: error.message };
  }
}

export async function updateLicenseDB(
  id: number,
  data: Partial<DBLicense>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.plan) {
      updates.push(`plan = $${paramIndex++}`);
      values.push(data.plan);
    }
    if (data.max_users !== undefined) {
      updates.push(`max_users = $${paramIndex++}`);
      values.push(data.max_users);
    }
    if (data.expiration_date) {
      updates.push(`expiration_date = $${paramIndex++}`);
      values.push(data.expiration_date);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }

    if (updates.length === 0) {
      return { success: true };
    }

    values.push(id);
    await query(`UPDATE licenses SET ${updates.join(", ")} WHERE id = $${paramIndex}`, values);

    return { success: true };
  } catch (error: any) {
    console.error("[v0] Error updating license:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteLicenseDB(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const licenseResult = await query("SELECT company_id FROM licenses WHERE id = $1", [id]);

    if (licenseResult.rows.length === 0) {
      return { success: false, error: "License not found" };
    }

    await query("DELETE FROM licenses WHERE id = $1", [id]);

    return { success: true };
  } catch (error: any) {
    console.error("[v0] Error deleting license:", error);
    return { success: false, error: error.message };
  }
}

export async function getLicenseStatsDB() {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
        COUNT(*) FILTER (WHERE status = 'expired') as expired,
        COUNT(*) FILTER (WHERE status = 'trial') as trial,
        SUM(CASE 
          WHEN status IN ('active', 'trial') AND plan = 'basic' THEN 99
          WHEN status IN ('active', 'trial') AND plan = 'professional' THEN 249
          WHEN status IN ('active', 'trial') AND plan = 'enterprise' THEN 499
          ELSE 0
        END) as revenue
      FROM licenses
    `);

    return {
      total: Number(result.rows[0].total),
      active: Number(result.rows[0].active),
      suspended: Number(result.rows[0].suspended),
      expired: Number(result.rows[0].expired),
      trial: Number(result.rows[0].trial),
      revenue: Number(result.rows[0].revenue),
    };
  } catch (error) {
    console.error("[v0] Error fetching license stats:", error);
    return { total: 0, active: 0, suspended: 0, expired: 0, trial: 0, revenue: 0 };
  }
}