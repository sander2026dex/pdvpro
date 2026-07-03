/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Wrench, Plus, Search, Edit2, Printer, Save, ArrowLeft, 
  Trash2, DollarSign, Calendar, Clock, User
} from "lucide-react";
import { ServiceOrder, Client, Product } from "../types";

interface ServiceOrdersProps {
  orders: ServiceOrder[];
  clients: Client[];
  products: Product[];
  onCreateOrder: (data: Partial<ServiceOrder>) => Promise<ServiceOrder>;
  onUpdateOrder: (id: string, data: Partial<ServiceOrder>) => Promise<ServiceOrder>;
  permissions: any;
}

export default function ServiceOrders({ orders, clients, products, onCreateOrder, onUpdateOrder, permissions }: ServiceOrdersProps) {
  const [viewMode, setViewMode] = useState<"LIST" | "FORM" | "PRINT">("LIST");
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [search, setSearch] = useState<string>("");

  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [equipment, setEquipment] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [serialNumber, setSerialNumber] = useState<string>("");
  const [defectDescription, setDefectDescription] = useState<string>("");
  const [technicalObservations, setTechnicalObservations] = useState<string>("");
  
  // Simulated numerical prices for quick input form
  const [laborPrice, setLaborPrice] = useState<number>(0);
  const [partsPrice, setPartsPrice] = useState<number>(0);
  const [status, setStatus] = useState<"ABERTO" | "EM_ANALISE" | "APROVADO" | "REPROVADO" | "CONCLUIDO" | "ENTREGUE">("EM_ANALISE");

  const handleOpenCreateForm = () => {
    setEditId(null);
    setSelectedClient(null);
    setEquipment("");
    setBrand("");
    setModel("");
    setSerialNumber("");
    setDefectDescription("");
    setTechnicalObservations("");
    setLaborPrice(0);
    setPartsPrice(0);
    setStatus("EM_ANALISE");
    setViewMode("FORM");
  };

  const handleOpenEditForm = (os: ServiceOrder) => {
    setEditId(os.id);
    const cli = clients.find(c => c.id === os.clientId) || null;
    setSelectedClient(cli);
    setEquipment(os.equipment);
    setBrand(os.brand || "");
    setModel(os.model || "");
    setSerialNumber(os.serialNumber || "");
    setDefectDescription(os.defectDescription || "");
    setTechnicalObservations(os.technicalObservations || "");
    
    // Sum from arrays
    const servicesSum = os.services?.reduce((acc, curr) => acc + curr.price, 0) || 0;
    const partsSum = os.parts?.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) || 0;
    setLaborPrice(servicesSum);
    setPartsPrice(partsSum);
    
    setStatus(os.status);
    setViewMode("FORM");
  };

  const handleOpenPrintView = (os: ServiceOrder) => {
    setSelectedOrder(os);
    setViewMode("PRINT");
  };

  const handleSaveOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !equipment || !defectDescription) {
      alert("Por favor, selecione o cliente, descreva o equipamento e o defeito relatado.");
      return;
    }

    const payload: Partial<ServiceOrder> = {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      equipment,
      brand,
      model,
      serialNumber,
      defectDescription,
      technicalObservations,
      services: [{ name: "Serviço de Mão de Obra", price: laborPrice }],
      parts: [{ name: "Componentes Utilizados", quantity: 1, price: partsPrice }],
      discount: 0,
      total: Number((laborPrice + partsPrice).toFixed(2)),
      status
    };

    try {
      if (editId) {
        await onUpdateOrder(editId, payload);
      } else {
        await onCreateOrder(payload);
      }
      setViewMode("LIST");
    } catch (err: any) {
      alert(err.message || "Erro ao salvar Ordem de Serviço");
    }
  };

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    return orders.filter(os => 
      os.clientName.toLowerCase().includes(search.toLowerCase()) ||
      os.id.toLowerCase().includes(search.toLowerCase()) ||
      os.equipment.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "ABERTO": return "bg-slate-900 text-slate-400 border border-slate-800";
      case "EM_ANALISE": return "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20";
      case "APROVADO": return "bg-amber-950/40 text-amber-400 border border-amber-500/20";
      case "REPROVADO": return "bg-red-950/40 text-red-400 border border-red-500/20";
      case "CONCLUIDO": return "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20";
      case "ENTREGUE": return "bg-purple-950/40 text-purple-400 border border-purple-500/20";
      default: return "bg-slate-950 text-slate-500";
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-10">
      
      {/* HEADER ROW */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-emerald-400" /> Ordens de Serviço (O.S.)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão técnica de ordens de manutenção, consertos em laboratório e prestação de serviços.
          </p>
        </div>

        {viewMode === "LIST" && permissions.canManageCRM && (
          <button
            onClick={handleOpenCreateForm}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase rounded-lg shadow cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Ordem de Serviço
          </button>
        )}

        {viewMode !== "LIST" && (
          <button
            onClick={() => setViewMode("LIST")}
            className="flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs rounded-lg text-slate-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        )}
      </div>

      {/* --- LIST MODE --- */}
      {viewMode === "LIST" && (
        <>
          {/* Quick counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Aberto / Triagem</p>
              <p className="text-xl font-extrabold text-white mt-1">
                {orders.filter(o => o.status === "ABERTO" || o.status === "EM_ANALISE").length} ordens
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Aprovadas</p>
              <p className="text-xl font-extrabold text-amber-400 mt-1">
                {orders.filter(o => o.status === "APROVADO").length} ordens
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Concluídas</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">
                {orders.filter(o => o.status === "CONCLUIDO").length} ordens
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Entregues / Fechadas</p>
              <p className="text-xl font-extrabold text-purple-400 mt-1">
                {orders.filter(o => o.status === "ENTREGUE").length} ordens
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por código da O.S., nome do cliente ou equipamento..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-800 bg-slate-900/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/10">
                  <th className="p-4">Cód O.S</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Equipamento / Aparelho</th>
                  <th className="p-4 text-center">Status Operacional</th>
                  <th className="p-4 text-right">Mão Obra + Peças</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-900/20 transition-colors text-slate-300">
                    <td className="p-4 font-bold text-white">{o.id}</td>
                    <td className="p-4 font-sans font-bold text-slate-100">{o.clientName}</td>
                    <td className="p-4 font-sans">
                      <p className="text-slate-100 font-medium">{o.equipment}</p>
                      <p className="text-[10px] text-slate-500">Fabricante: {o.brand || "Geral"}</p>
                    </td>
                    <td className="p-4 text-center font-sans">
                      <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase ${getStatusBadge(o.status)}`}>
                        {o.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-white">
                      R$ {o.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-sans space-x-1.5">
                      <button
                        onClick={() => handleOpenPrintView(o)}
                        className="p-1.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 hover:text-cyan-300"
                        title="Ver Layout de Impressão"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {permissions.canManageCRM && (
                        <button
                          onClick={() => handleOpenEditForm(o)}
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 hover:text-emerald-300"
                          title="Atualizar O.S."
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="py-20 text-center text-slate-500 italic">
                Nenhuma ordem de serviço registrada ou correspondente.
              </div>
            )}
          </div>
        </>
      )}

      {/* --- CRUD FORM OS --- */}
      {viewMode === "FORM" && (
        <form onSubmit={handleSaveOS} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: client, equipment and defects */}
            <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                Especificação do Atendimento Técnico
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Cliente Atendido *</label>
                  <select
                    required
                    value={selectedClient?.id || ""}
                    onChange={(e) => {
                      const cli = clients.find(c => c.id === e.target.value);
                      setSelectedClient(cli || null);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="">Selecione o Cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone || "Sem Telefone"})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Equipamento / Aparelho / Item *</label>
                  <input
                    type="text"
                    required
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
                    placeholder="Ex: Notebook Dell Inspiron 15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Marca / Fabricante</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                    placeholder="Ex: Dell"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Modelo</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                    placeholder="Ex: Inspiron 3511"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Nº de Série / Placa / ID Único</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none"
                    placeholder="Ex: TAG-123456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Defeito Relatado pelo Cliente *</label>
                <textarea
                  required
                  value={defectDescription}
                  onChange={(e) => setDefectDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none min-h-16"
                  placeholder="Ex: Aparelho não liga, apresenta bipe constante após inicialização..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Laudo Técnico / Observações da Manutenção</label>
                <textarea
                  value={technicalObservations}
                  onChange={(e) => setTechnicalObservations(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none min-h-16"
                  placeholder="Laudo técnico detalhando defeitos constatados fisicamente e o conserto efetuado..."
                />
              </div>
            </div>

            {/* Right Col: Values, status and observatios */}
            <div className="space-y-6">
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Valores do Atendimento</h3>
                
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Status da O.S.</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold focus:outline-none"
                  >
                    <option value="ABERTO">Aberto</option>
                    <option value="EM_ANALISE">Em Análise / Triagem</option>
                    <option value="APROVADO">Aprovado pelo Cliente</option>
                    <option value="REPROVADO">Reprovado</option>
                    <option value="CONCLUIDO">Concluído (Pronto para entrega)</option>
                    <option value="ENTREGUE">Entregue (Equipamento retirado)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Valor da Mão de Obra (Serviço) (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={laborPrice || ""}
                    onChange={(e) => setLaborPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Valor de Peças Substituídas (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={partsPrice || ""}
                    onChange={(e) => setPartsPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-xs text-slate-400 font-bold uppercase">Total Geral da O.S.</span>
                  <p className="text-3xl font-black text-emerald-400 mt-1 font-mono">
                    R$ {(laborPrice + partsPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className="px-5 py-2.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-bold uppercase cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" /> Gravar Ficha O.S.
            </button>
          </div>
        </form>
      )}

      {/* --- PRINT OS DOCUMENT MODE --- */}
      {viewMode === "PRINT" && selectedOrder && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold">LAUDO TECNICO DE O.S. CARREGADO</span>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded text-xs font-bold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Documento de Entrega
            </button>
          </div>

          <div className="p-8 bg-white text-slate-900 text-xs leading-relaxed" id="print-area">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-300 pb-4 mb-6">
              <div className="leading-tight">
                <p className="font-extrabold text-sm uppercase">LexPro Assistência Especializada</p>
                <p className="text-slate-500">CNPJ: 12.345.678/0001-90 | (11) 98765-4321</p>
                <p className="text-slate-500">Av. Paulista, 1000 - SP</p>
              </div>
              <div className="text-right leading-tight">
                <p className="font-extrabold text-base text-slate-800">ORDEM DE SERVIÇO</p>
                <p className="font-mono font-bold text-slate-600 mt-1">Nº: {selectedOrder.id}</p>
                <p className="text-slate-400 mt-0.5">Emissão: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Client info */}
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 mb-6 grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-slate-700 uppercase text-[9px] mb-1">Cliente / Solicitante</p>
                <p className="font-bold text-slate-900 text-sm">{selectedOrder.clientName}</p>
                {selectedOrder.clientPhone && (
                  <p className="text-slate-500 mt-1">WhatsApp: {selectedOrder.clientPhone}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-700 uppercase text-[9px] mb-1">Status do Equipamento</p>
                <p className="font-black text-red-600 text-sm">{selectedOrder.status.replace("_", " ")}</p>
              </div>
            </div>

            {/* Equipment details */}
            <div className="border border-slate-300 rounded-lg p-3.5 mb-6 space-y-2">
              <p className="font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase text-[9px]">Especificações do Aparelho</p>
              <div className="grid grid-cols-4 gap-2 text-slate-700">
                <p><strong>Aparelho:</strong> {selectedOrder.equipment}</p>
                <p><strong>Fabricante:</strong> {selectedOrder.brand || "Geral"}</p>
                <p><strong>Modelo:</strong> {selectedOrder.model || "Geral"}</p>
                <p><strong>Nº Série:</strong> {selectedOrder.serialNumber || "Nulo"}</p>
              </div>
            </div>

            {/* Defect Diagnostics solutions */}
            <div className="space-y-4 mb-6">
              <div>
                <p className="font-bold text-slate-700 uppercase text-[9px] mb-1">Defeito Constatado / Relatado pelo Cliente</p>
                <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-800 italic">{selectedOrder.defectDescription}</p>
              </div>

              {selectedOrder.technicalObservations && (
                <div>
                  <p className="font-bold text-slate-700 uppercase text-[9px] mb-1">Laudo Técnico de Laboratório e Serviços</p>
                  <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-800">{selectedOrder.technicalObservations}</p>
                </div>
              )}
            </div>

            {/* Financial Ledger totals */}
            <div className="border border-slate-300 rounded-lg p-3.5 mb-6">
              <p className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 uppercase text-[9px] mb-2">Discriminação de Preços</p>
              <div className="space-y-1.5 font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Serviços de Manutenção e Consertos</span>
                  <span className="font-mono">R$ {(selectedOrder.services?.reduce((acc, curr) => acc + curr.price, 0) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peças e Componentes de Reposição</span>
                  <span className="font-mono">R$ {(selectedOrder.parts?.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-950 font-black text-sm border-t border-slate-200 pt-2 mt-1.5">
                  <span>VALOR LIQUIDO TOTAL DA O.S.</span>
                  <span className="font-mono">R$ {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Observations and warranty */}
            <div className="pt-2 border-t border-slate-200">
              <p className="font-bold text-slate-700 uppercase text-[9px] tracking-wider mb-1">Garantia e Termos de Retirada</p>
              <p className="text-slate-500 text-[9px] leading-tight">
                Garantia legal de 90 dias referente apenas aos componentes substituídos e labor técnica conforme disposto no CDC brasileiro. Aparelhos não retirados em até 90 dias estão sujeitos a leilão para pagamento de custos laboratoriais.
              </p>
            </div>

            {/* Signature section */}
            <div className="mt-14 grid grid-cols-2 gap-12 pt-8 border-t border-slate-150 text-center">
              <div>
                <div className="border-b border-slate-400 h-10 w-48 mx-auto mb-1"></div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Técnico Responsável</p>
              </div>
              <div>
                <div className="border-b border-slate-400 h-10 w-48 mx-auto mb-1"></div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Assinatura do Cliente</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
