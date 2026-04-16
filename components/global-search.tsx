"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { searchServiceByNumber, type Service } from "@/lib/api-services";
import { Input } from "@/components/ui/input";

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setError("");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError("");
      try {
        const result = await searchServiceByNumber(query);
        if (result) {
          setResults([result]);
        } else {
          setResults([]);
        }
      } catch (err) {
        setError("Erro ao buscar");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (service: Service) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    
    const currentPath = window.location.pathname;
    let targetPath = "/attendant";
    
    if (currentPath.includes("/admin")) {
      targetPath = "/attendant";
    } else if (currentPath.includes("/attendant")) {
      targetPath = currentPath;
    }
    
    const separator = targetPath.includes("?") ? "&" : "?";
    router.push(`${targetPath}${separator}serviceId=${service.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "in-progress":
        return "Em Andamento";
      case "completed":
        return "Concluído";
      default:
        return status;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar OS por número..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-64 pl-10 pr-10 h-9"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (query.trim() || isLoading || error) && (
        <div className="absolute top-full mt-1 w-80 bg-white border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando...
            </div>
          ) : error ? (
            <div className="p-4 text-red-500 text-sm">{error}</div>
          ) : results.length > 0 ? (
            results.map((service) => (
              <div
                key={service.id}
                onClick={() => handleSelect(service)}
                className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-900">
                    OS #{service.service_number}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(service.status)}`}>
                    {getStatusLabel(service.status)}
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  {service.customer_name}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {service.brand} {service.model} · {service.queue}
                </div>
              </div>
            ))
          ) : query.trim() ? (
            <div className="p-4 text-slate-500 text-sm">
              Nenhuma ordem de serviço encontrada
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}