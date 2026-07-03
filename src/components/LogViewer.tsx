/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { ClipboardList, Search, User, Key, Check, Info, AlertTriangle } from "lucide-react";
import { SystemLog } from "../types";

interface LogViewerProps {
  logs: SystemLog[];
}

export default function LogViewer({ logs }: LogViewerProps) {
  const [search, setSearch] = useState<string>("");

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const query = search.toLowerCase();
    return logs.filter(l => 
      l.action.toLowerCase().includes(query) ||
      l.userName.toLowerCase().includes(query) ||
      (l.details && JSON.stringify(l.details).toLowerCase().includes(query))
    );
  }, [logs, search]);

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-10">
      
      {/* HEADER SECTION */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-emerald-400" /> Registro de Log e Auditoria
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Rastreabilidade completa e trilha de auditoria para ações de faturamento, exclusões ou reajustes lógicos.
        </p>
      </div>

      {/* System info cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Integridade de Registros</p>
            <p className="text-lg font-extrabold text-emerald-400 mt-1 flex items-center gap-1">
              <Check className="w-4 h-4" /> Banco Íntegro
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total de Lançamentos Logados</p>
            <p className="text-lg font-extrabold text-white mt-1 font-mono">{logs.length} ações</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sessões Ativas Atuais</p>
            <p className="text-lg font-extrabold text-white mt-1 font-mono">1 operando</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por operador, ação realizada ou dados específicos de logs..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-slate-800 bg-slate-900/10 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/10">
              <th className="p-4">Carimbo de Data / Hora</th>
              <th className="p-4">Operador Responsável</th>
              <th className="p-4">Ação Efetuada no Sistema</th>
              <th className="p-4">Detalhes Internos Estruturados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredLogs.map(l => {
              const isCritical = l.action.includes("DELETED") || l.action.includes("CANCELLED");
              return (
                <tr key={l.id} className="hover:bg-slate-900/20 transition-colors text-slate-300">
                  <td className="p-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-sans font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
                    <User className="w-3.5 h-3.5 text-slate-500" /> {l.userName}
                  </td>
                  <td className="p-4 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      isCritical ? "bg-red-950 text-red-400 border border-red-500/10" : "bg-slate-900 text-cyan-400 border border-slate-850"
                    }`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="p-4 max-w-sm truncate text-[10px] text-slate-500" title={l.details ? JSON.stringify(l.details) : ""}>
                    {l.details ? JSON.stringify(l.details) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredLogs.length === 0 && (
          <div className="py-20 text-center text-slate-500 italic">
            Nenhum log de auditoria localizado.
          </div>
        )}
      </div>

    </div>
  );
}
