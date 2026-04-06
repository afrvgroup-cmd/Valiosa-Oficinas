"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthState, logout } from "@/lib/auth"
import { getAllServices, updateServiceStatus, type Service } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, Wrench, Clock, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export default function MechanicPage() {
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [observations, setObservations] = useState("")
  const [userName, setUserName] = useState("")
  const router = useRouter()

  useEffect(() => {
    const { isAuthenticated, user } = getAuthState()

    if (!isAuthenticated || user?.role !== "mechanic") {
      router.push("/")
      return
    }

    setUserName(user.name)
    loadServices()
  }, [router])

  const loadServices = () => {
    const allServices = getAllServices()
    setServices(allServices)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleStatusChange = (id: string, newStatus: Service["status"]) => {
    if (newStatus === "completed") {
      updateServiceStatus(id, newStatus, observations, userName)
      setObservations("")
    } else {
      updateServiceStatus(id, newStatus)
    }
    loadServices()
    setIsSheetOpen(false)
    setSelectedService(null)
  }

  const getPriorityColor = (priority: Service["priority"]) => {
    const colors = {
      low: "bg-blue-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    }
    return colors[priority]
  }

  const getPriorityLabel = (priority: Service["priority"]) => {
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
      pending: <Clock className="w-5 h-5" />,
      "in-progress": <AlertCircle className="w-5 h-5" />,
      completed: <CheckCircle2 className="w-5 h-5" />,
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

  const pendingServices = services.filter((s) => s.status === "pending")
  const inProgressServices = services.filter((s) => s.status === "in-progress")
  const completedServices = services.filter((s) => s.status === "completed")

  const ServiceCard = ({ service }: { service: Service }) => (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => {
        setSelectedService(service)
        setIsSheetOpen(true)
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={`${getPriorityColor(service.priority)} text-white text-xs`}>
                {getPriorityLabel(service.priority)}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {service.plate}
              </Badge>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-slate-900">{service.clientName}</h3>
              <p className="text-sm text-slate-600">{service.vehicle}</p>
            </div>

            <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{service.description}</p>

            <Badge className={`${getStatusColor(service.status)} text-white gap-1 w-fit`}>
              {getStatusIcon(service.status)}
              {getStatusLabel(service.status)}
            </Badge>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Meus Serviços</h1>
              <p className="text-xs text-slate-600">Área do profissional</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="pb-6">
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-600">{pendingServices.length}</p>
              <p className="text-xs text-slate-500">Pendentes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{inProgressServices.length}</p>
              <p className="text-xs text-slate-500">Em Andamento</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{completedServices.length}</p>
              <p className="text-xs text-slate-500">Concluídos</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="pending" className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="text-xs">
              Pendentes ({pendingServices.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="text-xs">
              Em Andamento ({inProgressServices.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Concluídos ({completedServices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-0">
            {pendingServices.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum serviço pendente</p>
              </div>
            ) : (
              pendingServices.map((service) => <ServiceCard key={service.id} service={service} />)
            )}
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-3 mt-0">
            {inProgressServices.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum serviço em andamento</p>
              </div>
            ) : (
              inProgressServices.map((service) => <ServiceCard key={service.id} service={service} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-0">
            {completedServices.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum serviço concluído</p>
              </div>
            ) : (
              completedServices.map((service) => <ServiceCard key={service.id} service={service} />)
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open)
          if (!open) {
            setSelectedService(null)
            setObservations("")
          }
        }}
      >
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="text-2xl">Detalhes do Serviço</SheetTitle>
            <SheetDescription>Visualize as informações e atualize o status</SheetDescription>
          </SheetHeader>

          {selectedService && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Cliente</label>
                  <p className="text-lg font-semibold text-slate-900 mt-1">{selectedService.clientName}</p>
                  <p className="text-sm text-slate-600">{selectedService.clientPhone}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-500">Veículo</label>
                  <p className="text-base font-medium text-slate-900 mt-1">{selectedService.vehicle}</p>
                  <Badge variant="outline" className="font-mono mt-2">
                    {selectedService.plate}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-500">Problema Relatado</label>
                  <p className="text-base text-slate-900 mt-2 leading-relaxed bg-slate-50 p-4 rounded-lg">
                    {selectedService.description}
                  </p>
                </div>

                <div className="flex gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Prioridade</label>
                    <Badge className={`${getPriorityColor(selectedService.priority)} text-white mt-2 block w-fit`}>
                      {getPriorityLabel(selectedService.priority)}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Status Atual</label>
                    <Badge className={`${getStatusColor(selectedService.status)} text-white gap-1 mt-2 block w-fit`}>
                      {getStatusIcon(selectedService.status)}
                      {getStatusLabel(selectedService.status)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-500">Informações</label>
                  <div className="text-xs text-slate-500 mt-2 space-y-1 bg-slate-50 p-3 rounded-lg">
                    <p>Cadastrado por: {selectedService.createdBy}</p>
                    <p>Data: {new Date(selectedService.createdAt).toLocaleString("pt-BR")}</p>
                    {selectedService.updatedAt && (
                      <p>Última atualização: {new Date(selectedService.updatedAt).toLocaleString("pt-BR")}</p>
                    )}
                    {selectedService.completedBy && <p>Concluído por: {selectedService.completedBy}</p>}
                  </div>
                </div>

                {selectedService.observations && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Observações do Mecânico</label>
                    <p className="text-base text-slate-900 mt-2 leading-relaxed bg-green-50 p-4 rounded-lg border border-green-200">
                      {selectedService.observations}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <label className="text-sm font-medium text-slate-700 block">Atualizar Status</label>

                {selectedService.status === "pending" && (
                  <Button
                    onClick={() => handleStatusChange(selectedService.id, "in-progress")}
                    className="w-full h-12 bg-blue-500 hover:bg-blue-600 gap-2 text-base"
                  >
                    <AlertCircle className="w-5 h-5" />
                    Iniciar Serviço
                  </Button>
                )}

                {selectedService.status === "in-progress" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">Observações (opcional)</label>
                      <Textarea
                        placeholder="Adicione observações sobre o serviço realizado..."
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                    <Button
                      onClick={() => handleStatusChange(selectedService.id, "completed")}
                      className="w-full h-12 bg-green-500 hover:bg-green-600 gap-2 text-base"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Marcar como Concluído
                    </Button>
                  </div>
                )}

                {selectedService.status === "completed" && (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-slate-600">Serviço já concluído</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
