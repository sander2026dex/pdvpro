/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Layers, PlusCircle, MinusCircle, AlertTriangle, Search, Save, Calendar, ArrowRightLeft, User } from "lucide-react";
import { Product, InventoryLog } from "../types";

interface InventoryProps {
  products: Product[];
  logs: InventoryLog[];
  onAdjustStock: (productId: string, type: "ENTRADA" | "SAIDA" | "AJUSTE", quantity: number, reason: string) => Promise<InventoryLog>;
  permissions: any;
}

export default function Inventory({ products, logs, onAdjustStock, permissions }: InventoryProps) {
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  // Adjustment form states
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [adjustType, setAdjustType] = useState<"ENTRADA" | "SAIDA" | "AJUSTE">("ENTRADA");
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>("");

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0 || !reason.trim()) {
      alert("Por favor, preencha todos os campos do ajuste.");
      return;
    }

    try {
      await onAdjustStock(selectedProductId, adjustType, quantity, reason);
      setShowAdjustModal(false);
      setSelectedProductId("");
      setQuantity(0);
      setReason("");
    } catch (err: any) {
      alert(err.message || "Erro ao salvar movimentação de estoque");
    }
  };

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    return logs.filter(l => 
      l.productName.toLowerCase().includes(search.toLowerCase()) ||
      l.reason.toLowerCase().includes(search.toLowerCase()) ||
      l.type.toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-emerald-400" /> Registro de Movimentações
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Histórico completo de auditoria física de estoque e conciliação de saldos.
          </p>
        </div>

        {permissions.canAccessStock && (
          <button
            onClick={() => setShowAdjustModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase rounded-lg shadow cursor-pointer transition-colors"
          >
            Ajustar Estoque Manualmente
          </button>
        )}
      </div>

      {/* Audit Search bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar lançamentos por produto, motivo ou tipo (ENTRADA / SAIDA)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
          />
        </div>
      </div>

      {/* Movement Ledger table */}
      <div className="border border-slate-800 bg-slate-900/10 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/10">
              <th className="p-4">Data / Hora</th>
              <th className="p-4">Descrição do Produto</th>
              <th className="p-4 text-center">Tipo</th>
              <th className="p-4 text-center">Qtde Lançada</th>
              <th className="p-4">Motivo / Finalidade do ajuste</th>
              <th className="p-4">Operador</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredLogs.map(l => {
              const isEntry = l.type === "ENTRADA";
              return (
                <tr key={l.id} className="hover:bg-slate-900/20 transition-colors text-slate-300">
                  <td className="p-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-sans font-bold text-white">{l.productName}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase ${
                      isEntry 
                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" 
                        : "bg-red-950/40 text-red-400 border border-red-500/20"
                    }`}>
                      {l.type}
                    </span>
                  </td>
                  <td className={`p-4 text-center font-black ${isEntry ? "text-emerald-400" : "text-red-400"}`}>
                    {isEntry ? "+" : "-"}{l.quantity}
                  </td>
                  <td className="p-4 font-sans text-slate-400 text-xs">{l.reason}</td>
                  <td className="p-4 font-sans text-slate-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" /> {l.userName}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredLogs.length === 0 && (
          <div className="py-20 text-center text-slate-500 italic">
            Nenhuma movimentação física registrada no banco.
          </div>
        )}
      </div>

      {/* ADJUSTMENT MODAL DRAWER */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <form onSubmit={handleAdjustSubmit} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              Lançar Movimentação Manual de Estoque
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Escolher Item *</label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="">Selecione o produto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Saldo: {p.quantity} {p.unit})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Tipo de Movimento</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                >
                  <option value="ENTRADA">ENTRADA (+) </option>
                  <option value="SAIDA">SAÍDA (-)</option>
                  <option value="AJUSTE">AJUSTE / ACERTO (=)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Quantidade</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity || ""}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Motivação para Auditoria *</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                placeholder="Ex: Reabastecimento por compra, Furto, Quebra..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-bold rounded uppercase cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded uppercase cursor-pointer flex items-center justify-center gap-1 shadow"
              >
                <Save className="w-4 h-4" /> Gravar Movimento
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
