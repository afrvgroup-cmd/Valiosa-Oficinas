"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { isDemoMode } from "@/lib/auth"

interface LoginFormProps {
  onLogin: (email: string, password: string) => void
  error?: string
}

export function LoginForm({ onLogin, error }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const showDemoCredentials = isDemoMode()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(email, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          
          {/* LOGO SEM FUNDO E COM BORDER RADIUS */}
          <div className="mx-auto w-25 h-25 flex items-center justify-center">
            <img
              src="/Logo.png"
              alt="Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <CardTitle className="text-2xl font-bold">
            Gestão para ordens de serviços.
          </CardTitle>
          <CardDescription className="text-base">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-orange-500 hover:bg-orange-600"
            >
              Entrar
            </Button>

            {showDemoCredentials && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-medium text-blue-700">
                    Modo Demonstração
                  </p>
                </div>

                <div className="space-y-2 text-xs bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-semibold text-slate-700">Administrador:</p>
                    <p className="text-slate-600">
                      admin@oficina.com / 123456
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Mecânico:</p>
                    <p className="text-slate-600">
                      mecanico@oficina.com / 123456
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Atendente:</p>
                    <p className="text-slate-600">
                      atendente@oficina.com / 123456
                    </p>
                  </div>
                </div>
              </div>
            )}

          </form>
        </CardContent>
      </Card>
    </div>
  )
}