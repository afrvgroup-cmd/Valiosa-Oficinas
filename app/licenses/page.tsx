"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthState, logout } from "@/lib/auth"
import {
  getAllCompanies,
  createCompany,
  deleteCompany,
  updateCompany,
  type Company,
} from "@/lib/api-companies"
import { createUser } from "@/lib/api-users"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  LogOut,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  Pencil,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LicenseStats {
  total: number
  active: number
  suspended: number
  expired: number
  trial: number
  revenue: number
}

export default function LicensesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [stats, setStats] = useState<LicenseStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    plan: "basic",
    status: "trial",
    maxUsers: 5,
    startDate: new Date().toISOString().split("T")[0],
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  })
  const [userFormData, setUserFormData] = useState({
    nome_completo: "",
    cpf: "",
    email: "",
    senha: "",
    cargo: "admin",
  })
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    plan: "",
    status: "",
    maxUsers: 0,
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const { isAuthenticated, user } = getAuthState()
    console.log("Licenses page auth:", isAuthenticated, user?.role)

    if (!isAuthenticated || user?.role !== "super-admin") {
      router.push("/")
      return
    }

    loadData()
  }, [router])

  useEffect(() => {
    const filtered = companies.filter(
      (company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.cnpj.includes(searchTerm) ||
        (company.email && company.email.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredCompanies(filtered)
  }, [searchTerm, companies])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const companiesData = await getAllCompanies()
      setCompanies(companiesData)
      
      const calculatedStats = calculateStats(companiesData)
      setStats(calculatedStats)
      console.log("Companies loaded:", companiesData.length)
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (companiesList: Company[]): LicenseStats => {
    const stats: LicenseStats = {
      total: companiesList.length,
      active: 0,
      suspended: 0,
      expired: 0,
      trial: 0,
      revenue: 0,
    }

    const planPrices: Record<string, number> = {
      basic: 99,
      professional: 249,
      enterprise: 499,
    }

    companiesList.forEach((company) => {
      const status = company.license_status || company.status
      const plan = company.plan || "basic"

      if (status === "active") stats.active++
      else if (status === "suspended") stats.suspended++
      else if (status === "expired") stats.expired++
      else if (status === "trial") stats.trial++

      if (status === "active" || status === "trial") {
        stats.revenue += planPrices[plan] || 99
      }
    })

    return stats
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleCreateCompany = async () => {
    if (!formData.name || !formData.cnpj) {
      setError("Nome e CNPJ são obrigatórios")
      return
    }

    try {
      console.log("Creating company:", formData)
      const companyResult = await createCompany(formData)
      console.log("Company created:", companyResult)
      
      if (userFormData.nome_completo && userFormData.email && userFormData.senha) {
        console.log("Creating admin user for company:", companyResult.id)
        await createUser({
          nome_completo: userFormData.nome_completo,
          cpf: userFormData.cpf,
          email: userFormData.email,
          senha: userFormData.senha,
          cargo: userFormData.cargo,
          tenant_id: companyResult.id,
        })
      }
      
      setFormData({
        name: "",
        cnpj: "",
        email: "",
        phone: "",
        plan: "basic",
        status: "trial",
        maxUsers: 5,
        startDate: new Date().toISOString().split("T")[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      })
      setUserFormData({
        nome_completo: "",
        email: "",
        senha: "",
        cargo: "admin",
      })
      setError("")
      setIsCreateDialogOpen(false)
      loadData()
    } catch (err: any) {
      console.error("Error creating company:", err)
      setError(err.message || "Erro ao criar empresa")
    }
  }

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company)
    setEditFormData({
      name: company.name || "",
      email: company.email || "",
      phone: company.phone || "",
      plan: company.plan || "basic",
      status: company.license_status || "trial",
      maxUsers: company.max_users || 5,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateCompany = async () => {
    if (!selectedCompany) return

    try {
      await updateCompany(selectedCompany.id, {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
      })
      setIsEditDialogOpen(false)
      setSelectedCompany(null)
      loadData()
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar empresa")
    }
  }

  const handleDeleteCompany = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta empresa?")) {
      try {
        await deleteCompany(id)
        loadData()
      } catch (err) {
        console.error("Erro ao excluir:", err)
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-500",
      suspended: "bg-red-500",
      expired: "bg-gray-500",
      trial: "bg-yellow-500",
    }
    const labels: Record<string, string> = {
      active: "Ativo",
      suspended: "Suspenso",
      expired: "Expirado",
      trial: "Trial",
    }
    return (
      <Badge className={`${statusColors[status] || "bg-gray-500"} text-white`}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    const planColors: Record<string, string> = {
      basic: "bg-blue-500",
      professional: "bg-purple-500",
      enterprise: "bg-orange-500",
    }
    return (
      <Badge className={`${planColors[plan] || "bg-gray-500"} text-white`}>
        {plan}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Licenças</h1>
              <p className="text-xs text-slate-600">Gestão de Empresas</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.trial || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspensas</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.suspended || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats?.revenue || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                <DialogDescription>
                  Preencha os dados da nova empresa
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome</Label>
                  <Input
                    id="companyName"
                    placeholder="Nome da empresa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyCnpj">CNPJ</Label>
                  <Input
                    id="companyCnpj"
                    placeholder="00.000.000/0001-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    placeholder="empresa@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefone</Label>
                  <Input
                    id="companyPhone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyPlan">Plano</Label>
                    <Select
                      value={formData.plan}
                      onValueChange={(value) => setFormData({ ...formData, plan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyStatus">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="suspended">Suspenso</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyMaxUsers">Máximo de Usuários</Label>
                  <Input
                    id="companyMaxUsers"
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyStartDate">Data de Início</Label>
                    <Input
                      id="companyStartDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyExpirationDate">Data de Expiração</Label>
                    <Input
                      id="companyExpirationDate"
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Usuário Administrador</h4>
                  <div className="space-y-2">
                    <Label htmlFor="userName">Nome do Administrador</Label>
                    <Input
                      id="userName"
                      placeholder="Nome completo"
                      value={userFormData.nome_completo}
                      onChange={(e) => setUserFormData({ ...userFormData, nome_completo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="userCpf">CPF</Label>
                    <Input
                      id="userCpf"
                      placeholder="000.000.000-00"
                      value={userFormData.cpf}
                      onChange={(e) => setUserFormData({ ...userFormData, cpf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="userEmail">Email do Administrador</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder="admin@empresa.com"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="userPassword">Senha</Label>
                    <Input
                      id="userPassword"
                      type="password"
                      placeholder="Senha de acesso"
                      value={userFormData.senha}
                      onChange={(e) => setUserFormData({ ...userFormData, senha: e.target.value })}
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCompany}>Cadastrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  <CardDescription className="mt-1">{company.cnpj}</CardDescription>
                </div>
                <div className="flex gap-1">
                  {getPlanBadge(company.plan || "basic")}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {company.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="font-medium">Email:</span> {company.email}
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="font-medium">Tel:</span> {company.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(company.license_status || company.status || "trial")}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-medium">Usuários:</span> {company.current_users || 0}/{company.max_users || 5}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditCompany(company)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteCompany(company.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma empresa encontrada</p>
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Empresa</DialogTitle>
              <DialogDescription>
                Atualize os dados da empresa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editCompanyName">Nome</Label>
                <Input
                  id="editCompanyName"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCompanyEmail">Email</Label>
                <Input
                  id="editCompanyEmail"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCompanyPhone">Telefone</Label>
                <Input
                  id="editCompanyPhone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateCompany}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}