"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthState, logout, type User } from "@/lib/auth";
import {
  getAllUsers,
  createUser as apiCreateUser,
  deleteUser as apiDeleteUser,
  updateUser,
} from "@/lib/api-users";
import {
  getAllServices,
  getServiceStats,
  type ServiceStats,
} from "@/lib/api-services";
import {
  getAllQueueCategories,
  createQueueCategory,
  updateQueueCategory,
  deleteQueueCategory,
  type QueueCategory,
} from "@/lib/api-queue";
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  type Role,
} from "@/lib/api-roles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Pencil,
  List,
  Info,
  Plus,
  Badge,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUserEditDialogOpen, setIsUserEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    cpf: "",
    senha: "",
    cargo: "mecanico",
    queues: [] as number[],
  });
  const [userEditFormData, setUserEditFormData] = useState({
    nome_completo: "",
    email: "",
    cargo: "",
    ativo: true,
    queues: [] as number[],
  });
  const [error, setError] = useState("");
  const [queueCategories, setQueueCategories] = useState<QueueCategory[]>([]);
  const [isQueueDialogOpen, setIsQueueDialogOpen] = useState(false);
  const [isQueueEditDialogOpen, setIsQueueEditDialogOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<QueueCategory | null>(null);
  const [queueFormData, setQueueFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isRoleEditDialogOpen, setIsRoleEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });
  const router = useRouter();

  useEffect(() => {
    const { isAuthenticated, user } = getAuthState();
    console.log("Auth state:", isAuthenticated, user?.role);

    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/");
      return;
    }

    console.log("Loading admin data...");
    loadData();
  }, [router]);

  const loadData = async () => {
    console.log("loadData called");
    try {
      setIsLoading(true);

      const [usersData, statsData, categoriesData, rolesData] =
        await Promise.all([
          getAllUsers(),
          getServiceStats(),
          getAllQueueCategories(),
          getAllRoles(),
        ]);
      const transformedUsers = usersData.map((u: any) => ({
        id: u.id.toString(),
        name: u.nome_completo,
        email: u.email,
        role:
          u.cargo === "admin"
            ? ("admin" as const)
            : u.cargo === "atendente"
              ? ("attendant" as const)
              : ("mechanic" as const),
      }));
      setUsers(transformedUsers);
      setStats(statsData);
      setQueueCategories(categoriesData);
      setRoles(rolesData);
      console.log("Admin data loaded:", {
        users: transformedUsers.length,
        stats: statsData,
        categories: categoriesData.length,
        roles: rolesData.length,
      });
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleCreateUser = async () => {
    if (!formData.nome_completo || !formData.email || !formData.senha) {
      setError("Preencha todos os campos");
      return;
    }

    try {
      await apiCreateUser({
        nome_completo: formData.nome_completo,
        email: formData.email,
        cpf: formData.cpf,
        senha: formData.senha,
        cargo: formData.cargo,
        queues: formData.queues,
      });
      setFormData({
        nome_completo: "",
        email: "",
        cpf: "",
        senha: "",
        cargo: "mecanico",
        queues: [],
      });
      setError("");
      setIsDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Erro ao criar usuário");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        await apiDeleteUser(parseInt(id));
        loadData();
      } catch (err) {
        console.error("Erro ao excluir:", err);
      }
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserEditFormData({
      nome_completo: user.name || "",
      email: user.email || "",
      cargo:
        user.role === "admin"
          ? "admin"
          : user.role === "attendente"
            ? "atendente"
            : "mecanico",
      ativo: true,
      queues: user.queues?.map((q: any) => q.id) || [],
    });
    setIsUserEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await updateUser(parseInt(editingUser.id), {
        nome_completo: userEditFormData.nome_completo,
        email: userEditFormData.email,
        cargo: userEditFormData.cargo,
        ativo: userEditFormData.ativo,
        queues: userEditFormData.queues,
      });
      setIsUserEditDialogOpen(false);
      setEditingUser(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar usuário");
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      mecanico: "Mecânico",
      atendente: "Atendente",
      admin: "Administrador",
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      mecanico: "bg-blue-500",
      atendente: "bg-green-500",
      admin: "bg-purple-500",
    };
    return colors[role] || "bg-slate-500";
  };

  const handleCreateQueueCategory = async () => {
    if (!queueFormData.name) {
      setError("Nome é obrigatório");
      return;
    }

    try {
      await createQueueCategory({
        name: queueFormData.name,
        description: queueFormData.description,
        color: queueFormData.color,
      });
      setQueueFormData({ name: "", description: "", color: "#3B82F6" });
      setError("");
      setIsQueueDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Erro ao criar fila");
    }
  };

  const handleEditQueue = (queue: QueueCategory) => {
    setEditingQueue(queue);
    setQueueFormData({
      name: queue.name,
      description: queue.description || "",
      color: queue.color,
    });
    setIsQueueEditDialogOpen(true);
  };

  const handleUpdateQueueCategory = async () => {
    if (!editingQueue) return;

    try {
      await updateQueueCategory(editingQueue.id, {
        name: queueFormData.name,
        description: queueFormData.description,
        color: queueFormData.color,
      });
      setIsQueueEditDialogOpen(false);
      setEditingQueue(null);
      setQueueFormData({ name: "", description: "", color: "#3B82F6" });
      loadData();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar fila");
    }
  };

  const handleDeleteQueue = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta fila?")) {
      try {
        await deleteQueueCategory(id);
        loadData();
      } catch (err) {
        console.error("Erro ao excluir:", err);
      }
    }
  };

  const handleCreateRole = async () => {
    if (!roleFormData.name) {
      setError("Nome é obrigatório");
      return;
    }

    try {
      await createRole({
        name: roleFormData.name,
        description: roleFormData.description,
        color: roleFormData.color,
      });
      setRoleFormData({ name: "", description: "", color: "#3B82F6" });
      setError("");
      setIsRoleDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Erro ao criar função");
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description || "",
      color: role.color,
    });
    setIsRoleEditDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      await updateRole(editingRole.id, {
        name: roleFormData.name,
        description: roleFormData.description,
        color: roleFormData.color,
      });
      setIsRoleEditDialogOpen(false);
      setEditingRole(null);
      setRoleFormData({ name: "", description: "", color: "#3B82F6" });
      loadData();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar função");
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta função?")) {
      try {
        await deleteRole(id);
        loadData();
      } catch (err) {
        console.error("Erro ao excluir:", err);
      }
    }
  };

  const mechanicUsers = users.filter((u) => u.role === "mechanic");
  const attendantUsers = users.filter((u) => u.role === "attendant");
  const adminUsers = users.filter((u) => u.role === "admin");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Painel Administrativo
              </h1>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Desempenho</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="queues">Filas</TabsTrigger>
            <TabsTrigger value="roles">Funções</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Serviços
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Ordens de serviço
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Concluídos
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.completed || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Serviços finalizados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Em Andamento
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.in_progress || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Serviços ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pendentes
                  </CardTitle>
                  <Clock className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-600">
                    {stats?.pending || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando início
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <CardDescription>
                    Total: {users.length} usuários cadastrados
                  </CardDescription>
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
                      <DialogDescription>
                        Preencha os dados do novo usuário
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                          id="name"
                          placeholder="Nome completo"
                          value={formData.nome_completo}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nome_completo: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="usuario@oficina.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          onChange={(e) =>
                            setFormData({ ...formData, cpf: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Senha de acesso"
                          value={formData.senha}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              senha: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Função</Label>
                        <Select
                          value={formData.cargo}
                          onValueChange={(value) =>
                            setFormData({ ...formData, cargo: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.name}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: role.color }}
                                  />
                                  {role.description || role.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="queues">Filas</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                          {queueCategories.map((queue) => (
                            <div
                              key={queue.id}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`queue-${queue.id}`}
                                checked={formData.queues.includes(queue.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      queues: [...formData.queues, queue.id],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      queues: formData.queues.filter(
                                        (q) => q !== queue.id,
                                      ),
                                    });
                                  }
                                }}
                              />
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: queue.color }}
                              />
                              <Label
                                htmlFor={`queue-${queue.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {queue.name}
                              </Label>
                            </div>
                          ))}
                          {queueCategories.length === 0 && (
                            <p className="text-sm text-slate-500">
                              Nenhuma fila cadastrada
                            </p>
                          )}
                        </div>
                      </div>
                      {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
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
                    <h3 className="font-semibold">
                      Mecânicos ({mechanicUsers.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {mechanicUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${getRoleColor(user.role)} text-white`}
                          >
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
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
                      <p className="text-sm text-slate-500 text-center py-4">
                        Nenhum mecânico cadastrado
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <h3 className="font-semibold">
                      Atendentes ({attendantUsers.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {attendantUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${getRoleColor(user.role)} text-white`}
                          >
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
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
                      <p className="text-sm text-slate-500 text-center py-4">
                        Nenhum atendente cadastrado
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold">
                      Administradores ({adminUsers.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {adminUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                        <Badge
                          className={`${getRoleColor(user.role)} text-white`}
                        >
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Dialog
              open={isUserEditDialogOpen}
              onOpenChange={setIsUserEditDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Usuário</DialogTitle>
                  <DialogDescription>
                    Atualize os dados do usuário
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editUserName">Nome</Label>
                    <Input
                      id="editUserName"
                      value={userEditFormData.nome_completo}
                      onChange={(e) =>
                        setUserEditFormData({
                          ...userEditFormData,
                          nome_completo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editUserEmail">Email</Label>
                    <Input
                      id="editUserEmail"
                      value={userEditFormData.email}
                      onChange={(e) =>
                        setUserEditFormData({
                          ...userEditFormData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editUserRole">Função</Label>
                    <Select
                      value={userEditFormData.cargo}
                      onValueChange={(value) =>
                        setUserEditFormData({
                          ...userEditFormData,
                          cargo: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: role.color }}
                              />
                              {role.description || role.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="editUserActive"
                      checked={userEditFormData.ativo}
                      onCheckedChange={(checked) =>
                        setUserEditFormData({
                          ...userEditFormData,
                          ativo: checked === true,
                        })
                      }
                    />
                    <Label htmlFor="editUserActive">Usuário ativo</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Filas</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {queueCategories.map((queue) => (
                        <div key={queue.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`edit-queue-${queue.id}`}
                            checked={userEditFormData.queues.includes(queue.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setUserEditFormData({
                                  ...userEditFormData,
                                  queues: [
                                    ...userEditFormData.queues,
                                    queue.id,
                                  ],
                                });
                              } else {
                                setUserEditFormData({
                                  ...userEditFormData,
                                  queues: userEditFormData.queues.filter(
                                    (q) => q !== queue.id,
                                  ),
                                });
                              }
                            }}
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: queue.color }}
                          />
                          <Label
                            htmlFor={`edit-queue-${queue.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {queue.name}
                          </Label>
                        </div>
                      ))}
                      {queueCategories.length === 0 && (
                        <p className="text-sm text-slate-500">
                          Nenhuma fila cadastrada
                        </p>
                      )}
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsUserEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateUser}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="queues" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <List className="w-5 h-5" />
                    Gerenciar Filas
                  </CardTitle>
                  <CardDescription>
                    Crie e gerencie categorias de filas para organizar seus
                    serviços
                  </CardDescription>
                </div>
                <Dialog
                  open={isQueueDialogOpen}
                  onOpenChange={setIsQueueDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Nova Fila
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Fila</DialogTitle>
                      <DialogDescription>
                        Defina o nome e configurações da nova fila
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="queueName">Nome da Fila</Label>
                        <Input
                          id="queueName"
                          placeholder="Ex: Alinhamento, Motor, Elétrica"
                          value={queueFormData.name}
                          onChange={(e) =>
                            setQueueFormData({
                              ...queueFormData,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="queueDescription">Descrição</Label>
                        <Input
                          id="queueDescription"
                          placeholder="Descrição opcional"
                          value={queueFormData.description}
                          onChange={(e) =>
                            setQueueFormData({
                              ...queueFormData,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="queueColor">Cor</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="queueColor"
                            type="color"
                            className="w-12 h-10 p-1"
                            value={queueFormData.color}
                            onChange={(e) =>
                              setQueueFormData({
                                ...queueFormData,
                                color: e.target.value,
                              })
                            }
                          />
                          <Input
                            value={queueFormData.color}
                            onChange={(e) =>
                              setQueueFormData({
                                ...queueFormData,
                                color: e.target.value,
                              })
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                      {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsQueueDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateQueueCategory}>Criar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {queueCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <List className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">
                      Nenhuma fila cadastrada
                    </p>
                    <p className="text-sm text-slate-400">
                      Crie filas para organizar seus serviços por área ou
                      profissional
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {queueCategories.map((queue) => (
                      <div
                        key={queue.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: queue.color }}
                          />
                          <div>
                            <p className="font-medium">{queue.name}</p>
                            {queue.description && (
                              <p className="text-xs text-slate-500">
                                {queue.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditQueue(queue)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQueue(queue.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Como Usar as Filas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-purple-600 font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Crie uma fila acima</p>
                      <p className="text-sm text-slate-600">
                        Use o botão "Nova Fila" para criar categorias como
                        "Alinhamento", "Motor", "Elétrica", etc.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-purple-600 font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Atribua ao criar serviço</p>
                      <p className="text-sm text-slate-600">
                        Ao criar uma nova ordem de serviço, selecione a fila
                        responsável no campo "Fila".
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Gerencie na tela inicial</p>
                      <p className="text-sm text-slate-600">
                        Visualize e gerencie os serviços de cada fila na tela
                        inicial do sistema.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Dialog
              open={isQueueEditDialogOpen}
              onOpenChange={setIsQueueEditDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Fila</DialogTitle>
                  <DialogDescription>
                    Atualize os dados da fila
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editQueueName">Nome da Fila</Label>
                    <Input
                      id="editQueueName"
                      value={queueFormData.name}
                      onChange={(e) =>
                        setQueueFormData({
                          ...queueFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editQueueDescription">Descrição</Label>
                    <Input
                      id="editQueueDescription"
                      value={queueFormData.description}
                      onChange={(e) =>
                        setQueueFormData({
                          ...queueFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editQueueColor">Cor</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="editQueueColor"
                        type="color"
                        className="w-12 h-10 p-1"
                        value={queueFormData.color}
                        onChange={(e) =>
                          setQueueFormData({
                            ...queueFormData,
                            color: e.target.value,
                          })
                        }
                      />
                      <Input
                        value={queueFormData.color}
                        onChange={(e) =>
                          setQueueFormData({
                            ...queueFormData,
                            color: e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsQueueEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateQueueCategory}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className="w-5 h-5" />
                    Gerenciar Funções
                  </CardTitle>
                  <CardDescription>
                    Crie e gerencie funções/cargos para definir permissões de
                    acesso
                  </CardDescription>
                </div>
                <Dialog
                  open={isRoleDialogOpen}
                  onOpenChange={setIsRoleDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Nova Função
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Função</DialogTitle>
                      <DialogDescription>
                        Defina o nome e configurações da nova função
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="roleName">Nome da Função</Label>
                        <Input
                          id="roleName"
                          placeholder="Ex: Gerente, Vendedor, Técnico"
                          value={roleFormData.name}
                          onChange={(e) =>
                            setRoleFormData({
                              ...roleFormData,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roleDescription">Descrição</Label>
                        <Input
                          id="roleDescription"
                          placeholder="Descrição opcional"
                          value={roleFormData.description}
                          onChange={(e) =>
                            setRoleFormData({
                              ...roleFormData,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roleColor">Cor</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="roleColor"
                            type="color"
                            className="w-12 h-10 p-1"
                            value={roleFormData.color}
                            onChange={(e) =>
                              setRoleFormData({
                                ...roleFormData,
                                color: e.target.value,
                              })
                            }
                          />
                          <Input
                            value={roleFormData.color}
                            onChange={(e) =>
                              setRoleFormData({
                                ...roleFormData,
                                color: e.target.value,
                              })
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                      {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsRoleDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateRole}>Criar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {roles.length === 0 ? (
                  <div className="text-center py-8">
                    <Badge className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">
                      Nenhuma função cadastrada
                    </p>
                    <p className="text-sm text-slate-400">
                      Crie funções para definir diferentes cargos na empresa
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          <div>
                            <p className="font-medium">{role.name}</p>
                            {role.description && (
                              <p className="text-xs text-slate-500">
                                {role.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRole(role)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Como Usar as Funções
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-purple-600 font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Crie funções específicas</p>
                      <p className="text-sm text-slate-600">
                        Use o botão "Nova Função" para criar cargos específicos
                        do seu negócio como "Gerente", "Vendedor", "Técnico",
                        etc.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-purple-600 font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Atribua aos usuários</p>
                      <p className="text-sm text-slate-600">
                        Ao criar ou editar usuários, selecione a função
                        adequada.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Sistema multi-negócio</p>
                      <p className="text-sm text-slate-600">
                        Cada empresa pode ter suas próprias funções. As funções
                        padrão (admin, atendente, mecanico) ficam disponíveis
                        para todos.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Dialog
              open={isRoleEditDialogOpen}
              onOpenChange={setIsRoleEditDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Função</DialogTitle>
                  <DialogDescription>
                    Atualize os dados da função
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editRoleName">Nome da Função</Label>
                    <Input
                      id="editRoleName"
                      value={roleFormData.name}
                      onChange={(e) =>
                        setRoleFormData({
                          ...roleFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editRoleDescription">Descrição</Label>
                    <Input
                      id="editRoleDescription"
                      value={roleFormData.description}
                      onChange={(e) =>
                        setRoleFormData({
                          ...roleFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editRoleColor">Cor</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="editRoleColor"
                        type="color"
                        className="w-12 h-10 p-1"
                        value={roleFormData.color}
                        onChange={(e) =>
                          setRoleFormData({
                            ...roleFormData,
                            color: e.target.value,
                          })
                        }
                      />
                      <Input
                        value={roleFormData.color}
                        onChange={(e) =>
                          setRoleFormData({
                            ...roleFormData,
                            color: e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsRoleEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateRole}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
