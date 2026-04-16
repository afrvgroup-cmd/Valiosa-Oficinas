"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthState, logout, getCurrentUser } from "@/lib/auth";
import { GlobalSearch } from "@/components/global-search";
import {
  getAllServices,
  createService as apiCreateService,
  updateService as apiUpdateService,
  deleteService as apiDeleteService,
  type Service,
  type ServicePriority,
} from "@/lib/api-services";
import {
  getAllCustomers,
  createCustomer,
  searchCustomers,
  type Customer,
} from "@/lib/api-customers";
import { getAllQueueCategories, type QueueCategory } from "@/lib/api-queue";
import { getAllUsers, getUsersByQueue, type User } from "@/lib/api-users";
import { getAllHistory, createHistory, getHistoryByServiceOrder } from "@/lib/api-history";
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
  SendHorizontal,
  Paperclip,
  Smile,
  Hash,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

export default function AttendantPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchByNumber, setSearchByNumber] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceIdRef = React.useRef<HTMLDivElement | null>(null);

  // Customers list
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  // Queue categories and users (dynamic from API)
  const [queueCategories, setQueueCategories] = useState<QueueCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [availableProfessionals, setAvailableProfessionals] = useState<User[]>(
    [],
  );

  // Create form states
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ServicePriority>("medium");
  const [queue, setQueue] = useState("");
  const [professional, setProfessional] = useState("");

  // Edit states
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<ServicePriority>("medium");
  const [editStatus, setEditStatus] = useState<Service["status"]>("pending");
  const [editQueue, setEditQueue] = useState("");
  const [editProfessional, setEditProfessional] = useState("");
  const [editObservations, setEditObservations] = useState("");
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);

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
    const { user } = getAuthState();
    if (!user) {
      router.push("/");
      return;
    }

    loadServices();
    loadCustomers();
    loadQueueCategories();
    loadUsers();
  }, []);

// Carregar OS específica via API se não estiver na lista local
const loadServiceById = async (serviceId: string) => {
    try {
      const { getServiceByIdNoFilter } = await import("@/lib/api-services");
      const service = await getServiceByIdNoFilter(serviceId);
      if (service) {
        setEditingService(service);
        return true;
      }
    } catch (err) {
      console.error("Erro ao carregar OS:", err);
    }
    return false;
  };

  const handleCloseEdit = () => {
    setEditingService(null);
    router.replace("/attendant");
  };

  useEffect(() => {
    const serviceId = searchParams.get("serviceId");
    
    if (!serviceId) return;
    
    const localService = services.find((s) => s.id.toString() === serviceId);
    if (localService) {
      setEditingService(localService);
      return;
    }
    
    loadServiceById(serviceId);
  }, [searchParams, services]);

  const loadCustomers = async () => {
    try {
      const allCustomers = await getAllCustomers();
      setCustomers(allCustomers);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  };

  const loadQueueCategories = async () => {
    try {
      const categories = await getAllQueueCategories();
      setQueueCategories(categories);
    } catch (err) {
      console.error("Erro ao carregar filas:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await getUsersByQueue();
      setUsers(allUsers);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      if (queue) {
        const queueObj = queueCategories.find((q) => q.id.toString() === queue);
        if (queueObj) {
          const filtered = users.filter((u) => {
            return u.queues?.some((q) => q.id === queueObj.id);
          });
          setAvailableProfessionals(filtered);
          setProfessional("");
        }
      } else {
        setAvailableProfessionals(users);
      }
    }
  }, [queue, users, queueCategories]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = services.filter(
        (service) =>
          (searchTerm &&
            (service.customer_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            service.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            service.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (service.queue &&
              service.queue.toLowerCase().includes(searchTerm.toLowerCase())))) ||
          (searchByNumber &&
            service.service_number.toString() === searchByNumber)
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  }, [searchTerm, searchByNumber, services]);

  const loadServices = async () => {
    try {
      const allServices = await getAllServices();
      setServices(allServices);
      setFilteredServices(allServices);
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user || !selectedCustomerId) return;

    const selectedCustomer = customers.find(
      (c) => c.id.toString() === selectedCustomerId,
    );
    if (!selectedCustomer) {
      return;
    }

    try {
      await apiCreateService({
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        brand,
        model,
        description,
        priority,
        queueId: queue || undefined,
        professionalId: professional || undefined,
        createdBy: user.name,
        obs: "",
      });

      setSelectedCustomerId("");
      setCustomerSearchTerm("");
      setBrand("");
      setModel("");
      setDescription("");
      setPriority("medium");
      setQueue("");
      setProfessional("");
      setFilteredCustomers(customers);
      setIsDialogOpen(false);
      setSuccessMessage("Serviço cadastrado com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
      loadServices();
    } catch (err) {
      console.error("Erro ao criar serviço:", err);
    }
  };

  useEffect(() => {
    // Não executar busca se há um cliente selecionado
    if (selectedCustomerId) return;

    const timeout = setTimeout(() => {
      if (customerSearchTerm.length >= 2) {
        searchCustomers(customerSearchTerm).then(setFilteredCustomers);
      } else if (customerSearchTerm.length === 0) {
        setFilteredCustomers(customers);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [customerSearchTerm, customers, selectedCustomerId]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newCustomer = await createCustomer({
        name: clientFormName,
        phone: clientFormPhone,
        cpf: clientFormDocument || undefined,
        email: clientFormEmail || undefined,
        address: clientFormAddress,
      });

      setCustomers([...customers, newCustomer]);
      setFilteredCustomers([...filteredCustomers, newCustomer]);
      setSelectedCustomerId(newCustomer.id.toString());
      setSuccessMessage("Cliente cadastrado com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);

      setClientFormName("");
      setClientFormPhone("");
      setClientFormDocument("");
      setClientFormEmail("");
      setClientFormAddress("");
      setClientFormCity("");
      setClientFormState("");
      setClientFormZip("");
      setIsClientDialogOpen(false);
      setCustomerSearchTerm("");
    } catch (err) {
      console.error("Erro ao criar cliente:", err);
    }
  };

  const handleOpenEdit = async (service: Service) => {
    setEditingService(service);
    setEditClientName((service as any).customer_name || "");
    setEditClientPhone((service as any).customer_phone || "");
    setEditBrand((service as any).brand || "");
    setEditModel((service as any).model || "");
    setEditDescription(service.description || "");
    setEditPriority(service.priority ?? "medium");
    setEditStatus(service.status ?? "pending");
    setEditQueue((service as any).queue_id?.toString() || "");
    setEditProfessional((service as any).assigned_to?.toString() || "");
    setEditObservations("");
    
    // Load history for this service
    try {
      const history = await getHistoryByServiceOrder(service.id.toString());
      setServiceHistory(history);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      setServiceHistory([]);
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    const user = getCurrentUser();
    const userName = user?.name || "Usuário";

    try {
      await apiUpdateService(editingService.id, {
        description: editDescription,
        priority: editPriority,
        status: editStatus,
        observations: editObservations,
        queueId: editQueue || undefined,
        assignedTo: editProfessional || undefined,
      });

      // Save to history if there's content
      if (editObservations && editObservations.trim()) {
        await createHistory({
          service_order_id: editingService.id.toString(),
          action: "Observação adicionada",
          description: editObservations,
          performed_by: userName,
        });
      }

      setSuccessMessage("Serviço atualizado com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
      handleCloseEdit();
      setEditObservations("");
      loadServices();
    } catch (err) {
      console.error("Erro ao atualizar:", err);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      try {
        await apiDeleteService(id);
        loadServices();
      } catch (err) {
        console.error("Erro ao excluir:", err);
      }
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
            <div className="w-16 h-16 flex items-center justify-center">
              {/* <ClipboardList className="w-6 h-6 text-white" /> */}
              <img src="/Logo-Fundo.png" alt="Logo" />
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
          <div className="flex items-center gap-3">
            <GlobalSearch />
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
                            {queueCategories.map((cat) => (
                              <SelectItem
                                key={cat.id}
                                value={cat.id.toString()}
                              >
                                {cat.name}
                              </SelectItem>
                            ))}
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
                            {availableProfessionals.map((prof) => (
                              <SelectItem
                                key={prof.id}
                                value={prof.id.toString()}
                              >
                                {prof.nome_completo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer">Cliente *</Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            placeholder="Buscar cliente por nome, CPF ou telefone..."
                            value={customerSearchTerm}
                            onChange={(e) => {
                              setCustomerSearchTerm(e.target.value);
                              setSelectedCustomerId("");
                            }}
                            className="w-full"
                          />
                          {customerSearchTerm.length > 0 &&
                            selectedCustomerId === "" && (
                              <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredCustomers.length > 0 ? (
                                  filteredCustomers.map((customer) => (
                                    <div
                                      key={customer.id}
                                      className="p-2 hover:bg-accent cursor-pointer"
                                      onClick={() => {
                                        setSelectedCustomerId(
                                          customer.id.toString(),
                                        );
                                        setCustomerSearchTerm(customer.name);
                                        setFilteredCustomers([]);
                                        // Adicionar cliente ao array local se não existir
                                        if (!customers.find(c => c.id.toString() === customer.id.toString())) {
                                          setCustomers([...customers, customer]);
                                        }
                                      }}
                                    >
                                      <div className="font-medium">
                                        {customer.name}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {customer.phone}{" "}
                                        {customer.cpf
                                          ? ` · ${customer.cpf}`
                                          : ""}
                                      </div>
                                    </div>
                                  ))
                                ) : customerSearchTerm.length >= 2 ? (
                                  <div className="p-2 text-sm text-muted-foreground">
                                    Nenhum cliente encontrado
                                  </div>
                                ) : null}
                              </div>
                            )}
                        </div>
                        <Dialog
                          open={isClientDialogOpen}
                          onOpenChange={setIsClientDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="bg-transparent ml-2 shrink-0"
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
                                  <Label htmlFor="clientFormEmail">Email</Label>
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
                                  <Label htmlFor="clientFormCity">Cidade</Label>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="brand">CPF *</Label>
                        <Input
                          id="cpf/cnpj"
                          placeholder="000.000.000-00"
                          value={
                            selectedCustomerId
                              ? customers.find(
                                  (c) => c.id.toString() === selectedCustomerId,
                                )?.cpf || ""
                              : ""
                          }
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model">Telefone *</Label>
                        <Input
                          id="phone"
                          placeholder="(11) 98765-4321"
                          value={
                            selectedCustomerId
                              ? customers.find(
                                  (c) => c.id.toString() === selectedCustomerId,
                                )?.phone || ""
                              : ""
                          }
                          disabled
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="brand">Marca *</Label>
                        <Input
                          id="brand"
                          placeholder="Toyota"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model">Modelo *</Label>
                        <Input
                          id="model"
                          placeholder="Corolla"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          required
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
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por cliente, marca ou modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative w-32">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Nº OS"
                  value={searchByNumber}
                  onChange={(e) => setSearchByNumber(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {searchTerm || searchByNumber
                    ? "Nenhum serviço encontrado"
                    : "Nenhum serviço cadastrado ainda"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredServices.map((service) => (
                  <Card
                    key={service.id}
                    id={`service-${service.id}`}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleOpenEdit(service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-mono text-slate-400">
                              #{service.service_number}
                            </span>
                            <h3 className="font-semibold text-slate-900 shrink-0">
                              {service.customer_name}
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
                              {service.model}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              {service.brand}
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
          onOpenChange={(open) => !open && handleCloseEdit()}
        >
          <DialogContent className="max-w-lg w-[calc(100vw-2rem)] overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                Editar Serviço - N. {editingService?.service_number}
              </DialogTitle>
              <DialogDescription>
                Atualize os dados ou o status do atendimento
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4 min-w-0 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                <div className="space-y-2">
                  <Label>Fila</Label>
                  <Select value={editQueue} onValueChange={setEditQueue}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a fila" />
                    </SelectTrigger>
                    <SelectContent>
                      {queueCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
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
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.nome_completo}
                        </SelectItem>
                      ))}
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
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Input
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
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

                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3 bg-slate-50">
                    {/* Problema relatado - descrição inicial */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                      <p className="text-xs font-semibold text-orange-700 mb-1">Problema relatado</p>
                      <p className="text-sm text-slate-700">{editDescription || (editingService as any)?.description || "Sem descrição"}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Criado por: {editingService?.created_by || "Usuário"} em{" "}
                        {editingService?.created_at && new Date(editingService.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    
                    {/* Histórico de observações */}
                    {serviceHistory.length > 0 ? (
                      serviceHistory.map((h, idx) => (
                        <div key={idx} className="text-sm border-b pb-2 last:border-0">
                          <p className="text-slate-700">{h.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {h.performed_by} - {h.created_at && new Date(h.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Nenhuma observação registrada</p>
                    )}
                  </div>
                </div>
              <div className="space-y-2">
                <Label>Atualização</Label>

                <div
                  className="relative border rounded-xl bg-background w-full overflow-hidden"
                  style={{ maxWidth: "100%" }}
                >
                  <Textarea
                    value={editObservations}
                    onChange={(e) => setEditObservations(e.target.value)}
                    rows={4}
                    className="resize-none border-0 focus-visible:ring-0 pr-16 pb-12 w-full max-h-40 overflow-y-auto"
                    placeholder="Digite uma observação..."
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  />

                  {/* Barra inferior */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    {/* Ícones da esquerda */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {/* Exemplo de ícones */}
                      <Paperclip className="w-4 h-4 cursor-pointer hover:text-foreground" />
                      <Smile className="w-4 h-4 cursor-pointer hover:text-foreground" />
                    </div>

                    {/* Botão enviar */}
                    <Button
                      onClick={handleUpdateService}
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 rounded-lg px-3"
                    >
                      <SendHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 pt-4">
                <Checkbox />
                <p className="text-xs text-slate-500">
                  Visivel ao cliente?(Envia mensagem para o cliente)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleCloseEdit()}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCloseEdit()}
                  className="flex-1"
                >
                  Encerrar Serviço
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUpdateService}
                  className="flex-1"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
