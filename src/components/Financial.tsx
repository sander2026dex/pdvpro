/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  CircleDollarSign, Plus, Search, Trash2, ArrowUpRight, ArrowDownRight, Check, X, Save, 
  Filter, Calendar, DollarSign, Wallet, AlertCircle, Percent
} from "lucide-react";
import { FinancialTransaction } from "../types";

interface FinancialProps {
  financials: FinancialTransaction[];
  onCreateFinancial: (data: Partial<FinancialTransaction>) => Promise<FinancialTransaction>;
  onPayFinancial: (id: string) => Promise<FinancialTransaction>;
  onDeleteFinancial: (id: string) => Promise<void>;
  permissions: any;
}

export default function Financial({ financials, onCreateFinancial, onPayFinancial, onDeleteFinancial, permissions }: FinancialProps) {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  // Form states
  const [description, setDescription] = useState<string>("");
  const [type, setType] = useState<"RECEITA" | "DESPESA">("RECEITA");
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>("Venda Balcão");
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [status, setStatus] = useState<"PENDENTE" | "PAGO">("PENDENTE");

  // Statistics calculation
  const summary = useMemo(() => {
    let totalReceitas = 0;
    let totalDespesas = 0;
    let aPagarPendente = 0;
    let aReceberPendente = 0;

    financials.forEach(f => {
      if (f.type === "RECEITA") {
        if (f.status === "PAGO") totalReceitas += f.amount;
        else aReceberPendente += f.amount;
      } else {
        if (f.status === "PAGO") totalDespesas += f.amount;
        else aPagarPendente += f.amount;
      }
    });

    const netResult = totalReceitas - totalDespesas;

    return {
      totalReceitas,
      totalDespesas,
      netResult,
      aPagarPendente,
      aReceberPendente
    };
  }, [financials]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0 || !category) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const payload: Partial<FinancialTransaction> = {
      description,
      type,
      amount,
      category,
      dueDate,
      status,
      paymentDate: status === "PAGO" ? new Date().toISOString().substring(0, 10) : undefined
    };

    try {
      await onCreateFinancial(payload);
      setShowAddModal(false);
      setDescription("");
      setAmount(0);
      setCategory("Venda Balcão");
    } catch (err: any) {
      alert(err.message || "Erro ao lançar transação financeira");
    }
  };

  const filteredTransactions = useMemo(() => {
    return financials.filter(f => {
      const matchSearch = f.description.toLowerCase().includes(search.toLowerCase()) || 
                          f.category.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter ? f.type === typeFilter : true;
      return matchSearch && matchType;
    });
  }, [financials, search, typeFilter]);

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-10">
      
      {/* HEADER ROW */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CircleDollarSign className="w-6 h-6 text-emerald-400" /> Fluxo de Caixa Integrado
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão fiscal e controle de contas a pagar, contas a receber e conciliação bancária.
          </p>
        </div>

        {permissions.canManageFinance && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase rounded-lg shadow cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Lançamento Financeiro
          </button>
        )}
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recebido (Realizado) */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Receitas Realizadas</p>
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1.5 font-mono">
            R$ {summary.totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">Contas a receber pendentes: <strong className="text-cyan-400">R$ {summary.aReceberPendente}</strong></p>
        </div>

        {/* Pago (Despesas) */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Despesas Quitadas</p>
            <ArrowDownRight className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1.5 font-mono">
            R$ {summary.totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">Contas a pagar em aberto: <strong className="text-red-400">R$ {summary.aPagarPendente}</strong></p>
        </div>

        {/* Saldo Conciliado */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Saldo Líquido Real</p>
            <Wallet className="w-5 h-5 text-cyan-400" />
          </div>
          <p className={`text-2xl font-extrabold mt-1.5 font-mono ${summary.netResult >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            R$ {summary.netResult.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">Liquidez operacional imediata</p>
        </div>

        {/* DRE simplificado */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Meta e Rendimento</p>
            <Percent className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1.5 font-mono">
            {summary.totalReceitas > 0 ? `${Math.round((summary.netResult / summary.totalReceitas) * 100)}%` : "0%"}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">Margem operacional líquida</p>
        </div>
      </div>

      {/* FILTER SHELF */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/30 border border-slate-800 p-4 rounded-xl">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar lançamentos por categoria ou descrição..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="">Todas as Transações</option>
            <option value="RECEITA">Apenas Receitas (+)</option>
            <option value="DESPESA">Apenas Despesas (-)</option>
          </select>
        </div>
      </div>

      {/* LEDGER GRID */}
      <div className="border border-slate-800 bg-slate-900/10 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/10">
              <th className="p-4">Identificação</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Vencimento</th>
              <th className="p-4 text-right">Valor</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredTransactions.map(f => {
              const isRevenue = f.type === "RECEITA";
              const isPaid = f.status === "PAGO";
              return (
                <tr key={f.id} className="hover:bg-slate-900/20 transition-colors">
                  <td className="p-4 font-sans font-bold text-white">
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded-full ${isRevenue ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {isRevenue ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      </span>
                      {f.description}
                    </div>
                  </td>
                  <td className="p-4 font-sans text-slate-400">{f.category}</td>
                  <td className="p-4 text-slate-400 text-[11px]">{new Date(f.dueDate).toLocaleDateString()}</td>
                  <td className={`p-4 text-right font-bold ${isRevenue ? "text-emerald-400" : "text-red-400"}`}>
                    {isRevenue ? "+" : "-"} R$ {f.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      isPaid ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" : "bg-red-950/40 text-red-400 border border-red-500/20"
                    }`}>
                      {isPaid ? "Quitado" : "Pendente"}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1 font-sans">
                    {!isPaid && permissions.canManageFinance && (
                      <button
                        onClick={async () => {
                          if (confirm(`Quitar lançamento: ${f.description}?`)) {
                            await onPayFinancial(f.id);
                          }
                        }}
                        className="p-1.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 hover:text-emerald-350"
                        title="Marcar como Pago / Recebido"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {permissions.canManageFinance && (
                      <button
                        onClick={async () => {
                          if (confirm(`Deseja realmente remover esta transação?`)) {
                            await onDeleteFinancial(f.id);
                          }
                        }}
                        className="p-1.5 rounded bg-slate-950 border border-slate-800 text-red-400 hover:text-red-300"
                        title="Excluir Lançamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTransactions.length === 0 && (
          <div className="py-20 text-center text-slate-500 italic">
            Nenhuma transação financeira localizada.
          </div>
        )}
      </div>

      {/* ADD TRANSACTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <form onSubmit={handleCreateSubmit} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              Lançar Movimentação de Fluxo de Caixa
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Natureza do Fluxo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="RECEITA">RECEITA (+)</option>
                  <option value="DESPESA">DESPESA (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={amount || ""}
                  onChange={(e) => setAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold focus:outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Descrição do Lançamento *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                placeholder="Ex: Aluguel do imóvel, Compra de mercadorias..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Categoria / Centro Custo *</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                  placeholder="Ex: Infraestrutura, Mercadoria..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Vencimento da Conta</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Status Inicial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
              >
                <option value="PENDENTE">Em aberto (Pendente)</option>
                <option value="PAGO">Pago / Liquidado</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-bold rounded uppercase cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded uppercase cursor-pointer flex items-center justify-center gap-1 shadow"
              >
                <Save className="w-4 h-4" /> Registrar Lançamento
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
