/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Building2, LogOut, LayoutDashboard, ShoppingCart, Package, FileText, Users, 
  Truck, ArrowRightLeft, CircleDollarSign, Wrench, HardDrive, ClipboardList, 
  Settings as SettingsIcon, Bell, Menu, X, User as UserIcon, HelpCircle
} from "lucide-react";

import { api } from "./lib/api";
import { 
  Company, User, Product, Client, Supplier, Sale, Estimate, 
  InventoryLog, ServiceOrder, FinancialTransaction, SalesGoal, 
  SystemLog, SystemNotification, TaxConfig, Voucher 
} from "./types";

import LandingPage from "./components/LandingPage";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import PDV from "./components/PDV";
import Products from "./components/Products";
import Estimates from "./components/Estimates";
import Clients from "./components/Clients";
import Suppliers from "./components/Suppliers";
import Inventory from "./components/Inventory";
import Financial from "./components/Financial";
import ServiceOrders from "./components/ServiceOrders";
import Settings from "./components/Settings";
import Backup from "./components/Backup";
import LogViewer from "./components/LogViewer";

type ActiveTab = 
  | "DASHBOARD" | "PDV" | "PRODUCTS" | "ESTIMATES" | "CLIENTS" 
  | "SUPPLIERS" | "INVENTORY" | "FINANCIAL" | "SERVICE_ORDERS" 
  | "BACKUP" | "LOGS" | "SETTINGS";

export default function App() {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [token, setToken] = useState<string | null>(localStorage.getItem("pdv_token"));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);

  // Global state collections
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [financials, setFinancials] = useState<FinancialTransaction[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [goals, setGoals] = useState<SalesGoal[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  // Navigation and UI
  const [activeTab, setActiveTab] = useState<ActiveTab>("DASHBOARD");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Validate session on mount
  useEffect(() => {
    if (token) {
      fetchUserSession();
    }
  }, [token]);

  const fetchUserSession = async () => {
    setIsLoading(true);
    try {
      const currentToken = api.getToken();
      if (!currentToken) throw new Error("No token");

      // Fetch verified user and company details directly from the session endpoint
      const { user, company } = await api.getMe();
      setCurrentUser(user);
      setCurrentCompany(company);

      // Attempt to load core collections resiliently to prevent single failures from breaking the session
      try {
        const prods = await api.getProducts();
        setProducts(prods);
      } catch (e) {
        console.warn("Failed to load products during session restore:", e);
      }

      try {
        const clis = await api.getClients();
        setClients(clis);
      } catch (e) {
        console.warn("Failed to load clients during session restore:", e);
      }

      try {
        const sups = await api.getSuppliers();
        setSuppliers(sups);
      } catch (e) {
        console.warn("Failed to load suppliers during session restore:", e);
      }

      try {
        const sls = await api.getSales();
        setSales(sls);
      } catch (e) {
        console.warn("Failed to load sales during session restore:", e);
      }

      try {
        const ests = await api.getEstimates();
        setEstimates(ests);
      } catch (e) {
        console.warn("Failed to load estimates during session restore:", e);
      }

      try {
        const invLgs = await api.getInventoryLogs();
        setInventoryLogs(invLgs);
      } catch (e) {
        console.warn("Failed to load inventory logs during session restore:", e);
      }

      try {
        const fin = await api.getFinancials();
        setFinancials(fin);
      } catch (e) {
        console.warn("Failed to load financials during session restore:", e);
      }

      try {
        const svOrd = await api.getServiceOrders();
        setServiceOrders(svOrd);
      } catch (e) {
        console.warn("Failed to load service orders during session restore:", e);
      }

      try {
        const emps = await api.getEmployees();
        setEmployees(emps);
      } catch (e) {
        console.warn("Failed to load employees during session restore:", e);
      }

      try {
        const sysLogs = await api.getLogs();
        setLogs(sysLogs);
      } catch (e) {
        console.warn("Failed to load logs during session restore:", e);
      }

      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs);
      } catch (e) {
        console.warn("Failed to load notifications during session restore:", e);
      }

      try {
        const gls = await api.getGoals();
        setGoals(gls);
        const vchs = await api.getVouchers();
        setVouchers(vchs);
      } catch (e) {
        console.warn("Goals or Vouchers not fully initialized:", e);
      }

      setShowLanding(false);
    } catch (err) {
      console.error("Session restoration error:", err);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (tk: string, user: User, comp: Company) => {
    api.setToken(tk);
    setToken(tk);
    setCurrentUser(user);
    setCurrentCompany(comp);
    setShowLanding(false);
  };

  const handleLogout = () => {
    api.clearToken();
    setToken(null);
    setCurrentUser(null);
    setCurrentCompany(null);
    setShowLanding(true);
  };

  // --- RE-FETCH CORE UTILS ---
  const refreshProducts = async () => {
    const data = await api.getProducts();
    setProducts(data);
  };

  const refreshClients = async () => {
    const data = await api.getClients();
    setClients(data);
  };

  const refreshSuppliers = async () => {
    const data = await api.getSuppliers();
    setSuppliers(data);
  };

  const refreshSales = async () => {
    const data = await api.getSales();
    setSales(data);
  };

  const refreshEstimates = async () => {
    const data = await api.getEstimates();
    setEstimates(data);
  };

  const refreshInventory = async () => {
    const data = await api.getInventoryLogs();
    setInventoryLogs(data);
  };

  const refreshFinancial = async () => {
    const data = await api.getFinancials();
    setFinancials(data);
  };

  const refreshServiceOrders = async () => {
    const data = await api.getServiceOrders();
    setServiceOrders(data);
  };

  const refreshEmployees = async () => {
    const data = await api.getEmployees();
    setEmployees(data);
  };

  const refreshLogs = async () => {
    const data = await api.getLogs();
    setLogs(data);
  };

  const refreshNotifications = async () => {
    const data = await api.getNotifications();
    setNotifications(data);
  };

  // --- CRUD API callback wrappers ---
  const handleCreateProduct = async (data: Partial<Product>) => {
    const res = await api.createProduct(data);
    await refreshProducts();
    await refreshLogs();
    return res;
  };

  const handleUpdateProduct = async (id: string, data: Partial<Product>) => {
    const res = await api.updateProduct(id, data);
    await refreshProducts();
    await refreshLogs();
    return res;
  };

  const handleDeleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    await refreshProducts();
    await refreshLogs();
  };

  const handleCreateClient = async (data: Partial<Client>) => {
    const res = await api.createClient(data);
    await refreshClients();
    await refreshLogs();
    return res;
  };

  const handleUpdateClient = async (id: string, data: Partial<Client>) => {
    const res = await api.updateClient(id, data);
    await refreshClients();
    await refreshLogs();
    return res;
  };

  const handleDeleteClient = async (id: string) => {
    await api.deleteClient(id);
    await refreshClients();
    await refreshLogs();
  };

  const handleCreateSupplier = async (data: Partial<Supplier>) => {
    const res = await api.createSupplier(data);
    await refreshSuppliers();
    await refreshLogs();
    return res;
  };

  const handleUpdateSupplier = async (id: string, data: Partial<Supplier>) => {
    const res = await api.updateSupplier(id, data);
    await refreshSuppliers();
    await refreshLogs();
    return res;
  };

  const handleDeleteSupplier = async (id: string) => {
    await api.deleteSupplier(id);
    await refreshSuppliers();
    await refreshLogs();
  };

  const handleCreateSale = async (data: Partial<Sale>) => {
    const res = await api.createSale(data);
    await refreshSales();
    await refreshProducts();
    await refreshFinancial();
    await refreshNotifications();
    await refreshLogs();
    return res;
  };

  const handleCancelSale = async (id: string) => {
    await api.cancelSale(id);
    await refreshSales();
    await refreshProducts();
    await refreshFinancial();
    await refreshLogs();
  };

  const handleCreateEstimate = async (data: Partial<Estimate>) => {
    const res = await api.createEstimate(data);
    await refreshEstimates();
    await refreshLogs();
    return res;
  };

  const handleDeleteEstimate = async (id: string) => {
    await api.deleteEstimate(id);
    await refreshEstimates();
    await refreshLogs();
  };

  const handleAdjustStock = async (productId: string, type: "ENTRADA" | "SAIDA" | "AJUSTE", quantity: number, reason: string) => {
    const res = await api.adjustStock(productId, type, quantity, reason);
    await refreshInventory();
    await refreshProducts();
    await refreshLogs();
    return res;
  };

  const handleCreateFinancial = async (data: Partial<FinancialTransaction>) => {
    const res = await api.createFinancial(data);
    await refreshFinancial();
    await refreshLogs();
    return res;
  };

  const handlePayFinancial = async (id: string) => {
    const res = await api.payFinancial(id);
    await refreshFinancial();
    await refreshLogs();
    return res;
  };

  const handleDeleteFinancial = async (id: string) => {
    await api.deleteFinancial(id);
    await refreshFinancial();
    await refreshLogs();
  };

  const handleCreateServiceOrder = async (data: Partial<ServiceOrder>) => {
    const res = await api.createServiceOrder(data);
    await refreshServiceOrders();
    await refreshLogs();
    return res;
  };

  const handleUpdateServiceOrder = async (id: string, data: Partial<ServiceOrder>) => {
    const res = await api.updateServiceOrder(id, data);
    await refreshServiceOrders();
    await refreshLogs();
    return res;
  };

  const handleUpdateCompanyTax = async (tax: TaxConfig) => {
    const res = await api.updateCompanyTax(tax);
    setCurrentCompany(res);
    await refreshLogs();
    return res;
  };

  const handleCreateEmployee = async (data: Partial<User>) => {
    const res = await api.createEmployee(data);
    await refreshEmployees();
    await refreshLogs();
    return res;
  };

  const handleUpdateEmployee = async (id: string, data: Partial<User>) => {
    const res = await api.updateEmployee(id, data);
    await refreshEmployees();
    await refreshLogs();
    return res;
  };

  const handleDeleteEmployee = async (id: string) => {
    await api.deleteEmployee(id);
    await refreshEmployees();
    await refreshLogs();
  };

  const handleMarkNotificationsRead = async () => {
    await api.markNotificationsRead();
    await refreshNotifications();
  };

  // Safe default permission checking
  const userPermissions = currentUser?.permissions || {
    canAccessStock: true,
    canManageCRM: true,
    canEmitEstimate: true,
    canManageFinance: true,
    canSeeCost: true,
    canSeeProfit: true,
    canExcludeProduct: true
  };

  // If user is Admin, they override ALL permission blocks
  const permissions = currentUser?.role === "ADMIN" ? {
    canAccessStock: true,
    canManageCRM: true,
    canEmitEstimate: true,
    canManageFinance: true,
    canSeeCost: true,
    canSeeProfit: true,
    canExcludeProduct: true
  } : userPermissions;

  // Render routing based on state
  if (showLanding && !token) {
    return (
      <LandingPage 
        onLoginClick={() => { setAuthMode("login"); setShowLanding(false); }} 
        onRegisterClick={() => { setAuthMode("register"); setShowLanding(false); }} 
      />
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
        <Auth 
          initialMode={authMode}
          onAuthSuccess={handleAuthSuccess} 
          onBackToLanding={() => setShowLanding(true)} 
        />
        <div className="py-4 text-center border-t border-slate-900 bg-slate-950 text-[10px] text-slate-600">
          LexPro | Ambiente de Produção Seguro Criptografado lógicamente
        </div>
      </div>
    );
  }

  if (isLoading || !currentUser || !currentCompany) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Consolidando dados do inquilino multiempresa...</span>
      </div>
    );
  }

  // Navigation tabs layout metadata
  const navItems = [
    { id: "DASHBOARD", label: "Painel Analítico", icon: LayoutDashboard, perm: true },
    { id: "PDV", label: "Frente de Caixa (PDV)", icon: ShoppingCart, perm: permissions.canAccessStock },
    { id: "PRODUCTS", label: "Cadastro de Produtos", icon: Package, perm: permissions.canAccessStock },
    { id: "ESTIMATES", label: "Orçamentos Venda", icon: FileText, perm: permissions.canEmitEstimate },
    { id: "CLIENTS", label: "CRM Clientes", icon: Users, perm: permissions.canManageCRM },
    { id: "SUPPLIERS", label: "Fornecedores", icon: Truck, perm: permissions.canManageCRM },
    { id: "INVENTORY", label: "Movimentação Estoque", icon: ArrowRightLeft, perm: permissions.canAccessStock },
    { id: "FINANCIAL", label: "Fluxo Financeiro", icon: CircleDollarSign, perm: permissions.canManageFinance },
    { id: "SERVICE_ORDERS", label: "Ordens Serviço (OS)", icon: Wrench, perm: permissions.canManageCRM },
    { id: "BACKUP", label: "Backup & Relatórios", icon: HardDrive, perm: true },
    { id: "LOGS", label: "Log Auditoria", icon: ClipboardList, perm: currentUser.role === "ADMIN" },
    { id: "SETTINGS", label: "Configuração ERP", icon: SettingsIcon, perm: true },
  ];

  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* MOBILE HEADER RIBBON */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3.5 flex items-center justify-between z-40">
        <div className="flex items-center gap-1.5 font-black text-emerald-400 tracking-wider">
          <Building2 className="w-5 h-5 text-emerald-400" />
          <span>LEXPRO</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 relative"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>}
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400"
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* LEFT SIDEBAR CONTROLLER */}
      <aside className={`
        fixed md:relative top-0 left-0 bottom-0 z-30 w-64 border-r border-slate-800/80 bg-slate-900 flex flex-col justify-between transition-transform duration-300
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        
        <div className="flex flex-col overflow-y-auto">
          {/* Logo brand */}
          <div className="p-5 border-b border-slate-800/60 hidden md:flex items-center gap-2 font-black text-white tracking-widest text-sm">
            <Building2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="text-emerald-400">LEXPRO</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Workspace Seguro</p>
            </div>
          </div>

          {/* Nav items list */}
          <nav className="p-3 space-y-1 mt-3">
            {navItems.map(item => {
              if (!item.perm) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as ActiveTab);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs rounded-lg font-bold transition-all uppercase tracking-wider cursor-pointer ${
                    isActive 
                      ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold" 
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/30"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card footer */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/20 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-850 flex items-center justify-center font-bold text-emerald-400 text-xs border border-emerald-500/20 shrink-0">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate text-xs leading-tight">
              <p className="font-extrabold text-slate-200">{currentUser.name}</p>
              <p className="text-[9px] text-slate-500 uppercase font-mono mt-0.5">{currentUser.role} • {currentCompany.name}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 bg-slate-950 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/20 border border-slate-850 rounded-lg text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Encerrar Sessão
          </button>
        </div>

      </aside>

      {/* WORKSPACE AREA CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* TOP STATUS BAR ROW */}
        <header className="hidden md:flex bg-slate-900 px-6 py-4 border-b border-slate-800/80 justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-mono text-[10px] uppercase">Empresa:</span>
            <span className="text-white font-extrabold text-xs bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {currentCompany.name}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications toggle */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {/* Notifications panel overlay */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avisos Operacionais</span>
                    {unreadNotifs > 0 && (
                      <button
                        onClick={handleMarkNotificationsRead}
                        className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300"
                      >
                        Limpar Todos
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-850">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-[11px] text-slate-500 italic">Nenhum aviso operacional pendente.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 text-[11px] leading-snug ${n.read ? "opacity-60" : "bg-slate-950/20"}`}>
                          <p className="font-bold text-slate-200">{n.message}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Help / support marker */}
            <div className="text-slate-500 text-[10px] font-mono flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> SUPORTE: 24H
            </div>
          </div>
        </header>

        {/* MAIN TAB ROUTER SWITCH */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeTab === "DASHBOARD" && (
            <Dashboard 
              sales={sales} 
              products={products} 
              clients={clients}
              financials={financials} 
              goals={goals}
              permissions={permissions} 
            />
          )}

          {activeTab === "PDV" && (
            <PDV 
              products={products} 
              clients={clients} 
              vouchers={vouchers}
              onRegisterSale={handleCreateSale} 
              permissions={permissions} 
            />
          )}

          {activeTab === "PRODUCTS" && (
            <Products 
              products={products} 
              suppliers={suppliers} 
              onCreateProduct={handleCreateProduct} 
              onUpdateProduct={handleUpdateProduct} 
              onDeleteProduct={handleDeleteProduct} 
              permissions={permissions} 
            />
          )}

          {activeTab === "ESTIMATES" && (
            <Estimates 
              estimates={estimates} 
              clients={clients} 
              products={products} 
              onCreateEstimate={handleCreateEstimate} 
              onDeleteEstimate={handleDeleteEstimate} 
              permissions={permissions} 
            />
          )}

          {activeTab === "CLIENTS" && (
            <Clients 
              clients={clients} 
              onCreateClient={handleCreateClient} 
              onUpdateClient={handleUpdateClient} 
              onDeleteClient={handleDeleteClient} 
              permissions={permissions} 
            />
          )}

          {activeTab === "SUPPLIERS" && (
            <Suppliers 
              suppliers={suppliers} 
              onCreateSupplier={handleCreateSupplier} 
              onUpdateSupplier={handleUpdateSupplier} 
              onDeleteSupplier={handleDeleteSupplier} 
              permissions={permissions} 
            />
          )}

          {activeTab === "INVENTORY" && (
            <Inventory 
              products={products} 
              logs={inventoryLogs} 
              onAdjustStock={handleAdjustStock} 
              permissions={permissions} 
            />
          )}

          {activeTab === "FINANCIAL" && (
            <Financial 
              financials={financials} 
              onCreateFinancial={handleCreateFinancial} 
              onPayFinancial={handlePayFinancial} 
              onDeleteFinancial={handleDeleteFinancial} 
              permissions={permissions} 
            />
          )}

          {activeTab === "SERVICE_ORDERS" && (
            <ServiceOrders 
              orders={serviceOrders} 
              clients={clients} 
              products={products} 
              onCreateOrder={handleCreateServiceOrder} 
              onUpdateOrder={handleUpdateServiceOrder} 
              permissions={permissions} 
            />
          )}

          {activeTab === "BACKUP" && (
            <Backup />
          )}

          {activeTab === "LOGS" && (
            <LogViewer logs={logs} />
          )}

          {activeTab === "SETTINGS" && (
            <Settings 
              company={currentCompany} 
              employees={employees} 
              onUpdateCompanyTax={handleUpdateCompanyTax} 
              onCreateEmployee={handleCreateEmployee} 
              onUpdateEmployee={handleUpdateEmployee} 
              onDeleteEmployee={handleDeleteEmployee} 
              currentUser={currentUser} 
            />
          )}
        </div>

      </main>
    </div>
  );
}
