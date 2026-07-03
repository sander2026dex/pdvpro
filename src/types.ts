/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User and Company Roles & Permissions
export type UserRole = "ADMIN" | "EMPLOYEE";

export interface UserPermissions {
  canSell: boolean;
  canCancelSale: boolean;
  canAlterPrice: boolean;
  canExcludeProduct: boolean;
  canRegisterClient: boolean;
  canRegisterSupplier: boolean;
  canAccessFinance: boolean;
  canAccessStock: boolean;
  canEmitEstimate: boolean;
  canPrint: boolean;
  canExportPDF: boolean;
  canSeeProfit: boolean;
  canSeeCost: boolean;
  canAlterConfig: boolean;
  canEmitReports: boolean;
  canAccessDashboard: boolean;
  canAccessBackup: boolean;
  canRegisterUsers: boolean;
  canAccessCatalog: boolean;
  canViewStats: boolean;
}

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: UserPermissions;
  active: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  ownerEmail: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  logoUrl?: string;
  createdAt: string;
  taxConfig: TaxConfig;
}

// Tax Configuration (Motor Tributário)
export interface TaxConfig {
  regime: "SIMPLES" | "PRESUMIDO" | "REAL";
  icmsAliquota: number;
  icmsStAliquota: number;
  ipiAliquota: number;
  pisAliquota: number;
  cofinsAliquota: number;
  issAliquota: number;
}

// Product Models
export interface Batch {
  id: string;
  lote: string;
  expirationDate: string;
  quantity: number;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  code: string;
  barcode: string;
  sku: string;
  category: string;
  brand: string;
  supplierId?: string;
  description: string;
  costPrice: number;
  sellPrice: number;
  promoPrice?: number;
  quantity: number;
  minQuantity: number;
  unit: string; // UN, KG, LT, MT, PCT, etc.
  weight?: number; // em kg
  width?: number; // em cm
  height?: number; // em cm
  length?: number; // em cm
  ncm?: string;
  cfop?: string;
  origem?: string;
  active: boolean;
  images: string[]; // URLs ou Base64
  batches: Batch[];
  createdAt: string;
}

// Client & Supplier Models
export interface Client {
  id: string;
  companyId: string;
  name: string;
  cpfCnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  birthDate?: string;
  observations?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  contactPerson?: string;
  createdAt: string;
}

// Sale & PDV Models
export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number; // por item
  total: number;
}

export interface PaymentDetails {
  method: "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO" | "CHEQUE" | "VALE";
  amount: number;
}

export interface Sale {
  id: string;
  companyId: string;
  userId: string; // Vendedor
  userName: string;
  clientId?: string;
  clientName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number; // total discount
  additionalCharge: number;
  total: number;
  payments: PaymentDetails[];
  change: number;
  observations?: string;
  createdAt: string;
}

// Estimates (Orçamentos)
export interface EstimateItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  imageUrl?: string;
}

export interface Estimate {
  id: string;
  companyId: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  items: EstimateItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  taxesCost: number;
  total: number;
  paymentTerms: string;
  validUntil: string;
  observations?: string;
  createdAt: string;
}

// Inventory Movements
export type MovementType = "ENTRADA" | "SAIDA" | "AJUSTE" | "TRANSFERENCIA";

export interface InventoryLog {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  previousQty: number;
  newQty: number;
  reason: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// Service Order (Ordem de Serviço - OS)
export interface ServiceOrder {
  id: string;
  companyId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  equipment: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  defectDescription: string;
  status: "ABERTO" | "EM_ANALISE" | "APROVADO" | "REPROVADO" | "CONCLUIDO" | "ENTREGUE";
  technicalObservations?: string;
  services: { name: string; price: number }[];
  parts: { name: string; quantity: number; price: number }[];
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

// Financial Models
export interface FinancialTransaction {
  id: string;
  companyId: string;
  type: "RECEITA" | "DESPESA";
  category: string; // Ex: Vendas, Salários, Aluguel, Fornecedores
  description: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: "PENDENTE" | "PAGO";
  costCenter?: string;
  refId?: string; // ID da venda ou despesa associada
  createdAt: string;
}

// Commissions and Sales Goals
export interface Commission {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  saleId: string;
  saleTotal: number;
  percentage: number;
  amount: number;
  status: "PENDENTE" | "PAGO";
  createdAt: string;
}

export interface SalesGoal {
  id: string;
  companyId: string;
  month: string; // YYYY-MM
  targetAmount: number;
  currentAmount: number;
}

// Vouchers & Loyalty Programs
export interface Voucher {
  id: string;
  companyId: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  value: number;
  minPurchase?: number;
  expiryDate: string;
  active: boolean;
}

// System Audit Logs
export interface SystemLog {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  action: string; // Ex: "Exclusão de Produto", "Alteração de Preço"
  details: string;
  ip: string;
  device: string;
  createdAt: string;
}

// Notifications
export interface SystemNotification {
  id: string;
  companyId: string;
  type: "ESTOQUE_BAIXO" | "ESTOQUE_ZERADO" | "VALIDADE_ALERTA" | "CONTAS_VENCIDAS" | "ANIVERSARIO" | "GERAL";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
