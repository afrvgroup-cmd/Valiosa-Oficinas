import { Pool, type PoolClient } from "pg"

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "valiosa_services",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

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

export async function tenantQuery(tenantId: string, text: string, params?: any[]) {
  const client = await getClient()
  try {
    const res = await client.query(text, params)
    return res
  } finally {
    client.release()
  }
}

export default pool