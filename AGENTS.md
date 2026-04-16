# AGENTS.md - Valiosa Oficinas API

## Stack

- **Backend**: Node.js + Express (JavaScript) - `D\Valiosa\Valiosa-Oficinas-API`)
- **Frontend**: Next.js 14+ (App Router) - `D:\Valiosa\Valiosa-Oficinas`
- **Database**: PostgreSQL with `pg` library (NOT Prisma)
- **Auth**: JWT

## IDs - UUID

Todas as tabelas usam UUID como ID primário:

```sql
id uuid DEFAULT gen_random_uuid() NOT NULL
```

## Current Backend Structure

```
src/
├── server.js              # Express app (port 3001)
├── config/db.js           # PostgreSQL pool (import/export - ES modules)
├── routes/
│   ├── authRoutes.js      # POST /login
│   ├── usersRoutes.js     # CRUD for usuarios
│   ├── servicesRoutes.js  # CRUD for service_orders
│   ├── customersRoutes.js # CRUD for customers
│   ├── queuesRoutes.js    # CRUD for queue
│   ├── queueCategoriesRoutes.js # CRUD for queue_categories
│   ├── rolesRoutes.js     # CRUD for roles
│   ├── licensesRoutes.js # CRUD for licenses
│   ├── historiesRoutes.js # CRUD for history
│   └── companiesRoutes.js # CRUD for companies
├── controllers/
│   ├── authController.js  # login logic, bcrypt compare
│   ├── usersController.js # user CRUD with queues support
│   ├── servicesController.js
│   ├── customersController.js
│   ├── queueController.js
│   ├── queueCategoriesController.js
│   ├── rolesController.js
│   ├── licensesController.js
│   ├── historyController.js
│   └── companiesController.js
├── middleware/
│   └── authMiddleware.js  # authenticateToken + authorizeRoles
└── utils/
    └── cpfUtils.js
```

## Database Tables

### companies

- id (uuid), name, cnpj, email, phone, adress\_\*

### licenses

- id (uuid), company_id (uuid), plan, status, max_users, current_users, start_date, expiration_date, notes

### usuarios

- id (uuid), nome_completo, email, cpf, senha_hash, cargo, ativo, tenant_id, created_at, updated_at

### queue_categories

- id (uuid), name, description, color, active, tenant_id, created_at

### roles

- id (uuid), name, description, permissions (jsonb), color, active, tenant_id, created_at

### user_queues

- id (uuid), user_id (uuid), queue_category_id (uuid), created_at

### customers

- id (uuid), name, phone, email, document, cpf, address, city, state, zip_code, tenant_id, created_at, updated_at

### service_orders

- id (uuid), service_number (integer), customer_id (uuid), brand, model, description, priority, status, observations, queue_id (uuid), assigned_to (uuid), created_by, completed_by, tenant_id, created_at, updated_at, completed_at

### queue

- id (uuid), service_order_id (uuid), position, status, called_at, called_by, started_at, finished_at, tenant_id, created_at

### payments

- id (uuid), service_order_id (uuid), amount, payment_method, status, paid_at, tenant_id, created_at, updated_at

### history

- id (uuid), entity_type, entity_id (uuid), action, description, performed_by, old_data (jsonb), new_data (jsonb), user_id (uuid), tenant_id, created_at

## JWT Payload

```js
{
  (id, cliente_id, cargo);
} // cargo = role name from roles table
```

## Frontend Roles

- `super-admin` - Acesso total
- `admin` - Painel admin
- `attendant` - Atendimento
- `mecanico` - Atendimento (mesma página que attendant)
- Custom roles - Criadas na aba Funções

## API Endpoints

| Resource         | Methods                                                    |
| ---------------- | ---------------------------------------------------------- |
| Auth             | `POST /api/login`, `POST /api/refresh`, `POST /api/logout` |
| Services         | CRUD for service_orders                                    |
| Users            | CRUD for usuarios (includes queues field)                  |
| Customers        | CRUD for customers                                         |
| Queue            | CRUD for queues                                            |
| Queue Categories | CRUD for queue_categories                                  |
| Roles            | CRUD for roles                                             |
| Licenses         | CRUD for licenses                                          |
| History          | CRUD for history                                           |
| Companies        | CRUD for companies                                         |

## Commands

```bash
npm start        # node ./src/server.js
```

## Environment Variables

```
DB_HOST, DB_PORT, DB_DATABASE, DB_USER, DB_PASSWORD
JWT_SECRET
JWT_REFRESH_SECRET
PORT=3001
```

## Frontend Reference

- Services: `Valiosa-Oficinas/lib/services.ts`, `lib/api-services.ts`
- Auth: `Valiosa-Oficinas/lib/auth.ts`
- Licenses: `Valiosa-Oficinas/lib/licenses.ts`, `lib/db-licenses.ts`
- Queue: `Valiosa-Oficinas/lib/api-queue.ts`
- Roles: `Valiosa-Oficinas/lib/api-roles.ts`
- Users: `Valiosa-Oficinas/lib/api-users.ts`
- History: `Valiosa-Oficinas/lib/api-history.ts`
- API base: `http://localhost:3001/api`

## Frontend Pages

### Admin Page (`/admin`)

- **Performance Tab**: Stats (total, completed, in_progress, pending)
- **Services Tab**: Lista todas as ordens de serviço com busca
- **Users Tab**: CRUD users with queue selection (multiple queues per user)
- **Queues Tab**: CRUD queue categories (filas)
- **Roles Tab**: CRUD custom roles/cargos

### Attendant Page (`/attendant`)

- Lista de ordens de serviço filtradas por fila do usuário (user_queues)
- Busca por número da OS em todas as filas
- Criar nova ordem de serviço (selecionar fila e profissional)
- Editar ordem de serviço com histórico de observações
- Abrir OS de qualquer fila via URL (serviceId)
- Limpa URL automaticamente ao fechar modal de edição

## Key Implementation Details

- IDs são UUID (gen_random_uuid())
- service_orders tem service_number sequencial por tenant
- Users can belong to multiple queues (many-to-many via user_queues)
- Roles são customizáveis por empresa (tabela roles)
- Filtro de serviços por fila do usuário logado (user_queues)
- Queue categories and roles são tenant-specific (filtered by tenant_id)
- Customers tem campos document e cpf
- History: entity_type='service_order', entity_id=service_orders.id, Salva description e performed_by
- Frontend attendant mostra "Problema relatado" + lista de histórico de observações
- admin e super-admin têm acesso a todas as OS da empresa (tenant)
- searchByNumber e getByIdNoFilter filtram por tenant_id (isolamento entre empresas)
