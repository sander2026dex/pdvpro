/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Search, Keyboard, Trash2, Plus, Minus, CreditCard, DollarSign, QrCode, ClipboardList, 
  X, Printer, CheckCircle2, Ticket, Percent, PlusCircle, AlertCircle, ShoppingCart, UserCheck
} from "lucide-react";
import { Product, Client, Sale, SaleItem, PaymentDetails, Voucher } from "../types";

interface PDVProps {
  products: Product[];
  clients: Client[];
  vouchers: Voucher[];
  onRegisterSale: (saleData: Partial<Sale>) => Promise<Sale>;
  permissions: any;
}

export default function PDV({ products, clients, vouchers, onRegisterSale, permissions }: PDVProps) {
  // POS States
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [additionalCharge, setAdditionalCharge] = useState<number>(0);
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [observations, setObservations] = useState<string>("");

  // Payment Drawer States
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [payments, setPayments] = useState<PaymentDetails[]>([
    { method: "DINHEIRO", amount: 0 }
  ]);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Success Receipt states
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Focus reference
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return products.filter(p => 
      p.active && (
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.barcode.includes(query) ||
        p.category.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, products]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  // Calculated Voucher discount
  const voucherDiscount = useMemo(() => {
    if (!voucherCode) return 0;
    const vch = vouchers.find(v => v.code.toUpperCase() === voucherCode.toUpperCase().trim() && v.active);
    if (!vch) return 0;
    if (vch.minPurchase && cartSubtotal < vch.minPurchase) return 0;
    
    if (vch.discountType === "PERCENT") {
      return Number((cartSubtotal * (vch.value / 100)).toFixed(2));
    } else {
      return Math.min(vch.value, cartSubtotal);
    }
  }, [voucherCode, vouchers, cartSubtotal]);

  // General discount calculation
  const totalDiscount = useMemo(() => {
    const pctDiscount = Number((cartSubtotal * (discountPercent / 100)).toFixed(2));
    return Number((pctDiscount + voucherDiscount).toFixed(2));
  }, [cartSubtotal, discountPercent, voucherDiscount]);

  const cartTotal = useMemo(() => {
    return Math.max(0, Number((cartSubtotal - totalDiscount + additionalCharge).toFixed(2)));
  }, [cartSubtotal, totalDiscount, additionalCharge]);

  // Change troco calculator
  const changeDue = useMemo(() => {
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, Number((totalPayments - cartTotal).toFixed(2)));
  }, [payments, cartTotal]);

  // Keyboard Shortcuts hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        const disc = prompt("Insira a porcentagem de desconto (0-100):");
        if (disc !== null) {
          const val = parseFloat(disc);
          if (!isNaN(val) && val >= 0 && val <= 100) setDiscountPercent(val);
        }
      } else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) openCheckoutDrawer();
      } else if (e.key === "Escape") {
        if (showCheckout) setShowCheckout(false);
        else if (cart.length > 0) {
          if (confirm("Deseja realmente limpar o carrinho atual?")) {
            clearCart();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, showCheckout, cartTotal]);

  const clearCart = () => {
    setCart([]);
    setSelectedClient(null);
    setDiscountPercent(0);
    setAdditionalCharge(0);
    setVoucherCode("");
    setObservations("");
  };

  const handleAddToCart = (product: Product) => {
    if (product.quantity <= 0) {
      alert("Alerta: Este produto está esgotado em estoque, mas pode ser adicionado.");
    }

    const existIdx = cart.findIndex(item => item.productId === product.id);
    if (existIdx !== -1) {
      const updated = [...cart];
      updated[existIdx].quantity += 1;
      updated[existIdx].total = Number((updated[existIdx].quantity * updated[existIdx].unitPrice).toFixed(2));
      setCart(updated);
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellPrice,
        discount: 0,
        total: product.sellPrice
      }]);
    }
    setSearchQuery("");
  };

  const handleUpdateQty = (productId: string, val: number) => {
    const idx = cart.findIndex(item => item.productId === productId);
    if (idx === -1) return;
    const updated = [...cart];
    const newQty = updated[idx].quantity + val;
    if (newQty <= 0) {
      updated.splice(idx, 1);
    } else {
      updated[idx].quantity = newQty;
      updated[idx].total = Number((newQty * updated[idx].unitPrice).toFixed(2));
    }
    setCart(updated);
  };

  const openCheckoutDrawer = () => {
    setPayments([{ method: "DINHEIRO", amount: cartTotal }]);
    setShowCheckout(true);
  };

  const handlePaymentMethodChange = (idx: number, method: "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO" | "CHEQUE" | "VALE") => {
    const p = [...payments];
    p[idx].method = method;
    setPayments(p);
  };

  const handlePaymentAmountChange = (idx: number, val: number) => {
    const p = [...payments];
    p[idx].amount = val;
    setPayments(p);
  };

  const handleAddPaymentSplit = () => {
    const totalAssigned = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainder = Math.max(0, cartTotal - totalAssigned);
    setPayments([...payments, { method: "PIX", amount: remainder }]);
  };

  const handleRemovePaymentSplit = (idx: number) => {
    const p = [...payments];
    p.splice(idx, 1);
    setPayments(p);
  };

  const handleFinalizeSale = async () => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid < cartTotal) {
      alert(`Valor pago (R$ ${totalPaid}) é inferior ao total da venda (R$ ${cartTotal})`);
      return;
    }

    try {
      const salePayload: Partial<Sale> = {
        clientId: selectedClient?.id,
        clientName: selectedClient?.name,
        items: cart,
        subtotal: cartSubtotal,
        discount: totalDiscount,
        additionalCharge: additionalCharge,
        total: cartTotal,
        payments: payments,
        change: changeDue,
        observations: observations
      };

      const result = await onRegisterSale(salePayload);
      setCompletedSale(result);
      setShowCheckout(false);
      clearCart();
    } catch (err: any) {
      alert(err.message || "Erro ao faturar venda no PDV");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans text-slate-100 min-h-[calc(100vh-10rem)]">
      
      {/* LEFT: Product catalog search and cart ledger */}
      <div className="xl:col-span-2 flex flex-col gap-4">
        
        {/* Top Search inputs */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col gap-3 relative">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="F2: Buscar produto por nome, código, SKU ou bipe com leitor..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-medium"
            />
          </div>

          {/* Expanded results popup */}
          {searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-16 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-40 p-1 divide-y divide-slate-800/60">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleAddToCart(p)}
                  className="w-full p-2.5 flex justify-between items-center text-left hover:bg-slate-900 rounded transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{p.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Cod: {p.code} | SKU: {p.sku} | Unit: {p.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-400">R$ {p.sellPrice.toFixed(2)}</p>
                    <p className="text-[9px] text-slate-500 font-mono">Qtd em estoque: {p.quantity}</p>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <p className="p-4 text-xs text-slate-500 text-center italic">Nenhum produto ativo localizado.</p>
              )}
            </div>
          )}

          {/* Quick Shortcuts status rail */}
          <div className="flex flex-wrap gap-4 text-[10px] font-mono text-slate-500 uppercase">
            <span className="flex items-center gap-1"><Keyboard className="w-3.5 h-3.5" /> [F2] Buscar</span>
            <span>[F4] Aplicar Desconto</span>
            <span>[F8] Faturar</span>
            <span>[Esc] Limpar / Cancelar</span>
          </div>
        </div>

        {/* Cart Item Grid */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/10 flex-1 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" /> Carrinho do Caixa
              </h2>
              <span className="text-xs text-slate-500 font-mono">({cart.length} itens inclusos)</span>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={item.productId} className="flex justify-between items-center p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                    <div className="max-w-[45%]">
                      <p className="text-xs font-bold text-white truncate leading-tight">{item.productName}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        R$ {item.unitPrice.toFixed(2)} / un
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleUpdateQty(item.productId, -1)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-white font-mono">{item.quantity}</span>
                      <button 
                        onClick={() => handleAddToCart(products.find(p => p.id === item.productId)!)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right flex items-center gap-4">
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <button 
                        onClick={() => handleUpdateQty(item.productId, -item.quantity)}
                        className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                <ShoppingCart className="w-12 h-12 text-slate-700" />
                <p className="text-xs italic">Caixa livre. Insira ou bipe produtos para faturar.</p>
              </div>
            )}
          </div>

          {/* Quick empty cart button */}
          {cart.length > 0 && (
            <button
              onClick={() => { if (confirm("Esvaziar caixa?")) clearCart(); }}
              className="mt-4 px-3 py-1.5 rounded border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-500/10 w-fit cursor-pointer"
            >
              Excluir todos os itens
            </button>
          )}
        </div>
      </div>

      {/* RIGHT: Financial summary checkout card */}
      <div className="flex flex-col gap-4">
        
        {/* Client association panel */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-cyan-400" /> Identificar Cliente no Caixa
          </label>
          <select
            value={selectedClient?.id || ""}
            onChange={(e) => {
              const cli = clients.find(c => c.id === e.target.value);
              setSelectedClient(cli || null);
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="">Consumidor Final (Não identificado)</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.cpfCnpj || "Sem CPF"})</option>
            ))}
          </select>
          {selectedClient && (
            <p className="text-[10px] text-emerald-400 mt-1.5 font-medium">
              ✓ Cliente acumulando pontos do programa fidelidade ({selectedClient.loyaltyPoints} pts atuais)
            </p>
          )}
        </div>

        {/* Finance, discount and totals breakdown panel */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Valores Finais</h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal dos itens</span>
              <span className="font-mono">R$ {cartSubtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Discount Percentage Field */}
            <div className="flex justify-between items-center gap-4 text-slate-400 py-1 border-t border-slate-800/40">
              <span>Desconto Geral (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent || ""}
                onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-center text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                placeholder="0"
              />
            </div>

            {/* Voucher apply input */}
            <div className="flex justify-between items-center gap-4 text-slate-400 py-1 border-t border-slate-800/40">
              <span className="flex items-center gap-1"><Ticket className="w-3.5 h-3.5 text-amber-500" /> Cupom de Desconto</span>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="w-28 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-center text-[10px] font-bold text-white uppercase tracking-wider focus:outline-none focus:border-emerald-500"
                placeholder="Ex: CUPOM10"
              />
            </div>

            {/* Additional Charge (Frete, Seguro, etc) */}
            <div className="flex justify-between items-center gap-4 text-slate-400 py-1 border-t border-slate-800/40">
              <span>Acréscimo / Frete (R$)</span>
              <input
                type="number"
                min="0"
                value={additionalCharge || ""}
                onChange={(e) => setAdditionalCharge(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-center text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                placeholder="0.00"
              />
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between text-amber-400 font-bold border-t border-slate-800/40 pt-1">
                <span>Desconto Total Aplicado</span>
                <span className="font-mono">- R$ {totalDiscount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-3">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total a Pagar</p>
            <p className="text-4xl font-black text-emerald-400 mt-1.5 font-mono">
              R$ {cartTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Observations box */}
          <div className="mt-2">
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Notas / Observações do Cupom</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500 min-h-12 max-h-16 resize-none"
              placeholder="Anotações internas..."
            />
          </div>

          <button
            disabled={cart.length === 0}
            onClick={openCheckoutDrawer}
            className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/10 disabled:opacity-40 cursor-pointer mt-4"
          >
            <CreditCard className="w-5 h-5" /> Faturar Venda [F8]
          </button>
        </div>
      </div>

      {/* MODAL 1: CHECKOUT PROCESS DRAWER */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Detalhar Meios de Pagamento
              </h3>
              <button 
                onClick={() => setShowCheckout(false)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-bold uppercase">Total da Compra</span>
              <span className="text-xl font-mono font-black text-emerald-400">R$ {cartTotal.toFixed(2)}</span>
            </div>

            {/* Payments split grid list */}
            <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
              {payments.map((p, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                  {/* Select Payment Method */}
                  <div className="col-span-5">
                    <select
                      value={p.method}
                      onChange={(e) => handlePaymentMethodChange(idx, e.target.value as any)}
                      className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded font-bold text-xs"
                    >
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="PIX">PIX</option>
                      <option value="DEBITO">Cartão Débito</option>
                      <option value="CREDITO">Cartão Crédito</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="VALE">Vale Alimento</option>
                    </select>
                  </div>

                  {/* Input amount */}
                  <div className="col-span-5 relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-500 font-mono">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={p.amount}
                      onChange={(e) => handlePaymentAmountChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded font-mono text-xs font-bold text-white text-right focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Remove payment split line */}
                  <div className="col-span-2 text-center">
                    {payments.length > 1 && (
                      <button 
                        onClick={() => handleRemovePaymentSplit(idx)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                      >
                        <X className="w-4 h-4 mx-auto" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddPaymentSplit}
              className="mt-3.5 flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Adicionar Outra Forma de Pagamento (Múltiplas formas)
            </button>

            {/* Calculations breakdown */}
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Pago Recebido</span>
                <span className="font-mono font-bold text-white">
                  R$ {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold text-sm">
                <span>Troco de Caixa</span>
                <span className="font-mono font-black">
                  R$ {changeDue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => setShowCheckout(false)}
                className="py-2.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalizeSale}
                className="py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow"
              >
                Confirmar e Faturar [F8]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SUCCESS COMPLETED SALE AND THERMAL RECEIPT PREVIEW */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between max-h-[90vh]">
            
            <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 text-center flex flex-col items-center gap-1 shrink-0">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Venda Faturada com Sucesso</h3>
              <p className="text-[10px] text-emerald-400 font-mono">ID: {completedSale.id}</p>
            </div>

            {/* Thermal receipt scroll container */}
            <div className="p-5 overflow-y-auto bg-white text-slate-900 font-mono text-[10px] leading-relaxed flex-1" id="print-area">
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  #print-area, #print-area * { visibility: visible; }
                  #print-area { position: absolute; left: 0; top: 0; width: 80mm; }
                }
              `}</style>
              <div className="text-center space-y-1 mb-4 border-b border-dashed border-slate-400 pb-3">
                <p className="font-bold text-xs uppercase">LexPro Comercial</p>
                <p>CNPJ: 12.345.678/0001-90</p>
                <p>Av. Paulista, 1000 - SP</p>
                <p>Telefone: (11) 98765-4321</p>
                <p className="text-[9px] text-slate-500">${new Date(completedSale.createdAt).toLocaleString()}</p>
              </div>

              <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
                <p className="font-bold text-center text-[11px] uppercase tracking-wide">CUPOM NÃO FISCAL</p>
                {completedSale.clientName && (
                  <p className="mt-1">CLIENTE: {completedSale.clientName.toUpperCase()}</p>
                )}
                <p>OPERADOR: {completedSale.userName.toUpperCase()}</p>
              </div>

              {/* Items ledger list */}
              <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
                <div className="flex justify-between font-bold border-b border-slate-300 pb-1 mb-1">
                  <span>ITEM / DESCRIÇÃO</span>
                  <span>TOTAL</span>
                </div>
                <div className="space-y-1.5">
                  {completedSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div className="max-w-[70%]">
                        <p className="font-bold uppercase leading-tight">{item.productName}</p>
                        <p className="text-[9px] text-slate-500">
                          {item.quantity} Qtd x R$ {item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-bold">R$ {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial calculations */}
              <div className="border-b border-dashed border-slate-400 pb-2 mb-2 space-y-0.5 text-right font-bold">
                <div className="flex justify-between">
                  <span>SUBTOTAL</span>
                  <span>R$ {completedSale.subtotal.toFixed(2)}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>(-) DESCONTO</span>
                    <span>R$ {completedSale.discount.toFixed(2)}</span>
                  </div>
                )}
                {completedSale.additionalCharge > 0 && (
                  <div className="flex justify-between">
                    <span>(+) OUTROS/FRETE</span>
                    <span>R$ {completedSale.additionalCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] border-t border-slate-200 pt-1 mt-1 font-black">
                  <span>TOTAL LIQUIDO</span>
                  <span>R$ {completedSale.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payments details received */}
              <div className="border-b border-dashed border-slate-400 pb-2 mb-2 text-right">
                <p className="font-bold text-center border-b border-slate-200 pb-1 mb-1">PAGAMENTOS RECEBIDOS</p>
                {completedSale.payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between font-bold">
                    <span>{p.method}</span>
                    <span>R$ {p.amount.toFixed(2)}</span>
                  </div>
                ))}
                {completedSale.change > 0 && (
                  <div className="flex justify-between font-black text-blue-700 mt-1">
                    <span>TROCO DEVOLVIDO</span>
                    <span>R$ {completedSale.change.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {completedSale.observations && (
                <div className="text-center italic text-[9px] text-slate-600 border-b border-dashed border-slate-400 pb-2 mb-2">
                  Obs: {completedSale.observations}
                </div>
              )}

              {/* Barcode simulator image */}
              <div className="flex flex-col items-center justify-center pt-2 gap-1">
                <span className="font-bold text-[9px] text-slate-500">7 891234 560012</span>
                <div className="w-40 h-8 flex items-center justify-between overflow-hidden">
                  {Array.from({ length: 44 }).map((_, i) => (
                    <span 
                      key={i} 
                      className="bg-slate-900 h-full inline-block" 
                      style={{ width: `${Math.random() > 0.4 ? "2px" : "1px"}` }}
                    ></span>
                  ))}
                </div>
                <p className="text-[8px] text-slate-500 mt-2 uppercase tracking-wide">Obrigado pela preferência!</p>
              </div>

            </div>

            {/* Print and dismiss actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0 flex flex-col gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimir Cupom Térmico (58mm/80mm)
              </button>
              <button
                onClick={() => {
                  // Copy a nice formatting for WhatsApp
                  const text = `*CUPOM NÃO FISCAL - LEXPRO*\n*Venda:* ${completedSale.id}\n*Data:* ${new Date(completedSale.createdAt).toLocaleDateString()}\n------------------------------\n${completedSale.items.map(i => `${i.productName} (${i.quantity}x) - R$ ${i.total.toFixed(2)}`).join("\n")}\n------------------------------\n*Total:* R$ ${completedSale.total.toFixed(2)}\n*Troco:* R$ ${completedSale.change.toFixed(2)}\nObrigado pela preferência!`;
                  navigator.clipboard.writeText(text);
                  alert("Cupom formatado copiado para área de transferência!");
                }}
                className="w-full py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Copiar Recibo para WhatsApp
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="w-full py-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider mt-1 cursor-pointer"
              >
                Concluir e Voltar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
