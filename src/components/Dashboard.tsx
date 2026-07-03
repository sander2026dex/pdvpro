/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { 
  TrendingUp, TrendingDown, ShoppingBag, Users, Calendar, Award, AlertTriangle, 
  Layers, CircleDollarSign, Percent, ArrowUpRight, BarChart3, PieChart
} from "lucide-react";
import { Sale, Product, Client, FinancialTransaction, SalesGoal } from "../types";

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  clients: Client[];
  financials: FinancialTransaction[];
  goals: SalesGoal[];
  permissions: any;
}

export default function Dashboard({ sales, products, clients, financials, goals, permissions }: DashboardProps) {
  // Calculations
  const stats = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000).toISOString();

    const salesToday = sales.filter(s => s.createdAt.startsWith(today));
    const salesWeek = sales.filter(s => s.createdAt >= sevenDaysAgo);
    const salesMonth = sales.filter(s => s.createdAt >= thirtyDaysAgo);

    const faturamentoToday = salesToday.reduce((sum, s) => sum + s.total, 0);
    const faturamentoWeek = salesWeek.reduce((sum, s) => sum + s.total, 0);
    const faturamentoMonth = salesMonth.reduce((sum, s) => sum + s.total, 0);

    // Calculate simulated profit based on product costPrice
    let profitMonth = 0;
    let costMonth = 0;
    
    salesMonth.forEach(sale => {
      sale.items.forEach(item => {
        // Find product to check cost price
        const prod = products.find(p => p.id === item.productId);
        const cost = prod ? prod.costPrice * item.quantity : 0;
        costMonth += cost;
        profitMonth += (item.total - cost);
      });
    });

    const expensesMonth = financials
      .filter(f => f.type === "DESPESA" && f.status === "PAGO" && f.paymentDate && f.paymentDate >= thirtyDaysAgo.substring(0, 10))
      .reduce((sum, f) => sum + f.amount, 0);

    const netProfitMonth = profitMonth - expensesMonth;

    const ticketMedioMonth = salesMonth.length > 0 ? faturamentoMonth / salesMonth.length : 0;

    const totalEstoqueValor = products.reduce((sum, p) => sum + (p.quantity * p.sellPrice), 0);
    const totalEstoqueCusto = products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0);
    const totalItensEstoque = products.reduce((sum, p) => sum + p.quantity, 0);

    return {
      faturamentoToday,
      faturamentoWeek,
      faturamentoMonth,
      profitMonth,
      expensesMonth,
      netProfitMonth,
      ticketMedioMonth,
      totalEstoqueValor,
      totalEstoqueCusto,
      totalItensEstoque,
      salesCount: salesMonth.length
    };
  }, [sales, products, financials]);

  // Goal calculation
  const currentGoal = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const goal = goals.find(g => g.month === currentMonth);
    return goal || { targetAmount: 10000, currentAmount: stats.faturamentoMonth };
  }, [goals, stats]);

  // Alerta de estoque baixo e zerado
  const stockAlerts = useMemo(() => {
    const low = products.filter(p => p.quantity > 0 && p.quantity <= p.minQuantity);
    const empty = products.filter(p => p.quantity === 0);
    return { low, empty };
  }, [products]);

  // Top products calculation
  const topProducts = useMemo(() => {
    const prodCounts: Record<string, { name: string; qty: number; total: number; category: string }> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        if (!prodCounts[item.productId]) {
          const prod = products.find(p => p.id === item.productId);
          prodCounts[item.productId] = {
            name: item.productName,
            qty: 0,
            total: 0,
            category: prod?.category || "Geral"
          };
        }
        prodCounts[item.productId].qty += item.quantity;
        prodCounts[item.productId].total += item.total;
      });
    });

    return Object.values(prodCounts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales, products]);

  // Curva ABC calculation (80% of faturamento comes from what products?)
  const abcCurve = useMemo(() => {
    const prodRevenues = products.map(p => {
      const revenue = sales.reduce((sum, s) => {
        const item = s.items.find(i => i.productId === p.id);
        return sum + (item ? item.total : 0);
      }, 0);
      return { name: p.name, revenue };
    }).sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = prodRevenues.reduce((sum, r) => sum + r.revenue, 0);
    
    let accRevenue = 0;
    const listA: string[] = [];
    const listB: string[] = [];
    const listC: string[] = [];

    prodRevenues.forEach(r => {
      accRevenue += r.revenue;
      const pct = totalRevenue > 0 ? (accRevenue / totalRevenue) * 100 : 100;
      if (pct <= 70) listA.push(r.name);
      else if (pct <= 90) listB.push(r.name);
      else listC.push(r.name);
    });

    return { totalRevenue, listA, listB, listC };
  }, [sales, products]);

  // Categories representation
  const categoryChartData = useMemo(() => {
    const catTotals: Record<string, number> = {};
    products.forEach(p => {
      catTotals[p.category] = (catTotals[p.category] || 0) + p.quantity;
    });
    return Object.entries(catTotals).map(([name, val]) => ({ name, val })).slice(0, 5);
  }, [products]);

  // Daily Sales trend (last 7 days)
  const salesTrend = useMemo(() => {
    const dates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().substring(0, 10);
    }).reverse();

    return dates.map(date => {
      const daySales = sales.filter(s => s.createdAt.startsWith(date));
      const total = daySales.reduce((sum, s) => sum + s.total, 0);
      return {
        label: new Date(date).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }),
        total
      };
    });
  }, [sales]);

  // Max value for salesTrend chart scaling
  const maxTrendVal = useMemo(() => {
    const vals = salesTrend.map(t => t.total);
    return Math.max(...vals, 1000); // minimum scale is 1000
  }, [salesTrend]);

  const goalPercentage = Math.min(100, Math.round((currentGoal.currentAmount / (currentGoal.targetAmount || 1)) * 100));

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-10">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" /> Painel de Controle Operacional
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Indicadores e estatísticas de vendas, faturamento e estoque em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 w-fit">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          Conectado ao Canal de Dados
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Diário */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Vendas do Dia</p>
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">R$ {stats.faturamentoToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Atualizado há instantes</span>
          </div>
        </div>

        {/* Faturamento Mensal */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Vendas no Mês (Bruto)</p>
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">R$ {stats.faturamentoMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-2">
            <span>Volume: <strong className="text-slate-200">{stats.salesCount} vendas</strong></span>
          </div>
        </div>

        {/* Lucro Mensal (Conditional view based on permission) */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Lucro Líquido do Mês</p>
            <CircleDollarSign className="w-5 h-5 text-amber-400" />
          </div>
          {permissions.canSeeProfit ? (
            <>
              <p className="text-2xl font-extrabold text-white mt-2">
                R$ {stats.netProfitMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 text-xs mt-2">
                <span className={stats.netProfitMonth >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {stats.netProfitMonth >= 0 ? "Resultado Superavitário" : "Resultado Deficitário"}
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 italic mt-3">Visualização restrita pelas permissões</p>
          )}
        </div>

        {/* Estoque Total */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total em Estoque</p>
            <Layers className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">R$ {stats.totalEstoqueValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-2">
            <span>Vol: <strong className="text-slate-200">{stats.totalItensEstoque} itens</strong></span>
            {permissions.canSeeCost && (
              <span className="text-slate-500 font-mono">/ Custo: R$ {Math.round(stats.totalEstoqueCusto)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Faturamento Diario Trend Graph (custom vector drawing) */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-200">Faturamento Diário - Últimos 7 Dias</h3>
            <span className="text-xs text-slate-500 font-mono">Visualização em linha</span>
          </div>
          
          {/* Custom SVG Line Graph */}
          <div className="relative w-full h-56 mt-2">
            <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
              {/* Guidelines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="0" y1="170" x2="500" y2="170" stroke="#1e293b" />

              {/* Draw Line & Area */}
              {(() => {
                const points = salesTrend.map((t, idx) => {
                  const x = (idx / 6) * 480 + 10;
                  const ratio = t.total / maxTrendVal;
                  const y = 160 - ratio * 130;
                  return { x, y, ...t };
                });

                const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                const areaPath = points.length > 0 
                  ? `${linePath} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z` 
                  : "";

                return (
                  <>
                    {/* Fill Area Gradient */}
                    {points.length > 0 && (
                      <path d={areaPath} fill="url(#chartGrad)" opacity="0.15" />
                    )}
                    {/* Line Path */}
                    {points.length > 0 && (
                      <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    
                    {/* Data Nodes */}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#020617" stroke="#10b981" strokeWidth="2" />
                        {/* Tooltip Hover value */}
                        {p.total > 0 && (
                          <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#a7f3d0" fontSize="8" fontWeight="bold">
                            R$ {Math.round(p.total)}
                          </text>
                        )}
                        {/* Date X-Axis label */}
                        <text x={p.x} y="185" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="medium">
                          {p.label}
                        </text>
                      </g>
                    ))}

                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </>
                );
              })()}
            </svg>
          </div>
          <div className="flex items-center justify-end gap-4 text-[10px] text-slate-500 mt-2 font-mono">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Faturamento</span>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-200">Meta de Vendas do Mês</h3>
              <span className="text-xs text-slate-500 font-mono">{new Date().toLocaleDateString("pt-BR", { month: "long" })}</span>
            </div>

            <div className="flex flex-col items-center justify-center my-6">
              {/* Circular Goal Pie Ring */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {/* Track ring */}
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Fill ring */}
                  <path
                    className="text-emerald-500"
                    strokeDasharray={`${goalPercentage}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-white">{goalPercentage}%</span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">concluído</span>
                </div>
              </div>

              {/* Progress Values */}
              <div className="w-full text-center space-y-1 mt-2">
                <p className="text-xs text-slate-400">Faturado: <strong className="text-emerald-400">R$ {currentGoal.currentAmount.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</strong></p>
                <p className="text-xs text-slate-400">Meta: <strong className="text-white">R$ {currentGoal.targetAmount.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</strong></p>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800">
            {goalPercentage >= 100 
              ? "🎉 Incrível! A meta mensal foi batida com sucesso!" 
              : `Faltam R$ ${Math.max(0, currentGoal.targetAmount - currentGoal.currentAmount).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} para bater a meta.`}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Curva ABC & Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Stock warnings panel */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-200">Alertas críticos de Estoque</h3>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto">
              {stockAlerts.empty.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-red-950/20 border border-red-950 p-2.5 rounded-lg">
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{p.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Cod: {p.code}</p>
                  </div>
                  <span className="bg-red-500/20 text-red-400 text-[10px] font-black uppercase px-2 py-0.5 rounded">Esgotado</span>
                </div>
              ))}

              {stockAlerts.low.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-amber-950/20 border border-amber-950 p-2.5 rounded-lg">
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{p.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Mínimo: {p.minQuantity} | Atual: {p.quantity}</p>
                  </div>
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded">Crítico</span>
                </div>
              ))}

              {stockAlerts.empty.length === 0 && stockAlerts.low.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-xs italic">
                  Nenhum produto em nível crítico de estoque no momento.
                </div>
              )}
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-800">
            Totalizando {stockAlerts.empty.length + stockAlerts.low.length} produtos em estado de atenção.
          </div>
        </div>

        {/* Curva ABC (Analise de relevância) */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">Curva ABC de Faturamento</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Produtos classe <strong>A</strong> são responsáveis por 70% das suas receitas gerais. Cuide para que esses itens nunca fiquem esgotados.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-emerald-400">Classe A (Relevância Máxima)</span>
                  <span className="font-mono text-slate-400">{abcCurve.listA.length} itens</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: abcCurve.listA.length > 0 ? "70%" : "0%" }}></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 max-h-12 overflow-y-auto leading-tight">
                  {abcCurve.listA.join(", ") || "Nenhum faturamento registrado ainda."}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-cyan-400">Classe B (Média Relevância)</span>
                  <span className="font-mono text-slate-400">{abcCurve.listB.length} itens</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                  <div className="bg-cyan-400 h-full" style={{ width: abcCurve.listB.length > 0 ? "20%" : "0%" }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 mt-3 font-mono text-right">
            Faturamento Total: R$ {abcCurve.totalRevenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Categories Circle chart */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <PieChart className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-slate-200">Distribuição por Categoria</h3>
            </div>

            {categoryChartData.length > 0 ? (
              <div className="space-y-3.5 my-3">
                {categoryChartData.map((cat, idx) => {
                  const colors = ["bg-emerald-500", "bg-cyan-500", "bg-purple-500", "bg-amber-500", "bg-blue-500"];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
                        <span className="text-slate-300 font-medium">{cat.name}</span>
                      </div>
                      <span className="font-bold text-white">{cat.val} un</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                Nenhum dado cadastrado.
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            Focado nos principais grupos mercadológicos.
          </div>
        </div>

      </div>

      {/* Top Products & Unmoved products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top selling table */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-200">Top 5 Produtos Mais Vendidos</h3>
            </div>
            <span className="text-[10px] text-slate-500">Por volume de saída</span>
          </div>

          {topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                    <th className="pb-2.5">Nome do Item</th>
                    <th className="pb-2.5">Categoria</th>
                    <th className="pb-2.5 text-center">Qtde Vendida</th>
                    <th className="pb-2.5 text-right">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 font-bold text-slate-100 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">#{idx+1}</span>
                        {p.name}
                      </td>
                      <td className="py-2.5 text-slate-400">{p.category}</td>
                      <td className="py-2.5 text-center font-bold text-emerald-400">{p.qty}</td>
                      <td className="py-2.5 text-right font-bold text-white">R$ {p.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-14 text-slate-500 text-xs italic">
              Nenhuma venda registrada até o momento.
            </div>
          )}
        </div>

        {/* Sem movimentação (dead stock detection) */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
            <Layers className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-200">Filtro de Baixo Giro (Dead Stock)</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Itens que constam em estoque mas não obtiveram saídas nos últimos 30 dias. Avalie promoções ou queimas de estoque.
          </p>

          {products.filter(p => p.quantity > 0 && !sales.some(s => s.items.some(i => i.productId === p.id))).length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {products
                .filter(p => p.quantity > 0 && !sales.some(s => s.items.some(i => i.productId === p.id)))
                .slice(0, 5)
                .map(p => (
                  <div key={p.id} className="flex justify-between items-center text-xs p-2 rounded bg-slate-950 border border-slate-800/60">
                    <span className="text-slate-200 font-medium truncate max-w-[160px]">{p.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Qtd: {p.quantity} {p.unit}</span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs italic">
              Todos os seus produtos ativos possuem giro constante!
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
