"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthState, logout } from "@/lib/auth";
import {
  getAllServices,
  createService,
  deleteService,
  updateService,
  type Service,
  type ServicePriority,
} from "@/lib/services";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LogOut,
  Plus,
  Search,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  CircleUserRound,
  ImageIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AttendantPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  // Create form states
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [plate, setPlate] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ServicePriority>("medium");
  const [queue, setQueue] = useState("");
  const [professional, setProfessional] = useState("");

  // Edit states
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editVehicle, setEditVehicle] = useState("");
  const [editPlate, setEditPlate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<ServicePriority>("medium");
  const [editStatus, setEditStatus] = useState<Service["status"]>("pending");
  const [editQueue, setEditQueue] = useState("");
  const [editProfessional, setEditProfessional] = useState("");

  // Create client
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [clientFormName, setClientFormName] = useState("");
  const [clientFormPhone, setClientFormPhone] = useState("");
  const [clientFormDocument, setClientFormDocument] = useState("");
  const [clientFormEmail, setClientFormEmail] = useState("");
  const [clientFormAddress, setClientFormAddress] = useState("");
  const [clientFormCity, setClientFormCity] = useState("");
  const [clientFormState, setClientFormState] = useState("");
  const [clientFormZip, setClientFormZip] = useState("");

  useEffect(() => {
    const { isAuthenticated, user } = getAuthState();

    if (!isAuthenticated || user?.role !== "attendant") {
      router.push("/");
      return;
    }

    loadServices();
  }, [router]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = services.filter(
        (service) =>
          service.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.vehicle.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  }, [searchTerm, services]);

  const loadServices = () => {
    const allServices = getAllServices();
    setServices(allServices);
    setFilteredServices(allServices);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();

    const { user } = getAuthState();
    if (!user) return;

    createService({
      clientName,
      clientPhone,
      vehicle,
      plate: plate.toUpperCase(),
      description,
      priority,
      createdBy: user.name,
      queue,
      professional,
    });

    setSuccessMessage("Serviço cadastrado com sucesso!");
    setTimeout(() => setSuccessMessage(""), 3000);

    setClientName("");
    setClientPhone("");
    setVehicle("");
    setPlate("");
    setDescription("");
    setPriority("medium");
    setQueue("");
    setProfessional("");
    setIsDialogOpen(false);

    loadServices();
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();

    // Aqui você salva no localStorage ou na API futuramente
    const clients = JSON.parse(localStorage.getItem("clients") || "[]");
    const newClient = {
      id: Date.now().toString(),
      name: clientFormName,
      phone: clientFormPhone,
      document: clientFormDocument,
      email: clientFormEmail,
      address: clientFormAddress,
      city: clientFormCity,
      state: clientFormState,
      zip: clientFormZip,
      createdAt: new Date().toISOString(),
    };
    clients.push(newClient);
    localStorage.setItem("clients", JSON.stringify(clients));

    setSuccessMessage("Cliente cadastrado com sucesso!");
    setTimeout(() => setSuccessMessage(""), 3000);

    // Reset
    setClientFormName("");
    setClientFormPhone("");
    setClientFormDocument("");
    setClientFormEmail("");
    setClientFormAddress("");
    setClientFormCity("");
    setClientFormState("");
    setClientFormZip("");
    setIsClientDialogOpen(false);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setEditClientName(service.clientName);
    setEditClientPhone(service.clientPhone);
    setEditVehicle(service.vehicle);
    setEditPlate(service.plate);
    setEditDescription(service.description);
    setEditPriority(service.priority ?? "medium");
    setEditStatus(service.status ?? "pending");
    setEditQueue(service.queue ?? "");
    setEditProfessional(service.professional ?? "");
  };

  const handleUpdateService = () => {
    if (!editingService) return;

    const result = updateService(editingService.id, {
      clientName: editClientName,
      clientPhone: editClientPhone,
      vehicle: editVehicle,
      plate: editPlate,
      description: editDescription,
      priority: editPriority,
      status: editStatus,
      queue: editQueue,
      professional: editProfessional,
    });

    if (!result.success) {
      console.error(result.error);
      return;
    }

    setSuccessMessage("Serviço atualizado com sucesso!");
    setTimeout(() => setSuccessMessage(""), 3000);
    setEditingService(null);
    loadServices();
  };

  const handleDeleteService = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      deleteService(id);
      loadServices();
    }
  };

  const getPriorityColor = (priority: ServicePriority) => {
    const colors = {
      low: "bg-blue-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    };
    return colors[priority];
  };

  const getPriorityLabel = (priority: ServicePriority) => {
    const labels = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
    };
    return labels[priority];
  };

  const getStatusLabel = (status: Service["status"]) => {
    const labels = {
      pending: "Pendente",
      "in-progress": "Em Andamento",
      completed: "Concluído",
    };
    return labels[status];
  };

  const getStatusIcon = (status: Service["status"]) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      "in-progress": <AlertCircle className="w-4 h-4" />,
      completed: <CheckCircle2 className="w-4 h-4" />,
    };
    return icons[status];
  };

  const getStatusColor = (status: Service["status"]) => {
    const colors = {
      pending: "bg-slate-500",
      "in-progress": "bg-blue-500",
      completed: "bg-green-500",
    };
    return colors[status];
  };

  const stats = {
    total: services.length,
    pending: services.filter((s) => s.status === "pending").length,
    inProgress: services.filter((s) => s.status === "in-progress").length,
    completed: services.filter((s) => s.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Painel do Atendente
              </h1>
              <p className="text-sm text-slate-600">
                Gerencie suas ordens de serviços
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Serviços</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pendentes</CardDescription>
              <CardTitle className="text-3xl text-slate-600">
                {stats.pending}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Em Andamento</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {stats.inProgress}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Concluídos</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {stats.completed}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Serviços Cadastrados</CardTitle>
                <CardDescription>
                  Lista de todos os serviços registrados no sistema
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 gap-2 w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    Novo Serviço
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Serviço</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do cliente e do serviço
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={handleCreateService}
                    className="space-y-4 mt-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="queue">Fila</Label>
                        <Select value={queue} onValueChange={setQueue}>
                          <SelectTrigger className="w-full" id="queue">
                            <SelectValue placeholder="Selecione a fila" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mechanic">Mecânico</SelectItem>
                            <SelectItem value="attendant">Atendente</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="professional">Profissional</Label>
                        <Select
                          value={professional}
                          onValueChange={setProfessional}
                        >
                          <SelectTrigger className="w-full" id="professional">
                            <SelectValue placeholder="Selecione o profissional" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jose">José da Silva</SelectItem>
                            <SelectItem value="jorge">
                              Jorge dos Santos
                            </SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientName">Nome do Cliente *</Label>

                        <div className="flex items-center gap-2">
                          <Input
                            className="w-full"
                            id="clientName"
                            placeholder="João Silva"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            required
                          />
                          <Dialog
                            open={isClientDialogOpen}
                            onOpenChange={setIsClientDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="bg-transparent"
                              >
                                <CircleUserRound className="w-6 h-6" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Cadastrar Cliente</DialogTitle>
                                <DialogDescription>
                                  Preencha os dados do novo cliente
                                </DialogDescription>
                              </DialogHeader>
                              <form
                                onSubmit={handleCreateClient}
                                className="space-y-4 mt-4"
                              >
                                {/* Dados pessoais */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="clientFormName">
                                      Nome completo *
                                    </Label>
                                    <Input
                                      id="clientFormName"
                                      placeholder="João Silva"
                                      value={clientFormName}
                                      onChange={(e) =>
                                        setClientFormName(e.target.value)
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="clientFormPhone">
                                      Telefone *
                                    </Label>
                                    <Input
                                      id="clientFormPhone"
                                      placeholder="(11) 98765-4321"
                                      value={clientFormPhone}
                                      onChange={(e) =>
                                        setClientFormPhone(e.target.value)
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="clientFormDocument">
                                      CPF / CNPJ
                                    </Label>
                                    <Input
                                      id="clientFormDocument"
                                      placeholder="000.000.000-00"
                                      value={clientFormDocument}
                                      onChange={(e) =>
                                        setClientFormDocument(e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="clientFormEmail">
                                      Email
                                    </Label>
                                    <Input
                                      id="clientFormEmail"
                                      type="email"
                                      placeholder="joao@email.com"
                                      value={clientFormEmail}
                                      onChange={(e) =>
                                        setClientFormEmail(e.target.value)
                                      }
                                    />
                                  </div>
                                </div>

                                {/* Endereço */}
                                <div className="space-y-2">
                                  <Label htmlFor="clientFormAddress">
                                    Endereço
                                  </Label>
                                  <Input
                                    id="clientFormAddress"
                                    placeholder="Rua das Flores, 123"
                                    value={clientFormAddress}
                                    onChange={(e) =>
                                      setClientFormAddress(e.target.value)
                                    }
                                  />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  <div className="space-y-2 col-span-1 sm:col-span-1">
                                    <Label htmlFor="clientFormZip">CEP</Label>
                                    <Input
                                      id="clientFormZip"
                                      placeholder="00000-000"
                                      value={clientFormZip}
                                      onChange={(e) =>
                                        setClientFormZip(e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="clientFormCity">
                                      Cidade
                                    </Label>
                                    <Input
                                      id="clientFormCity"
                                      placeholder="São Paulo"
                                      value={clientFormCity}
                                      onChange={(e) =>
                                        setClientFormCity(e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="clientFormState">
                                      Estado
                                    </Label>
                                    <Select
                                      value={clientFormState}
                                      onValueChange={setClientFormState}
                                    >
                                      <SelectTrigger id="clientFormState">
                                        <SelectValue placeholder="UF" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[
                                          "AC",
                                          "AL",
                                          "AM",
                                          "AP",
                                          "BA",
                                          "CE",
                                          "DF",
                                          "ES",
                                          "GO",
                                          "MA",
                                          "MG",
                                          "MS",
                                          "MT",
                                          "PA",
                                          "PB",
                                          "PE",
                                          "PI",
                                          "PR",
                                          "RJ",
                                          "RN",
                                          "RO",
                                          "RR",
                                          "RS",
                                          "SC",
                                          "SE",
                                          "SP",
                                          "TO",
                                        ].map((uf) => (
                                          <SelectItem key={uf} value={uf}>
                                            {uf}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsClientDialogOpen(false)}
                                    className="flex-1"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    type="submit"
                                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                                  >
                                    Cadastrar Cliente
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientPhone">Telefone *</Label>
                        <Input
                          id="clientPhone"
                          placeholder="(11) 98765-4321"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clientPhone">CPF *</Label>
                        <Input
                          id="clientCPF"
                          placeholder="000.000.000-00"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle">Marca *</Label>
                        <Input
                          id="vehicle"
                          placeholder="Fiat Uno 2015"
                          value={vehicle}
                          onChange={(e) => setVehicle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plate">Modelo *</Label>
                        <Input
                          id="plate"
                          placeholder="ABC-1234"
                          value={plate}
                          onChange={(e) => setPlate(e.target.value)}
                          required
                          className="uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Prioridade *</Label>
                      <Select
                        value={priority}
                        onValueChange={(value) =>
                          setPriority(value as ServicePriority)
                        }
                      >
                        <SelectTrigger className="w-full" id="priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Problema Relatado *</Label>
                      <Textarea
                        id="description"
                        placeholder="Descreva o problema relatado pelo cliente..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fotos</Label>
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-center cursor-not-allowed opacity-60">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">
                          Adicionar fotos
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="outline"
                        type="submit"
                        className="flex-1"
                      >
                        Imprimir
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                      >
                        Cadastrar Serviço
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por cliente, placa ou veículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {searchTerm
                    ? "Nenhum serviço encontrado"
                    : "Nenhum serviço cadastrado ainda"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredServices.map((service) => (
                  <Card
                    key={service.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleOpenEdit(service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900 shrink-0">
                              {service.clientName}
                            </h3>
                            <p className="text-sm text-slate-500 truncate">
                              {service.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {service.plate}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              {service.vehicle}
                            </span>
                            {service.professional && (
                              <span className="text-sm text-slate-400">
                                · {service.professional}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            className={`${getPriorityColor(service.priority)} text-white text-xs`}
                          >
                            {getPriorityLabel(service.priority)}
                          </Badge>
                          <Badge
                            className={`${getStatusColor(service.status)} text-white gap-1 text-xs`}
                          >
                            {getStatusIcon(service.status)}
                            {getStatusLabel(service.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={!!editingService}
          onOpenChange={(open) => !open && setEditingService(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Serviço - N. 1001</DialogTitle>
              <DialogDescription>
                Atualize os dados ou o status do atendimento
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fila</Label>
                  <Select value={editQueue} onValueChange={setEditQueue}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a fila" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mechanic">Mecânico</SelectItem>
                      <SelectItem value="attendant">Atendente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Select
                    value={editProfessional}
                    onValueChange={setEditProfessional}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jose">José da Silva</SelectItem>
                      <SelectItem value="jorge">Jorge dos Santos</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nome do Cliente</Label>
                  <Input
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={editClientPhone}
                    onChange={(e) => setEditClientPhone(e.target.value)}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input
                    value={editVehicle}
                    onChange={(e) => setEditVehicle(e.target.value)}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Input
                    value={editPlate}
                    onChange={(e) => setEditPlate(e.target.value)}
                    className="uppercase"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={editPriority}
                    onValueChange={(v) => setEditPriority(v as ServicePriority)}
                    disabled
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(v) => setEditStatus(v as Service["status"])}
                    disabled
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in-progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Histórico</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label>Atualização</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  // onClick={() => setEditingService(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingService(null)}
                  className="flex-1"
                >
                  Encerrar Serviço
                </Button>

                <Button
                  onClick={handleUpdateService}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
