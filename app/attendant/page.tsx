"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthState, logout } from "@/lib/auth"
import { getAllServices, createService, deleteService, type Service, type ServicePriority } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LogOut, Plus, Trash2, Search, ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AttendantPage() {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()

  // Form states
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [plate, setPlate] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<ServicePriority>("medium")

  useEffect(() => {
    const { isAuthenticated, user } = getAuthState()

    if (!isAuthenticated || user?.role !== "attendant") {
      router.push("/")
      return
    }

    loadServices()
  }, [router])

  useEffect(() => {
    if (searchTerm) {
      const filtered = services.filter(
        (service) =>
          service.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.vehicle.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredServices(filtered)
    } else {
      setFilteredServices(services)
    }
  }, [searchTerm, services])

  const loadServices = () => {
    const allServices = getAllServices()
    setServices(allServices)
    setFilteredServices(allServices)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault()

    const { user } = getAuthState()
    if (!user) return

    createService({
      clientName,
      clientPhone,
      vehicle,
      plate: plate.toUpperCase(),
      description,
      priority,
      createdBy: user.name,
    })

    setSuccessMessage("Serviço cadastrado com sucesso!")
    setTimeout(() => setSuccessMessage(""), 3000)

    // Reset form
    setClientName("")
    setClientPhone("")
    setVehicle("")
    setPlate("")
    setDescription("")
    setPriority("medium")
    setIsDialogOpen(false)

    loadServices()
  }

  const handleDeleteService = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      deleteService(id)
      loadServices()
    }
  }

  const getPriorityColor = (priority: ServicePriority) => {
    const colors = {
      low: "bg-blue-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    }
    return colors[priority]
  }

  const getPriorityLabel = (priority: ServicePriority) => {
    const labels = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
    }
    return labels[priority]
  }

  const getStatusLabel = (status: Service["status"]) => {
    const labels = {
      pending: "Pendente",
      "in-progress": "Em Andamento",
      completed: "Concluído",
    }
    return labels[status]
  }

  const getStatusIcon = (status: Service["status"]) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      "in-progress": <AlertCircle className="w-4 h-4" />,
      completed: <CheckCircle2 className="w-4 h-4" />,
    }
    return icons[status]
  }

  const getStatusColor = (status: Service["status"]) => {
    const colors = {
      pending: "bg-slate-500",
      "in-progress": "bg-blue-500",
      completed: "bg-green-500",
    }
    return colors[status]
  }

  const stats = {
    total: services.length,
    pending: services.filter((s) => s.status === "pending").length,
    inProgress: services.filter((s) => s.status === "in-progress").length,
    completed: services.filter((s) => s.status === "completed").length,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Painel do Atendente</h1>
              <p className="text-sm text-slate-600">Gerencie suas ordens de serviços</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
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
              <CardTitle className="text-3xl text-slate-600">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Em Andamento</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{stats.inProgress}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Concluídos</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Serviços Cadastrados</CardTitle>
                <CardDescription>Lista de todos os serviços registrados no sistema</CardDescription>
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
                    <DialogDescription>Preencha os dados do cliente e do veículo</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateService} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientName">Nome do Cliente *</Label>
                        <Input
                          id="clientName"
                          placeholder="João Silva"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          required
                        />
                      </div>
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle">Veículo *</Label>
                        <Input
                          id="vehicle"
                          placeholder="Fiat Uno 2015"
                          value={vehicle}
                          onChange={(e) => setVehicle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plate">Placa *</Label>
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
                      <Select value={priority} onValueChange={(value) => setPriority(value as ServicePriority)}>
                        <SelectTrigger id="priority">
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

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
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
                  {searchTerm ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado ainda"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-slate-900">{service.clientName}</h3>
                              <p className="text-sm text-slate-600">{service.clientPhone}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {service.plate}
                            </Badge>
                            <span className="text-sm text-slate-600">{service.vehicle}</span>
                          </div>

                          <p className="text-sm text-slate-700 leading-relaxed">{service.description}</p>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Badge className={`${getPriorityColor(service.priority)} text-white`}>
                              {getPriorityLabel(service.priority)}
                            </Badge>
                            <Badge className={`${getStatusColor(service.status)} text-white gap-1`}>
                              {getStatusIcon(service.status)}
                              {getStatusLabel(service.status)}
                            </Badge>
                          </div>

                          <p className="text-xs text-slate-500">
                            Cadastrado por {service.createdBy} em {new Date(service.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
