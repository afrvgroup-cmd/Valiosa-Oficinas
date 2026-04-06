"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthState, logout } from "@/lib/auth"
import {
  getAllLicenses,
  createLicense,
  updateLicense,
  deleteLicense,
  getLicenseStats,
  checkLicenseExpiration,
  getExpiringLicenses,
  initializeLicenses,
  type License,
} from "@/lib/licenses"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
  Sparkles,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([])
  const [stats, setStats] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [formData, setFormData] = useState({
    companyName: "",
    cnpj: "",
    email: "",
    phone: "",
    plan: "basic",
    status: "trial",
    maxUsers: 5,
    startDate: new Date().toISOString().split("T")[0],
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
  })
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const { isAuthenticated, user } = getAuthState()

    if (!isAuthenticated || user?.role !== "super-admin") {
      router.push("/")
      return
    }

    initializeLicenses()
    loadData()
  }, [router])

  useEffect(() => {
    const filtered = licenses.filter(
      (license) =>
        license.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.cnpj.includes(searchTerm) ||
        license.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredLicenses(filtered)
  }, [searchTerm, licenses])

  const loadData = () => {
    setLicenses(getAllLicenses())
    setStats(getLicenseStats())
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleCreateLicense = () => {
    if (!formData.companyName || !formData.cnpj || !formData.email) {
      setError("Preencha todos os campos obrigatórios")
      return
    }

    const success = createLicense(formData as any)

    if (success) {
      resetForm()
      setIsCreateDialogOpen(false)
      loadData()
    } else {
      setError("CNPJ já cadastrado")
    }
  }

  const handleEditLicense = () => {
    if (!selectedLicense) return

    const success = updateLicense(selectedLicense.id, formData as any)

    if (success) {
      resetForm()
      setIsEditDialogOpen(false)
      setSelectedLicense(null)
      loadData()
    }
  }

  const handleDeleteLicense = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta licença?")) {
      deleteLicense(id)
      loadData()
    }
  }

  const openEditDialog = (license: License) => {
    setSelectedLicense(license)
    setFormData({
      companyName: license.companyName,
      cnpj: license.cnpj,
      email: license.email,
      phone: license.phone,
      plan: license.plan,
      status: license.status,
      maxUsers: license.maxUsers,
      startDate: license.startDate,
      expirationDate: license.expirationDate,
      notes: license.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      companyName: "",
      cnpj: "",
      email: "",
      phone: "",
      plan: "basic",
      status: "trial",
      maxUsers: 5,
      startDate: new Date().toISOString().split("T")[0],
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "",
    })
    setError("")
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any; label: string }> = {
      active: { color: "bg-green-500", icon: CheckCircle2, label: "Ativa" },
      suspended: { color: "bg-orange-500", icon: AlertCircle, label: "Suspensa" },
      expired: { color: "bg-red-500", icon: XCircle, label: "Expirada" },
      trial: { color: "bg-blue-500", icon: Sparkles, label: "Teste" },
    }
    const variant = variants[status] || variants.active
    const Icon = variant.icon

    return (
      <Badge className={`${variant.color} text-white gap-1`}>
        <Icon className="w-3 h-3" />
        {variant.label}
      </Badge>
    )
  }

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      basic: "Básico",
      professional: "Profissional",
      enterprise: "Enterprise",
    }
    return labels[plan] || plan
  }

  const expiringLicenses = getExpiringLicenses(30)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Gestão de Licenças</h1>
              <p className="text-xs text-slate-600">Controle de clientes SAAS</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/admin")}>
              Voltar
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="licenses">Licenças</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Licenças</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Licenças Ativas</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
                  <p className="text-xs text-muted-foreground">{stats?.trial || 0} em período de teste</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {stats?.revenue?.toLocaleString("pt-BR") || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Estimativa mensal</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expirando</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{expiringLicenses.length}</div>
                  <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-sm">Ativas</span>
                    </div>
                    <span className="font-bold">{stats?.active || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-sm">Teste</span>
                    </div>
                    <span className="font-bold">{stats?.trial || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      <span className="text-sm">Suspensas</span>
                    </div>
                    <span className="font-bold">{stats?.suspended || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-sm">Expiradas</span>
                    </div>
                    <span className="font-bold">{stats?.expired || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Plano</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Básico</span>
                    <span className="font-bold">{licenses.filter((l) => l.plan === "basic").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Profissional</span>
                    <span className="font-bold">{licenses.filter((l) => l.plan === "professional").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enterprise</span>
                    <span className="font-bold">{licenses.filter((l) => l.plan === "enterprise").length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="licenses" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Licenças</CardTitle>
                  <CardDescription>Controle completo dos clientes SAAS</CardDescription>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" onClick={resetForm}>
                      <Plus className="w-4 h-4" />
                      Nova Licença
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Cadastrar Nova Licença</DialogTitle>
                      <DialogDescription>Preencha os dados do novo cliente</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Nome da Empresa *</Label>
                          <Input
                            id="companyName"
                            placeholder="Oficina LTDA"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cnpj">CNPJ *</Label>
                          <Input
                            id="cnpj"
                            placeholder="00.000.000/0000-00"
                            value={formData.cnpj}
                            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="contato@empresa.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            placeholder="(11) 99999-9999"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="plan">Plano</Label>
                          <Select
                            value={formData.plan}
                            onValueChange={(value) => setFormData({ ...formData, plan: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Básico (R$ 99/mês)</SelectItem>
                              <SelectItem value="professional">Profissional (R$ 249/mês)</SelectItem>
                              <SelectItem value="enterprise">Enterprise (R$ 499/mês)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="trial">Teste</SelectItem>
                              <SelectItem value="active">Ativa</SelectItem>
                              <SelectItem value="suspended">Suspensa</SelectItem>
                              <SelectItem value="expired">Expirada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxUsers">Máx. Usuários</Label>
                          <Input
                            id="maxUsers"
                            type="number"
                            min="1"
                            value={formData.maxUsers}
                            onChange={(e) => setFormData({ ...formData, maxUsers: Number.parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Data de Início</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expirationDate">Data de Expiração</Label>
                          <Input
                            id="expirationDate"
                            type="date"
                            value={formData.expirationDate}
                            onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          placeholder="Anotações sobre o cliente..."
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={3}
                        />
                      </div>
                      {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateLicense}>Cadastrar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por empresa, CNPJ ou email..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  {filteredLicenses.map((license) => {
                    const daysLeft = checkLicenseExpiration(license)
                    const isExpiringSoon = daysLeft > 0 && daysLeft <= 30

                    return (
                      <div key={license.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">{license.companyName}</h3>
                              {getStatusBadge(license.status)}
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                              <p>CNPJ: {license.cnpj}</p>
                              <p>Email: {license.email}</p>
                              <p>Telefone: {license.phone}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => openEditDialog(license)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteLicense(license.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                          <div>
                            <p className="text-xs text-slate-500">Plano</p>
                            <p className="font-semibold text-sm">{getPlanLabel(license.plan)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Usuários</p>
                            <p className="font-semibold text-sm">
                              {license.currentUsers} / {license.maxUsers}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Início</p>
                            <p className="font-semibold text-sm">
                              {new Date(license.startDate).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Expiração</p>
                            <p className={`font-semibold text-sm ${isExpiringSoon ? "text-orange-600" : ""}`}>
                              {new Date(license.expirationDate).toLocaleDateString("pt-BR")}
                              {isExpiringSoon && <span className="ml-1">({daysLeft} dias)</span>}
                            </p>
                          </div>
                        </div>

                        {license.notes && (
                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-500 mb-1">Observações:</p>
                            <p className="text-sm text-slate-700">{license.notes}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {filteredLicenses.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nenhuma licença encontrada</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Licenças Expirando (30 dias)
                </CardTitle>
                <CardDescription>Licenças que precisam de renovação em breve</CardDescription>
              </CardHeader>
              <CardContent>
                {expiringLicenses.length > 0 ? (
                  <div className="space-y-3">
                    {expiringLicenses.map((license) => {
                      const daysLeft = checkLicenseExpiration(license)
                      return (
                        <div
                          key={license.id}
                          className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-semibold">{license.companyName}</p>
                            <p className="text-sm text-slate-600">{license.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">{daysLeft} dias</p>
                            <p className="text-xs text-slate-600">
                              Expira em {new Date(license.expirationDate).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-30" />
                    <p>Nenhuma licença expirando nos próximos 30 dias</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  Licenças Suspensas ou Expiradas
                </CardTitle>
                <CardDescription>Licenças que precisam de atenção imediata</CardDescription>
              </CardHeader>
              <CardContent>
                {licenses.filter((l) => l.status === "suspended" || l.status === "expired").length > 0 ? (
                  <div className="space-y-3">
                    {licenses
                      .filter((l) => l.status === "suspended" || l.status === "expired")
                      .map((license) => (
                        <div
                          key={license.id}
                          className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-semibold">{license.companyName}</p>
                            <p className="text-sm text-slate-600">{license.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(license.status)}
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(license)}>
                              Reativar
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-30" />
                    <p>Todas as licenças estão ativas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Licença</DialogTitle>
              <DialogDescription>Atualize os dados da licença</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-companyName">Nome da Empresa</Label>
                  <Input
                    id="edit-companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cnpj">CNPJ</Label>
                  <Input id="edit-cnpj" value={formData.cnpj} disabled className="bg-slate-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-plan">Plano</Label>
                  <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Teste</SelectItem>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="suspended">Suspensa</SelectItem>
                      <SelectItem value="expired">Expirada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maxUsers">Máx. Usuários</Label>
                  <Input
                    id="edit-maxUsers"
                    type="number"
                    min="1"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: Number.parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Data de Início</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-expirationDate">Data de Expiração</Label>
                  <Input
                    id="edit-expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Observações</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditLicense}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
