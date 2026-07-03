/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Company, User, Product, Client, Supplier, Sale, Estimate, 
  InventoryLog, ServiceOrder, FinancialTransaction, Commission, 
  SalesGoal, Voucher, SystemLog, SystemNotification, TaxConfig 
} from "../types";

const getAuthHeaders = () => {
  const token = localStorage.getItem("pdv_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

const getAuthJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error! status: ${res.status}`);
  }
  return res.json() as Promise<T>;
};

export const api = {
  // Auth
  setToken: (token: string) => localStorage.setItem("pdv_token", token),
  getToken: () => localStorage.getItem("pdv_token"),
  clearToken: () => localStorage.removeItem("pdv_token"),
  getMe: () => getAuthJson<{ user: User; company: Company }>("/api/auth/me"),

  login: async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha ao fazer login");
    }
    return res.json() as Promise<{ token: string; user: User; company: Company }>;
  },

  register: async (name: string, company: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company, email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha ao criar conta");
    }
    return res.json() as Promise<{ token: string; user: User; company: Company }>;
  },

  // Employees (Users)
  getEmployees: () => getAuthJson<User[]>("/api/users"),

  createEmployee: async (data: Partial<User>) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao criar funcionário");
    }
    return res.json() as Promise<User>;
  },

  updateEmployee: async (id: string, data: Partial<User>) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao editar funcionário");
    }
    return res.json() as Promise<User>;
  },

  deleteEmployee: async (id: string) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao excluir funcionário");
    }
    return res.json() as Promise<{ success: boolean }>;
  },

  // Products
  getProducts: () => getAuthJson<Product[]>("/api/products"),

  createProduct: async (data: Partial<Product>) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao criar produto");
    }
    return res.json() as Promise<Product>;
  },

  updateProduct: async (id: string, data: Partial<Product>) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao salvar produto");
    }
    return res.json() as Promise<Product>;
  },

  deleteProduct: async (id: string) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao excluir produto");
    }
    return res.json() as Promise<{ success: boolean }>;
  },

  // Clients
  getClients: () => getAuthJson<Client[]>("/api/clients"),

  createClient: async (data: Partial<Client>) => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao cadastrar cliente");
    }
    return res.json() as Promise<Client>;
  },

  updateClient: async (id: string, data: Partial<Client>) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao editar cliente");
    }
    return res.json() as Promise<Client>;
  },

  deleteClient: async (id: string) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao excluir cliente");
    }
    return res.json() as Promise<{ success: boolean }>;
  },

  // Suppliers
  getSuppliers: () => getAuthJson<Supplier[]>("/api/suppliers"),

  createSupplier: async (data: Partial<Supplier>) => {
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao cadastrar fornecedor");
    }
    return res.json() as Promise<Supplier>;
  },

  updateSupplier: async (id: string, data: Partial<Supplier>) => {
    const res = await fetch(`/api/suppliers/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao editar fornecedor");
    }
    return res.json() as Promise<Supplier>;
  },

  deleteSupplier: async (id: string) => {
    const res = await fetch(`/api/suppliers/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao excluir fornecedor");
    }
    return res.json() as Promise<{ success: boolean }>;
  },

  // Sales
  getSales: () => getAuthJson<Sale[]>("/api/sales"),

  createSale: async (data: Partial<Sale>) => {
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao registrar venda");
    }
    return res.json() as Promise<Sale>;
  },

  cancelSale: async (id: string) => {
    const res = await fetch(`/api/sales/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao cancelar venda");
    }
    return res.json() as Promise<{ success: boolean }>;
  },

  // Estimates
  getEstimates: () => getAuthJson<Estimate[]>("/api/estimates"),

  createEstimate: async (data: Partial<Estimate>) => {
    const res = await fetch("/api/estimates", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao criar orçamento");
    }
    return res.json() as Promise<Estimate>;
  },

  deleteEstimate: async (id: string) => {
    const res = await fetch(`/api/estimates/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao excluir orçamento");
    }
    return res.json() as Promise<{ success: boolean }>;
  },

  // Inventory Stock Adjustment
  getInventoryLogs: () => getAuthJson<InventoryLog[]>("/api/inventory"),

  adjustStock: async (productId: string, type: "ENTRADA" | "SAIDA" | "AJUSTE", quantity: number, reason: string) => {
    const res = await fetch("/api/inventory/adjust", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, type, quantity, reason })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao lançar movimentação");
    }
    return res.json() as Promise<InventoryLog>;
  },

  // Financials
  getFinancials: () => getAuthJson<FinancialTransaction[]>("/api/financial"),

  createFinancial: async (data: Partial<FinancialTransaction>) => {
    const res = await fetch("/api/financial", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao lançar transação financeira");
    }
    return res.json() as Promise<FinancialTransaction>;
  },

  payFinancial: async (id: string) => {
    const res = await fetch(`/api/financial/${id}/pay`, {
      method: "PUT",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao marcar como pago");
    }
    return res.json() as Promise<FinancialTransaction>;
  },

  deleteFinancial: async (id: string) => {
    const res = await fetch(`/api/financial/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao excluir transação");
    }
    return res.json() as Promise<{ success: boolean }>;
  },

  // Service Orders (OS)
  getServiceOrders: () => getAuthJson<ServiceOrder[]>("/api/service-orders"),

  createServiceOrder: async (data: Partial<ServiceOrder>) => {
    const res = await fetch("/api/service-orders", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao abrir OS");
    }
    return res.json() as Promise<ServiceOrder>;
  },

  updateServiceOrder: async (id: string, data: Partial<ServiceOrder>) => {
    const res = await fetch(`/api/service-orders/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao atualizar OS");
    }
    return res.json() as Promise<ServiceOrder>;
  },

  // Commissions
  getCommissions: () => getAuthJson<Commission[]>("/api/commissions"),

  payCommission: async (id: string) => {
    const res = await fetch(`/api/commissions/${id}/pay`, {
      method: "PUT",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao quitar comissão");
    }
    return res.json() as Promise<Commission>;
  },

  // Goals
  getGoals: () => getAuthJson<SalesGoal[]>("/api/goals"),

  updateGoal: async (month: string, targetAmount: number) => {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ month, targetAmount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao atualizar meta");
    }
    return res.json() as Promise<SalesGoal>;
  },

  // Vouchers
  getVouchers: () => getAuthJson<Voucher[]>("/api/vouchers"),

  createVoucher: async (data: Partial<Voucher>) => {
    const res = await fetch("/api/vouchers", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao criar cupom");
    }
    return res.json() as Promise<Voucher>;
  },

  // Tax Configurations
  updateCompanyTax: async (taxConfig: TaxConfig) => {
    const res = await fetch("/api/company/tax", {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(taxConfig)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao salvar regime tributário");
    }
    return res.json() as Promise<Company>;
  },

  // Audit Logs
  getLogs: () => getAuthJson<SystemLog[]>("/api/logs"),

  // Notifications
  getNotifications: () => getAuthJson<SystemNotification[]>("/api/notifications"),

  markNotificationsRead: async () => {
    const res = await fetch("/api/notifications/read-all", {
      method: "PUT",
      headers: getAuthHeaders()
    });
    return res.json() as Promise<{ success: boolean }>;
  },

  // Export Backups
  exportDatabaseBackup: async () => {
    const res = await fetch("/api/backup/export", { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao exportar banco de dados");
    }
    return res.json();
  },

  exportDocumentalBackup: async () => {
    const res = await fetch("/api/backup/pdf", { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao gerar backup documental");
    }
    return res.json() as Promise<{ folderName: string; files: { name: string; title: string; content: string }[] }>;
  }
};
