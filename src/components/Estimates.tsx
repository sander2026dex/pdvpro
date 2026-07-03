/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  FileText, Plus, Search, Trash2, Printer, Share2, Clipboard, Download, 
  ArrowLeft, Save, PlusCircle, Check, X, FileImage, User, HelpCircle, Mail, Phone, Calendar
} from "lucide-react";
import { Estimate, EstimateItem, Client, Product } from "../types";

interface EstimatesProps {
  estimates: Estimate[];
  clients: Client[];
  products: Product[];
  onCreateEstimate: (data: Partial<Estimate>) => Promise<Estimate>;
  onDeleteEstimate: (id: string) => Promise<void>;
  permissions: any;
}

export default function Estimates({ estimates, clients, products, onCreateEstimate, onDeleteEstimate, permissions }: EstimatesProps) {
  // Navigation
  const [viewMode, setViewMode] = useState<"LIST" | "FORM" | "PRINT">("LIST");
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);

  // Search Filter
  const [search, setSearch] = useState<string>("");

  // Builder States
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [taxesCost, setTaxesCost] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState<string>("À vista com 5% de desconto ou faturado 30 dias no boleto");
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 10 * 24 * 3600000).toISOString().substring(0, 10) // 10 days default validity
  );
  const [observations, setObservations] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");

  // Temp addition state
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [addQty, setAddQty] = useState<number>(1);
  const [addDiscount, setAddDiscount] = useState<number>(0);

  // Calculations
  const builderSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  const builderTotal = useMemo(() => {
    return Math.max(0, Number((builderSubtotal - discount + shippingCost + taxesCost).toFixed(2)));
  }, [builderSubtotal, discount, shippingCost, taxesCost]);

  const handleOpenBuilder = () => {
    setSelectedClient(null);
    setItems([]);
    setDiscount(0);
    setShippingCost(0);
    setTaxesCost(0);
    setObservations("");
    setViewMode("FORM");
  };

  const handleAddItemToEstimate = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const unitPrice = prod.sellPrice;
    const totalItem = Number(((unitPrice - addDiscount) * addQty).toFixed(2));

    const newEstimateItem: EstimateItem = {
      productId: prod.id,
      productName: prod.name,
      quantity: addQty,
      unitPrice,
      discount: addDiscount,
      total: totalItem,
      imageUrl: ""
    };

    setItems([...items, newEstimateItem]);
    setSelectedProductId("");
    setAddQty(1);
    setAddDiscount(0);
  };

  const handleRemoveItemFromEstimate = (idx: number) => {
    const updated = [...items];
    updated.splice(idx, 1);
    setItems(updated);
  };

  const handleSaveEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Adicione pelo menos um item ao orçamento.");
      return;
    }

    const payload: Partial<Estimate> = {
      clientId: selectedClient?.id,
      clientName: selectedClient?.name || "Consumidor Final",
      clientPhone: selectedClient?.phone,
      items,
      subtotal: builderSubtotal,
      discount,
      shippingCost,
      taxesCost,
      total: builderTotal,
      paymentTerms,
      validUntil,
      observations
    };

    try {
      const result = await onCreateEstimate(payload);
      setSelectedEstimate(result);
      setViewMode("PRINT");
    } catch (err: any) {
      alert(err.message || "Erro ao registrar orçamento");
    }
  };

  const handlePrintView = (est: Estimate) => {
    setSelectedEstimate(est);
    setViewMode("PRINT");
  };

  // WhatsApp formatting logic
  const handleCopyToWhatsApp = (est: Estimate) => {
    const formattedDate = new Date(est.createdAt).toLocaleDateString();
    const formattedExpDate = new Date(est.validUntil).toLocaleDateString();
    
    let text = `*PROPOSTA COMERCIAL / ORÇAMENTO NO: ${est.id}*\n`;
    text += `*Data de Emissão:* ${formattedDate} | *Validade:* ${formattedExpDate}\n`;
    text += `-------------------------------------------\n`;
    text += `*CLIENTE:* ${est.clientName}\n`;
    if (est.clientPhone) text += `*CONTATO:* ${est.clientPhone}\n`;
    text += `-------------------------------------------\n`;
    text += `*PRODUTOS SOLICITADOS:*\n\n`;

    est.items.forEach((item, idx) => {
      text += `${idx + 1}. *${item.productName}*\n`;
      text += `   Qtd: ${item.quantity} | Valor un: R$ ${item.unitPrice.toFixed(2)}\n`;
      if (item.discount > 0) text += `   Desc item: R$ ${item.discount.toFixed(2)}\n`;
      text += `   Total item: R$ ${item.total.toFixed(2)}\n\n`;
    });

    text += `-------------------------------------------\n`;
    text += `*SUBTOTAL:* R$ ${est.subtotal.toFixed(2)}\n`;
    if (est.discount > 0) text += `*(-) DESCONTO TOTAL:* R$ ${est.discount.toFixed(2)}\n`;
    if (est.shippingCost > 0) text += `*(+) FRETE:* R$ ${est.shippingCost.toFixed(2)}\n`;
    if (est.taxesCost > 0) text += `*(+) TRIBUTOS:* R$ ${est.taxesCost.toFixed(2)}\n`;
    text += `*TOTAL FINAL:* R$ ${est.total.toFixed(2)}\n`;
    text += `-------------------------------------------\n`;
    text += `*CONDIÇÕES DE PAGAMENTO:*\n${est.paymentTerms}\n`;
    if (est.observations) text += `\n*OBSERVAÇÕES:*\n${est.observations}\n`;
    text += `\nAgradecemos a preferência! Caso queira aprovar a proposta, basta responder esta mensagem.`;

    navigator.clipboard.writeText(text);
    alert("Proposta formatada copiada para área de transferência! Pronta para colar no WhatsApp.");
  };

  const filteredEstimates = useMemo(() => {
    if (!search.trim()) return estimates;
    return estimates.filter(e => 
      e.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [estimates, search]);

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" /> Emissão de Orçamentos
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gere propostas comerciais altamente profissionais e copie relatórios formatados para WhatsApp.
          </p>
        </div>

        {viewMode === "LIST" && permissions.canEmitEstimate && (
          <button
            onClick={handleOpenBuilder}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase rounded-lg shadow cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Orçamento
          </button>
        )}

        {viewMode !== "LIST" && (
          <button
            onClick={() => setViewMode("LIST")}
            className="flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs rounded-lg text-slate-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar à Lista
          </button>
        )}
      </div>

      {/* --- LIST MODE --- */}
      {viewMode === "LIST" && (
        <>
          {/* Search bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar orçamento por cliente ou código da proposta..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Grid Estimates table */}
          <div className="border border-slate-800 bg-slate-900/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/10">
                  <th className="p-4">Cód Proposta</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Data Emissão</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4 text-right">Valor Total</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEstimates.map(e => {
                  const isExpired = new Date(e.validUntil) < new Date();
                  return (
                    <tr key={e.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-white">{e.id}</td>
                      <td className="p-4 font-bold text-slate-200">{e.clientName}</td>
                      <td className="p-4 text-slate-400">{new Date(e.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          isExpired ? "bg-red-950/40 text-red-400" : "bg-emerald-950/40 text-emerald-400"
                        }`}>
                          {new Date(e.validUntil).toLocaleDateString()} {isExpired && "(Vencido)"}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-emerald-400 font-mono">
                        R$ {e.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleCopyToWhatsApp(e)}
                          className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                          title="Copiar para WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrintView(e)}
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 hover:text-cyan-300"
                          title="Ver Layout Impressão"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm("Deseja realmente excluir este orçamento?")) {
                              await onDeleteEstimate(e.id);
                            }
                          }}
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-red-400 hover:text-red-300"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredEstimates.length === 0 && (
              <div className="py-20 text-center text-slate-500 italic">
                Nenhum orçamento cadastrado ou localizado.
              </div>
            )}
          </div>
        </>
      )}

      {/* --- FORM BUILDER MODE --- */}
      {viewMode === "FORM" && (
        <form onSubmit={handleSaveEstimate} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Company branding and items selection */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Branding Section */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
                  <FileImage className="w-4 h-4 text-cyan-400" /> Identidade Visual do Orçamento
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Endereço do Logotipo (URL ou Base64)</label>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Ex: https://minhaempresa.com/logo.png"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Identificar Cliente</label>
                    <select
                      required
                      value={selectedClient?.id || ""}
                      onChange={(e) => {
                        const cli = clients.find(c => c.id === e.target.value);
                        setSelectedClient(cli || null);
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      <option value="">Selecione um Cliente *</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.cpfCnpj || "CPF Nulo"})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Addition Block */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Seleção de Produtos da Proposta</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Escolher Produto</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs focus:outline-none"
                    >
                      <option value="">Selecione...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - R$ {p.sellPrice.toFixed(2)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      value={addQty}
                      onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-center text-white"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleAddItemToEstimate}
                      className="w-full py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase cursor-pointer"
                    >
                      Incluir Item
                    </button>
                  </div>
                </div>

                {/* Estimate items table list */}
                {items.length > 0 ? (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-950 border border-slate-800/60 text-xs">
                        <div>
                          <p className="font-bold text-white leading-tight">{item.productName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {item.quantity} Qtd x R$ {item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-emerald-400 font-mono">
                            R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromEstimate(idx)}
                            className="p-1 text-red-400 hover:text-red-300 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500 text-xs italic">
                    Nenhum produto incluído nesta proposta. Use o seletor acima.
                  </div>
                )}

              </div>
            </div>

            {/* Right Col: Taxes, shipping, totals and observations */}
            <div className="space-y-6">
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Valores, Frete & Tributos</h3>
                
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Desconto Geral da Proposta (R$)</label>
                  <input
                    type="number"
                    min="0"
                    value={discount || ""}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Valor Estimado de Frete (R$)</label>
                  <input
                    type="number"
                    min="0"
                    value={shippingCost || ""}
                    onChange={(e) => setShippingCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Estimativa de Tributação (IPI/ICMS/ST) (R$)</label>
                  <input
                    type="number"
                    min="0"
                    value={taxesCost || ""}
                    onChange={(e) => setTaxesCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Vencimento da Proposta (Validade)</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-xs text-slate-400 font-bold uppercase">Total Líquido Estimado</span>
                  <p className="text-3xl font-black text-emerald-400 mt-1 font-mono">
                    R$ {builderTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Conditions and notes */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Condições Comerciais</h3>
                
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Prazo e Meios de Pagamento</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                    placeholder="Ex: Faturado em boleto..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Observações Gerais</label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none min-h-16 resize-none"
                    placeholder="Garantia inclusa de 1 ano..."
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Footer actions */}
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
              <Save className="w-4 h-4" /> Salvar Orçamento
            </button>
          </div>
        </form>
      )}

      {/* --- PRINT / DETAIL MODE --- */}
      {viewMode === "PRINT" && selectedEstimate && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Quick printable action rail */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center gap-3">
            <span className="text-xs text-slate-400 font-bold">PROPOSTA COMERCIAL CARREGADA</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopyToWhatsApp(selectedEstimate)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded text-xs font-bold cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" /> Copiar para WhatsApp
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded text-xs font-bold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Proposta
              </button>
            </div>
          </div>

          {/* Real estimate document layout (formatted for print) */}
          <div className="p-8 bg-white text-slate-900 text-xs leading-relaxed" id="print-area">
            
            {/* Header branding and proposal title */}
            <div className="flex justify-between items-start border-b-2 border-slate-300 pb-4 mb-6">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-12 max-w-[120px] object-contain" />
                ) : (
                  <div className="p-2 border-2 border-slate-900 font-bold text-center text-sm uppercase">
                    [ LOGOTIPO ]
                  </div>
                )}
                <div className="leading-tight">
                  <p className="font-extrabold uppercase text-sm">Demo Comercial Ltda</p>
                  <p className="text-slate-500">CNPJ: 12.345.678/0001-90</p>
                  <p className="text-slate-500">Paulista, 1000 - SP | (11) 98765-4321</p>
                </div>
              </div>
              <div className="text-right leading-tight">
                <p className="font-extrabold text-base text-slate-800">ORÇAMENTO</p>
                <p className="font-mono font-bold text-slate-600 mt-1">CÓD: {selectedEstimate.id}</p>
                <p className="text-slate-400 mt-1">Emitido: {new Date(selectedEstimate.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Client address details */}
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 mb-6 grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-slate-700 uppercase text-[9px] tracking-wider mb-1">Destinatário / Cliente</p>
                <p className="font-bold text-slate-900 text-sm">{selectedEstimate.clientName}</p>
                {selectedEstimate.clientPhone && (
                  <p className="text-slate-500 mt-1">Contato: {selectedEstimate.clientPhone}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-700 uppercase text-[9px] tracking-wider mb-1">Validade da Proposta</p>
                <p className="font-bold text-red-600 text-sm">{new Date(selectedEstimate.validUntil).toLocaleDateString()}</p>
                <p className="text-slate-400 mt-1">Status: Proposta Comercial Ativa</p>
              </div>
            </div>

            {/* Main items ledger table */}
            <table className="w-full text-left text-xs border-collapse border border-slate-300 mb-6">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-300 text-slate-700 font-bold uppercase text-[9px] tracking-wider">
                  <th className="p-2.5">Código / Descrição do Produto</th>
                  <th className="p-2.5 text-center">Quantidade</th>
                  <th className="p-2.5 text-right">Preço Un.</th>
                  <th className="p-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedEstimate.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5">
                      <p className="font-bold text-slate-900 uppercase">{item.productName}</p>
                      <p className="text-[9px] text-slate-400">Garantia integral estendida do fabricante</p>
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-700">{item.quantity} UN</td>
                    <td className="p-2.5 text-right font-mono">R$ {item.unitPrice.toFixed(2)}</td>
                    <td className="p-2.5 text-right font-bold font-mono">R$ {item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations breakdown block */}
            <div className="flex justify-between items-start gap-12 mt-6">
              
              {/* QR Code and verification column */}
              <div className="max-w-[50%]">
                <p className="font-bold text-slate-700 uppercase text-[9px] tracking-wider mb-2">Validação Documental</p>
                <div className="flex gap-3 items-center">
                  {/* Custom CSS QR Code mock */}
                  <div className="p-2 bg-slate-900 rounded shrink-0">
                    <div className="grid grid-cols-3 gap-1 w-12 h-12">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <span key={i} className={`w-3.5 h-3.5 rounded ${Math.random() > 0.4 ? "bg-white" : "bg-black"}`}></span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-tight">
                    Documento comercial pré-aprovado digitalmente. A validade deste orçamento está condicionada à disponibilidade de estoque físico.
                  </p>
                </div>
              </div>

              {/* Totals values ledger column */}
              <div className="w-56 text-right space-y-1 font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal itens</span>
                  <span className="font-mono">R$ {selectedEstimate.subtotal.toFixed(2)}</span>
                </div>
                {selectedEstimate.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>(-) Descontos</span>
                    <span className="font-mono">R$ {selectedEstimate.discount.toFixed(2)}</span>
                  </div>
                )}
                {selectedEstimate.shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span>(+) Frete Estimado</span>
                    <span className="font-mono">R$ {selectedEstimate.shippingCost.toFixed(2)}</span>
                  </div>
                )}
                {selectedEstimate.taxesCost > 0 && (
                  <div className="flex justify-between">
                    <span>(+) Estimativa IPI/ST</span>
                    <span className="font-mono">R$ {selectedEstimate.taxesCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-black text-sm border-t border-slate-300 pt-2.5 mt-2">
                  <span>VALOR TOTAL</span>
                  <span className="font-mono">R$ {selectedEstimate.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment terms */}
            <div className="mt-8 border-t border-slate-200 pt-4">
              <p className="font-bold text-slate-700 uppercase text-[9px] tracking-wider mb-1">Termos Comerciais e Pagamento</p>
              <p className="text-slate-800">{selectedEstimate.paymentTerms}</p>
              {selectedEstimate.observations && (
                <>
                  <p className="font-bold text-slate-700 uppercase text-[9px] tracking-wider mt-3 mb-1">Observações Gerais</p>
                  <p className="text-slate-600 italic">{selectedEstimate.observations}</p>
                </>
              )}
            </div>

            {/* Signature section */}
            <div className="mt-14 grid grid-cols-2 gap-12 pt-8 border-t border-slate-150">
              <div className="text-center">
                <div className="border-b border-slate-400 h-10 w-48 mx-auto mb-1"></div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Assinatura do Emitente</p>
                <p className="text-[8px] text-slate-400 font-mono mt-0.5">Demo Comercial Ltda</p>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-400 h-10 w-48 mx-auto mb-1"></div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">De acordo do Cliente</p>
                <p className="text-[8px] text-slate-400 font-mono mt-0.5">{selectedEstimate.clientName.toUpperCase()}</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
