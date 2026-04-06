"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthState, logout, getAllUsers, createUser, deleteUser, type User } from "@/lib/auth"
import { getPerformanceStats } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  ShieldCheck,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserPlus,
  Trash2,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "mechanic" })
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const { isAuthenticated, user } = getAuthState()

    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/")
      return
    }

    loadData()
  }, [router])

  const loadData = () => {
    setUsers(getAllUsers())
    setStats(getPerformanceStats())
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleCreateUser = () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError("Preencha todos os campos")
      return
    }

    const success = createUser(formData.name, formData.email, formData.password, formData.role as any)

    if (success) {
      setFormData({ name: "", email: "", password: "", role: "mechanic" })
      setError("")
      setIsDialogOpen(false)
      loadData()
    } else {
      setError("Email já cadastrado")
    }
  }

  const handleDeleteUser = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUser(id)
      loadData()
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      mechanic: "Mecânico",
      attendant: "Atendente",
      admin: "Administrador",
    }
    return labels[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      mechanic: "bg-blue-500",
      attendant: "bg-green-500",
      admin: "bg-purple-500",
    }
    return colors[role] || "bg-slate-500"
  }

  const mechanicUsers = users.filter((u) => u.role === "mechanic")
  const attendantUsers = users.filter((u) => u.role === "attendant")
  const adminUsers = users.filter((u) => u.role === "admin")

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Painel Administrativo</h1>
              <p className="text-xs text-slate-600">Gestão e Desempenho</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="performance">Desempenho</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalServices || 0}</div>
                  <p className="text-xs text-muted-foreground">{stats?.thisMonthServices || 0} este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats?.completedServices || 0}</div>
                  <p className="text-xs text-muted-foreground">Taxa: {stats?.completionRate || 0}%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats?.inProgressServices || 0}</div>
                  <p className="text-xs text-muted-foreground">Serviços ativos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-600">{stats?.pendingServices || 0}</div>
                  <p className="text-xs text-muted-foreground">Aguardando início</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Mês</CardTitle>
                <CardDescription>Comparativo com o mês anterior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Este mês</span>
                    <span className="text-2xl font-bold text-slate-900">{stats?.thisMonthServices || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Mês anterior</span>
                    <span className="text-lg font-semibold text-slate-600">{stats?.lastMonthServices || 0}</span>
                  </div>
                  {stats && stats.thisMonthServices > stats.lastMonthServices && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-700 font-medium">
                        ↑ Crescimento de {stats.thisMonthServices - stats.lastMonthServices} serviços
                      </p>
                    </div>
                  )}
                  {stats && stats.thisMonthServices < stats.lastMonthServices && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm text-orange-700 font-medium">
                        ↓ Redução de {stats.lastMonthServices - stats.thisMonthServices} serviços
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <CardDescription>Total: {users.length} usuários cadastrados</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                      <DialogDescription>Preencha os dados do novo usuário</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                          id="name"
                          placeholder="Nome completo"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="usuario@oficina.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Senha de acesso"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Função</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mechanic">Mecânico</SelectItem>
                            <SelectItem value="attendant">Atendente</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateUser}>Cadastrar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold">Mecânicos ({mechanicUsers.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {mechanicUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getRoleColor(user.role)} text-white`}>{getRoleLabel(user.role)}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {mechanicUsers.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">Nenhum mecânico cadastrado</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <h3 className="font-semibold">Atendentes ({attendantUsers.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {attendantUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getRoleColor(user.role)} text-white`}>{getRoleLabel(user.role)}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {attendantUsers.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">Nenhum atendente cadastrado</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold">Administradores ({adminUsers.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {adminUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                        <Badge className={`${getRoleColor(user.role)} text-white`}>{getRoleLabel(user.role)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
