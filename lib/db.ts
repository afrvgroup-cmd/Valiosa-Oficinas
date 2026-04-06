import { Pool, type PoolClient } from "pg"

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || "database-1.cwzewumiyy70.us-east-1.rds.amazonaws.com",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "saas_db",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false, // For AWS RDS
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test connection
pool.on("connect", () => {
  console.log("[v0] Connected to PostgreSQL database")
})

pool.on("error", (err) => {
  console.error("[v0] Unexpected error on idle client", err)
})

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("[v0] Executed query", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("[v0] Query error", { text, error })
    throw error
  }
}

export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect()
  return client
}

// Helper to execute queries in a specific tenant schema
export async function tenantQuery(tenantId: string, text: string, params?: any[]) {
  const client = await getClient()
  try {
    await client.query(`SET search_path TO company_${tenantId}, public`)
    const res = await client.query(text, params)
    return res
  } finally {
    client.release()
  }
}

// Helper to create a new tenant schema
export async function createTenantSchema(cnpj: string) {
  const tenantId = cnpj.replace(/[^\d]/g, "") // Remove non-numeric characters
  const schemaName = `company_${tenantId}`

  const client = await getClient()
  try {
    await client.query("BEGIN")

    // Create schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`)

    // Create customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        cpf VARCHAR(14),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create vehicles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.vehicles (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES ${schemaName}.customers(id) ON DELETE CASCADE,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER,
        plate VARCHAR(20) NOT NULL UNIQUE,
        color VARCHAR(50),
        km INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create service_orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.service_orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES ${schemaName}.customers(id) ON DELETE CASCADE,
        vehicle_id INTEGER REFERENCES ${schemaName}.vehicles(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'pending',
        observations TEXT,
        created_by VARCHAR(255) NOT NULL,
        completed_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `)

    // Create payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.payments (
        id SERIAL PRIMARY KEY,
        service_order_id INTEGER REFERENCES ${schemaName}.service_orders(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50),
        payment_status VARCHAR(20) DEFAULT 'pending',
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes for better performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON ${schemaName}.customers(phone)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON ${schemaName}.vehicles(plate)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_service_orders_status ON ${schemaName}.service_orders(status)`)
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON ${schemaName}.service_orders(created_at)`,
    )

    await client.query("COMMIT")

    console.log(`[v0] Created tenant schema: ${schemaName}`)
    return schemaName
  } catch (error) {
    await client.query("ROLLBACK")
    console.error(`[v0] Error creating tenant schema:`, error)
    throw error
  } finally {
    client.release()
  }
}

export default pool
