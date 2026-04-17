# AGENTS.md - Valiosa Oficinas

## Stack

- **Frontend**: Next.js 16.2.0 (App Router) - `D:\Valiosa\Valiosa-Oficinas`
- **Backend**: Express (JavaScript) - `D:\Valiosa\Valiosa-Oficinas-API`
- **Database**: PostgreSQL with `pg` library (both projects)
- **Auth**: JWT

## Project Structure

Two separate projects (NOT a monorepo):
- `Valiosa-Oficinas/` - Frontend Next.js (port 3000)
- `Valiosa-Oficinas-API/` - Express API (port 3001)

The frontend uses both direct DB queries (`lib/db.ts`) and API calls to backend (`lib/config.ts` → `localhost:3001/api`).

## Commands

```bash
# Frontend (port 3000)
cd D:\Valiosa\Valiosa-Oficinas
npm run dev      # next dev
npm run build    # next build
npm run lint     # eslint .

# Backend (port 3001)
cd D:\Valiosa\Valiosa-Oficinas-API
npm run dev      # node ./src/server.js
```

## Environment Variables

**Frontend** (`Valiosa-Oficinas/.env.local`):
- `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

**Backend** (`Valiosa-Oficinas-API/.env`):
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT=3001`

## Database

PostgreSQL with `pg` library - NOT Prisma. All tables use UUID primary keys:
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL
```

Key tables: `usuarios`, `service_orders`, `queue`, `queue_categories`, `roles`, `customers`, `companies`, `licenses`, `history`, `user_queues`, `payments`

## JWT Payload

```js
{ id, cliente_id, cargo }
// cargo = role name from roles table
```

## Frontend Roles

- `super-admin` - Full access
- `admin` - Admin panel
- `attendant` - Attendant page
- `mecanico` - Same page as attendant
- Custom roles - Created in Roles tab

## Key Implementation Details

- `service_orders.service_number` is sequential per tenant
- Users belong to multiple queues via `user_queues` (many-to-many)
- Queue categories and roles are tenant-specific (filtered by `tenant_id`)
- `admin` and `super-admin` see all service orders for their tenant
- History tracks service order observations with `entity_type='service_order'`