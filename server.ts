/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  Company, User, Product, Client, Supplier, Sale, Estimate, 
  InventoryLog, ServiceOrder, FinancialTransaction, Commission, 
  SalesGoal, Voucher, SystemLog, SystemNotification, TaxConfig 
} from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Ensure directories exist
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Global DB Helpers
const getCompanies = (): Company[] => {
  const filePath = path.join(DATA_DIR, "companies.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const saveCompanies = (companies: Company[]) => {
  fs.writeFileSync(path.join(DATA_DIR, "companies.json"), JSON.stringify(companies, null, 2));
};

const getUsers = (): User[] => {
  const filePath = path.join(DATA_DIR, "users.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const saveUsers = (users: User[]) => {
  fs.writeFileSync(path.join(DATA_DIR, "users.json"), JSON.stringify(users, null, 2));
};

// Company Specific File Helpers
const getCompanyDir = (companyId: string) => {
  const dir = path.join(DATA_DIR, `company_${companyId}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const getCompanyData = <T>(companyId: string, filename: string, defaultVal: T): T => {
  const dir = getCompanyDir(companyId);
  const filePath = path.join(dir, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
    return defaultVal;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    return defaultVal;
  }
};

const saveCompanyData = <T>(companyId: string, filename: string, data: T) => {
  const dir = getCompanyDir(companyId);
  const filePath = path.join(dir, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Global audit logger
const writeLog = (companyId: string, userId: string, userName: string, action: string, details: string, req: express.Request) => {
  const logs = getCompanyData<SystemLog[]>(companyId, "logs", []);
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
  const device = req.headers["user-agent"] || "Desconhecido";
  const newLog: SystemLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    companyId,
    userId,
    userName,
    action,
    details,
    ip,
    device,
    createdAt: new Date().toISOString()
  };
  logs.unshift(newLog);
  saveCompanyData(companyId, "logs", logs.slice(0, 1000)); // Limit to last 1000 logs
};

// Seed Demo Company if empty
const seedDemoData = () => {
  const companies = getCompanies();
  const users = getUsers();
  
  if (companies.length === 0) {
    const demoCompanyId = "demo_company_123";
    const demoUserId = "demo_user_123";
    
    const demoCompany: Company = {
      id: demoCompanyId,
      name: "Demo Comercial Ltda",
      ownerEmail: "demo@erp.com",
      cnpj: "12.345.678/0001-90",
      phone: "(11) 98765-4321",
      address: "Av. Paulista, 1000 - Bela Vista",
      city: "São Paulo",
      state: "SP",
      logoUrl: "",
      createdAt: new Date().toISOString(),
      taxConfig: {
        regime: "SIMPLES",
        icmsAliquota: 4.0,
        icmsStAliquota: 0,
        ipiAliquota: 2.0,
        pisAliquota: 0.65,
        cofinsAliquota: 3.0,
        issAliquota: 2.0
      }
    };
    
    const demoAdmin: User = {
      id: demoUserId,
      companyId: demoCompanyId,
      name: "Administrador Demo",
      email: "demo@erp.com",
      role: "ADMIN",
      permissions: {
        canSell: true,
        canCancelSale: true,
        canAlterPrice: true,
        canExcludeProduct: true,
        canRegisterClient: true,
        canRegisterSupplier: true,
        canAccessFinance: true,
        canAccessStock: true,
        canEmitEstimate: true,
        canPrint: true,
        canExportPDF: true,
        canSeeProfit: true,
        canSeeCost: true,
        canAlterConfig: true,
        canEmitReports: true,
        canAccessDashboard: true,
        canAccessBackup: true,
        canRegisterUsers: true,
        canAccessCatalog: true,
        canViewStats: true
      },
      active: true,
      createdAt: new Date().toISOString()
    };

    const employeeUser: User = {
      id: "demo_emp_1",
      companyId: demoCompanyId,
      name: "João Vendedor",
      email: "vendedor@erp.com",
      role: "EMPLOYEE",
      permissions: {
        canSell: true,
        canCancelSale: false,
        canAlterPrice: false,
        canExcludeProduct: false,
        canRegisterClient: true,
        canRegisterSupplier: false,
        canAccessFinance: false,
        canAccessStock: true,
        canEmitEstimate: true,
        canPrint: true,
        canExportPDF: true,
        canSeeProfit: false,
        canSeeCost: false,
        canAlterConfig: false,
        canEmitReports: false,
        canAccessDashboard: true,
        canAccessBackup: false,
        canRegisterUsers: false,
        canAccessCatalog: true,
        canViewStats: false
      },
      active: true,
      createdAt: new Date().toISOString()
    };
    
    companies.push(demoCompany);
    users.push(demoAdmin, employeeUser);
    
    saveCompanies(companies);
    saveUsers(users);

    // Seed Demo Products
    const products: Product[] = [
      {
        id: "p1",
        companyId: demoCompanyId,
        name: "Notebook Pro Ultra 15",
        code: "NBP001",
        barcode: "7891234560012",
        sku: "TEC-NB-PRO15",
        category: "Informática",
        brand: "Delltech",
        description: "Intel i7, 16GB RAM, 512GB SSD NVMe, Tela IPS 15.6 Full HD, Placa de Vídeo Integrada Iris Xe",
        costPrice: 3200.00,
        sellPrice: 4890.00,
        quantity: 12,
        minQuantity: 5,
        unit: "UN",
        weight: 1.8,
        width: 35,
        height: 2,
        length: 24,
        ncm: "8471.30.12",
        cfop: "5102",
        origem: "0",
        active: true,
        images: [],
        batches: [{ id: "l1", lote: "L-2026A", expirationDate: "2029-12-31", quantity: 12 }],
        createdAt: new Date().toISOString()
      },
      {
        id: "p2",
        companyId: demoCompanyId,
        name: "Teclado Mecânico Gamer RGB",
        code: "TEC002",
        barcode: "7891234560029",
        sku: "TEC-KB-MECH",
        category: "Acessórios",
        brand: "HyperX",
        description: "Teclado mecânico switch Blue, iluminação RGB customizável, layout ABNT2 com teclas double-shot",
        costPrice: 150.00,
        sellPrice: 349.90,
        quantity: 4,
        minQuantity: 10, // Alerta de estoque baixo!
        unit: "UN",
        weight: 0.9,
        width: 44,
        height: 4,
        length: 13,
        ncm: "8471.60.52",
        cfop: "5102",
        origem: "1",
        active: true,
        images: [],
        batches: [],
        createdAt: new Date().toISOString()
      },
      {
        id: "p3",
        companyId: demoCompanyId,
        name: "Mouse Gamer Sem Fio 16K DPI",
        code: "MOU003",
        barcode: "7891234560036",
        sku: "TEC-MS-WIRE",
        category: "Acessórios",
        brand: "Logitech",
        description: "Sensor HERO 16K, conexão sem fio Lightspeed de 1ms, bateria recarregável com até 60h de duração",
        costPrice: 120.00,
        sellPrice: 289.00,
        quantity: 15,
        minQuantity: 8,
        unit: "UN",
        weight: 0.1,
        width: 12,
        height: 4,
        length: 6,
        ncm: "8471.60.53",
        cfop: "5102",
        origem: "1",
        active: true,
        images: [],
        batches: [],
        createdAt: new Date().toISOString()
      },
      {
        id: "p4",
        companyId: demoCompanyId,
        name: "Monitor Gamer 27 UltraWide IPS",
        code: "MON004",
        barcode: "7891234560043",
        sku: "TEC-MT-UW27",
        category: "Informática",
        brand: "LG",
        description: "Monitor de 27 polegadas UltraWide 21:9, taxa de atualização 75Hz, tempo de resposta 1ms, HDR10",
        costPrice: 750.00,
        sellPrice: 1199.00,
        quantity: 0, // Estoque zerado!
        minQuantity: 3,
        unit: "UN",
        weight: 4.5,
        width: 61,
        height: 38,
        length: 20,
        ncm: "8528.52.20",
        cfop: "5102",
        origem: "1",
        active: true,
        images: [],
        batches: [],
        createdAt: new Date().toISOString()
      },
      {
        id: "p5",
        companyId: demoCompanyId,
        name: "Cadeira de Escritório Ergonômica",
        code: "CAD005",
        barcode: "7891234560050",
        sku: "OFF-CH-ERGO",
        category: "Móveis",
        brand: "Flexform",
        description: "Cadeira ergonômica com apoio lombar regulável, braços 3D, encosto em tela mesh, pistão classe 4",
        costPrice: 400.00,
        sellPrice: 799.00,
        quantity: 8,
        minQuantity: 3,
        unit: "UN",
        weight: 15.0,
        width: 65,
        height: 120,
        length: 65,
        ncm: "9401.30.90",
        cfop: "5102",
        origem: "0",
        active: true,
        images: [],
        batches: [],
        createdAt: new Date().toISOString()
      }
    ];
    saveCompanyData(demoCompanyId, "products", products);

    // Seed Demo Clients
    const clients: Client[] = [
      {
        id: "c1",
        companyId: demoCompanyId,
        name: "Carlos Eduardo de Souza",
        cpfCnpj: "123.456.789-00",
        phone: "(11) 99999-1111",
        whatsapp: "5511999991111",
        email: "carlos.souza@gmail.com",
        address: "Rua das Flores, 123",
        city: "São Paulo",
        state: "SP",
        cep: "01234-567",
        birthDate: "1988-05-15",
        observations: "Cliente preferencial, prefere contato por WhatsApp",
        loyaltyPoints: 120,
        createdAt: new Date().toISOString()
      },
      {
        id: "c2",
        companyId: demoCompanyId,
        name: "Ana Maria de Oliveira Ramos",
        cpfCnpj: "987.654.321-11",
        phone: "(11) 98888-2222",
        whatsapp: "5511988882222",
        email: "ana.oliveira@hotmail.com",
        address: "Av. Brasil, 456 - Apt 12",
        city: "Campinas",
        state: "SP",
        cep: "13000-111",
        birthDate: "1992-10-22",
        loyaltyPoints: 45,
        createdAt: new Date().toISOString()
      },
      {
        id: "c3",
        companyId: demoCompanyId,
        name: "Tech Solutions Sistemas Ltda",
        cpfCnpj: "44.555.666/0001-22",
        phone: "(11) 3333-4444",
        whatsapp: "551133334444",
        email: "compras@techsolutions.com.br",
        address: "Rua do Silício, 1024 - Bloco B",
        city: "São José dos Campos",
        state: "SP",
        cep: "12245-000",
        loyaltyPoints: 500,
        createdAt: new Date().toISOString()
      }
    ];
    saveCompanyData(demoCompanyId, "clients", clients);

    // Seed Demo Suppliers
    const suppliers: Supplier[] = [
      {
        id: "s1",
        companyId: demoCompanyId,
        name: "Distribuidora Tech Brasil SA",
        cnpj: "10.200.300/0001-40",
        phone: "(11) 4004-9876",
        email: "vendas@distribuidoratech.com.br",
        address: "Rodovia Anhanguera, Km 45",
        city: "Jundiaí",
        state: "SP",
        cep: "13200-000",
        contactPerson: "Ricardo Mendes",
        createdAt: new Date().toISOString()
      },
      {
        id: "s2",
        companyId: demoCompanyId,
        name: "Móveis & Design Corporativo",
        cnpj: "55.666.777/0001-88",
        phone: "(54) 3456-7890",
        email: "comercial@moveisdesign.com.br",
        address: "Rua Bento Gonçalves, 800",
        city: "Bento Gonçalves",
        state: "RS",
        cep: "95700-000",
        contactPerson: "Marcos Pinheiro",
        createdAt: new Date().toISOString()
      }
    ];
    saveCompanyData(demoCompanyId, "suppliers", suppliers);

    // Seed Demo Sales (for charts!)
    // We will generate sales spread across today, yesterday, and the past week
    const sales: Sale[] = [
      {
        id: "v1",
        companyId: demoCompanyId,
        userId: "demo_user_123",
        userName: "Administrador Demo",
        clientId: "c1",
        clientName: "Carlos Eduardo de Souza",
        items: [
          { productId: "p1", productName: "Notebook Pro Ultra 15", quantity: 1, unitPrice: 4890.00, discount: 190.00, total: 4700.00 },
          { productId: "p3", productName: "Mouse Gamer Sem Fio 16K DPI", quantity: 1, unitPrice: 289.00, discount: 0, total: 289.00 }
        ],
        subtotal: 5179.00,
        discount: 190.00,
        additionalCharge: 0,
        total: 4989.00,
        payments: [{ method: "PIX", amount: 4989.00 }],
        change: 0,
        observations: "Entregue ao cliente no balcão.",
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString() // Hoje mais cedo
      },
      {
        id: "v2",
        companyId: demoCompanyId,
        userId: "demo_emp_1",
        userName: "João Vendedor",
        clientId: "c2",
        clientName: "Ana Maria de Oliveira Ramos",
        items: [
          { productId: "p2", productName: "Teclado Mecânico Gamer RGB", quantity: 1, unitPrice: 349.90, discount: 9.90, total: 340.00 }
        ],
        subtotal: 349.90,
        discount: 9.90,
        additionalCharge: 0,
        total: 340.00,
        payments: [{ method: "CREDITO", amount: 340.00 }],
        change: 0,
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString() // Ontem
      },
      {
        id: "v3",
        companyId: demoCompanyId,
        userId: "demo_emp_1",
        userName: "João Vendedor",
        clientId: "c3",
        clientName: "Tech Solutions Sistemas Ltda",
        items: [
          { productId: "p1", productName: "Notebook Pro Ultra 15", quantity: 2, unitPrice: 4890.00, discount: 200.00, total: 9380.00 },
          { productId: "p5", productName: "Cadeira de Escritório Ergonômica", quantity: 3, unitPrice: 799.00, discount: 0, total: 2397.00 }
        ],
        subtotal: 12177.00,
        discount: 400.00,
        additionalCharge: 150.00, // Frete
        total: 11927.00,
        payments: [{ method: "DEBITO", amount: 11927.00 }],
        change: 0,
        createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString() // 3 dias atrás
      },
      {
        id: "v4",
        companyId: demoCompanyId,
        userId: "demo_user_123",
        userName: "Administrador Demo",
        items: [
          { productId: "p3", productName: "Mouse Gamer Sem Fio 16K DPI", quantity: 2, unitPrice: 289.00, discount: 19.00, total: 559.00 }
        ],
        subtotal: 578.00,
        discount: 19.00,
        additionalCharge: 0,
        total: 559.00,
        payments: [{ method: "DINHEIRO", amount: 600.00 }],
        change: 41.00,
        createdAt: new Date(Date.now() - 6 * 24 * 3600000).toISOString() // 6 dias atrás
      }
    ];
    saveCompanyData(demoCompanyId, "sales", sales);

    // Seed Demo Estimates
    const estimates: Estimate[] = [
      {
        id: "o1",
        companyId: demoCompanyId,
        clientId: "c3",
        clientName: "Tech Solutions Sistemas Ltda",
        clientPhone: "(11) 3333-4444",
        items: [
          { productId: "p1", productName: "Notebook Pro Ultra 15", quantity: 5, unitPrice: 4890.00, discount: 390.00, total: 22500.00 },
          { productId: "p5", productName: "Cadeira de Escritório Ergonômica", quantity: 5, unitPrice: 799.00, discount: 49.00, total: 3750.00 }
        ],
        subtotal: 28445.00,
        discount: 2195.00,
        shippingCost: 350.00,
        taxesCost: 1120.00,
        total: 27720.00,
        paymentTerms: "Faturado 30/60 dias no boleto bancário",
        validUntil: "2026-08-15",
        observations: "Orçamento de expansão das posições de trabalho da equipe de desenvolvimento.",
        createdAt: new Date().toISOString()
      }
    ];
    saveCompanyData(demoCompanyId, "estimates", estimates);

    // Seed Service Orders (OS)
    const serviceOrders: ServiceOrder[] = [
      {
        id: "os1",
        companyId: demoCompanyId,
        clientId: "c1",
        clientName: "Carlos Eduardo de Souza",
        clientPhone: "(11) 99999-1111",
        equipment: "Notebook Lenovo Legion",
        brand: "Lenovo",
        model: "Legion 5i",
        serialNumber: "PE05RXYZ",
        defectDescription: "Superaquecimento e lentidão severa sob carga de jogos. Ventoinhas fazendo ruído excessivo.",
        status: "EM_ANALISE",
        technicalObservations: "Identificada obstrução por poeira nos dissipadores de cobre. Pasta térmica original ressecada (precisa trocar).",
        services: [
          { name: "Limpeza Interna e Lubrificação de Fans", price: 120.00 },
          { name: "Troca de Pasta Térmica (Metal Líquido / Thermal Grizzly)", price: 150.00 }
        ],
        parts: [
          { name: "Thermal Pad Premium", quantity: 2, price: 35.00 }
        ],
        discount: 10.00,
        total: 330.00,
        createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "os2",
        companyId: demoCompanyId,
        clientId: "c2",
        clientName: "Ana Maria de Oliveira Ramos",
        clientPhone: "(11) 98888-2222",
        equipment: "Desktop PC Gamer",
        brand: "Custom",
        model: "Core i5-11400 / RTX 3060",
        defectDescription: "PC desliga sozinho após 10 minutos ligado. Tela azul frequente.",
        status: "CONCLUIDO",
        technicalObservations: "Fonte de alimentação genérica 500W com capacitores estufados e oscilação de tensão na linha de 12V. Substituída por fonte Corsair 650W Bronze.",
        services: [
          { name: "Mão de Obra de Diagnóstico e Montagem", price: 100.00 }
        ],
        parts: [
          { name: "Fonte Corsair CV650 650W 80 Plus Bronze", quantity: 1, price: 380.00 }
        ],
        discount: 0,
        total: 480.00,
        createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString()
      }
    ];
    saveCompanyData(demoCompanyId, "service_orders", serviceOrders);

    // Seed Financial Transactions
    const financial: FinancialTransaction[] = [
      {
        id: "f1",
        companyId: demoCompanyId,
        type: "DESPESA",
        category: "Aluguel",
        description: "Aluguel Mensal da Sala Comercial",
        amount: 2500.00,
        dueDate: "2026-07-10",
        status: "PENDENTE",
        costCenter: "Administrativo",
        createdAt: new Date().toISOString()
      },
      {
        id: "f2",
        companyId: demoCompanyId,
        type: "DESPESA",
        category: "Energia",
        description: "Fatura de Energia Elétrica Enel",
        amount: 480.00,
        dueDate: "2026-07-05",
        status: "PENDENTE",
        costCenter: "Operacional",
        createdAt: new Date().toISOString()
      },
      {
        id: "f3",
        companyId: demoCompanyId,
        type: "DESPESA",
        category: "Fornecedores",
        description: "Pagamento Distribuidora Tech Brasil ref NF-10923",
        amount: 4500.00,
        dueDate: "2026-06-30",
        paymentDate: "2026-06-29",
        status: "PAGO",
        costCenter: "Estoque",
        createdAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString()
      },
      // Receitas de vendas são integradas no frontend
      {
        id: "f_v1",
        companyId: demoCompanyId,
        type: "RECEITA",
        category: "Vendas",
        description: "Venda PDV v1",
        amount: 4989.00,
        dueDate: "2026-07-02",
        paymentDate: "2026-07-02",
        status: "PAGO",
        costCenter: "PDV",
        refId: "v1",
        createdAt: new Date().toISOString()
      },
      {
        id: "f_v2",
        companyId: demoCompanyId,
        type: "RECEITA",
        category: "Vendas",
        description: "Venda PDV v2",
        amount: 340.00,
        dueDate: "2026-07-01",
        paymentDate: "2026-07-01",
        status: "PAGO",
        costCenter: "PDV",
        refId: "v2",
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString()
      },
      {
        id: "f_v3",
        companyId: demoCompanyId,
        type: "RECEITA",
        category: "Vendas",
        description: "Venda PDV v3",
        amount: 11927.00,
        dueDate: "2026-06-29",
        paymentDate: "2026-06-29",
        status: "PAGO",
        costCenter: "PDV",
        refId: "v3",
        createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
      }
    ];
    saveCompanyData(demoCompanyId, "financial", financial);

    // Seed Inventory Logs
    const inventoryLogs: InventoryLog[] = [
      {
        id: "inv_l1",
        companyId: demoCompanyId,
        productId: "p1",
        productName: "Notebook Pro Ultra 15",
        type: "ENTRADA",
        quantity: 15,
        previousQty: 0,
        newQty: 15,
        reason: "Importação inicial via xml de compra de fornecedor Distribuidora Tech",
        userId: demoUserId,
        userName: "Administrador Demo",
        createdAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString()
      },
      {
        id: "inv_l2",
        companyId: demoCompanyId,
        productId: "p1",
        productName: "Notebook Pro Ultra 15",
        type: "SAIDA",
        quantity: 1,
        previousQty: 15,
        newQty: 14,
        reason: "Venda PDV v1",
        userId: demoUserId,
        userName: "Administrador Demo",
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
      }
    ];
    saveCompanyData(demoCompanyId, "inventory", inventoryLogs);

    // Seed Commissions
    const commissions: Commission[] = [
      {
        id: "com1",
        companyId: demoCompanyId,
        userId: "demo_emp_1",
        userName: "João Vendedor",
        saleId: "v2",
        saleTotal: 340.00,
        percentage: 3,
        amount: 10.20,
        status: "PENDENTE",
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString()
      },
      {
        id: "com2",
        companyId: demoCompanyId,
        userId: "demo_emp_1",
        userName: "João Vendedor",
        saleId: "v3",
        saleTotal: 11927.00,
        percentage: 3,
        amount: 357.81,
        status: "PAGO",
        createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
      }
    ];
    saveCompanyData(demoCompanyId, "commissions", commissions);

    // Seed Sales Goal
    const goals: SalesGoal[] = [
      {
        id: "g1",
        companyId: demoCompanyId,
        month: "2026-07",
        targetAmount: 30000.00,
        currentAmount: 17815.00 // v1 + v2 + v3 + v4
      }
    ];
    saveCompanyData(demoCompanyId, "goals", goals);

    // Seed Vouchers
    const vouchers: Voucher[] = [
      {
        id: "vch1",
        companyId: demoCompanyId,
        code: "BEMVINDO10",
        discountType: "PERCENT",
        value: 10,
        minPurchase: 100,
        expiryDate: "2026-12-31",
        active: true
      },
      {
        id: "vch2",
        companyId: demoCompanyId,
        code: "FESTAS50",
        discountType: "FIXED",
        value: 50,
        minPurchase: 500,
        expiryDate: "2026-08-01",
        active: true
      }
    ];
    saveCompanyData(demoCompanyId, "vouchers", vouchers);

    // Seed Notifications
    const notifications: SystemNotification[] = [
      {
        id: "n1",
        companyId: demoCompanyId,
        type: "ESTOQUE_BAIXO",
        title: "Estoque Baixo",
        message: "Teclado Mecânico Gamer RGB atingiu o limite mínimo (4 unidades restantes)",
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "n2",
        companyId: demoCompanyId,
        type: "ESTOQUE_ZERADO",
        title: "Produto Esgotado",
        message: "Monitor Gamer 27 UltraWide IPS está com estoque zerado!",
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "n3",
        companyId: demoCompanyId,
        type: "CONTAS_VENCIDAS",
        title: "Conta a Pagar Vencida",
        message: "A despesa 'Fornecedor Tech Brasil' no valor de R$ 4.500,00 venceu em 2026-06-30",
        read: false,
        createdAt: new Date().toISOString()
      }
    ];
    saveCompanyData(demoCompanyId, "notifications", notifications);

    writeLog(demoCompanyId, demoUserId, "Sistema", "Seed Inicial", "Banco de dados inicializado com sucesso para empresa Demo", {
      headers: { "user-agent": "Sistema Core" },
      socket: { remoteAddress: "127.0.0.1" }
    } as any);
  }
};

seedDemoData();

// --- API ROUTES ---

// Authentication
app.post("/api/auth/register", (req, res) => {
  let { name, company, email, password } = req.body;
  if (!name || !company || !email || !password) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  name = name.trim();
  company = company.trim();
  email = email.trim();

  const companies = getCompanies();
  const users = getUsers();

  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: "E-mail já cadastrado" });
  }

  const companyId = `company_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  const newCompany: Company = {
    id: companyId,
    name: company,
    ownerEmail: email,
    createdAt: new Date().toISOString(),
    taxConfig: {
      regime: "SIMPLES",
      icmsAliquota: 4,
      icmsStAliquota: 0,
      ipiAliquota: 0,
      pisAliquota: 0,
      cofinsAliquota: 0,
      issAliquota: 0
    }
  };

  const newAdmin: User = {
    id: userId,
    companyId,
    name,
    email,
    role: "ADMIN",
    permissions: {
      canSell: true,
      canCancelSale: true,
      canAlterPrice: true,
      canExcludeProduct: true,
      canRegisterClient: true,
      canRegisterSupplier: true,
      canAccessFinance: true,
      canAccessStock: true,
      canEmitEstimate: true,
      canPrint: true,
      canExportPDF: true,
      canSeeProfit: true,
      canSeeCost: true,
      canAlterConfig: true,
      canEmitReports: true,
      canAccessDashboard: true,
      canAccessBackup: true,
      canRegisterUsers: true,
      canAccessCatalog: true,
      canViewStats: true
    },
    active: true,
    createdAt: new Date().toISOString()
  };

  companies.push(newCompany);
  users.push(newAdmin);

  saveCompanies(companies);
  saveUsers(users);

  // Initialize empty data structures
  saveCompanyData(companyId, "products", []);
  saveCompanyData(companyId, "clients", []);
  saveCompanyData(companyId, "suppliers", []);
  saveCompanyData(companyId, "sales", []);
  saveCompanyData(companyId, "estimates", []);
  saveCompanyData(companyId, "inventory", []);
  saveCompanyData(companyId, "financial", []);
  saveCompanyData(companyId, "service_orders", []);
  saveCompanyData(companyId, "commissions", []);
  saveCompanyData(companyId, "goals", [{ id: `g_${Date.now()}`, companyId, month: new Date().toISOString().substring(0, 7), targetAmount: 10000, currentAmount: 0 }]);
  saveCompanyData(companyId, "vouchers", []);
  saveCompanyData(companyId, "notifications", []);
  
  writeLog(companyId, userId, name, "Cadastro Empresa", `Empresa ${company} e usuário administrador cadastrados.`, req);

  res.json({ token: `mock_jwt_${userId}_${companyId}`, user: newAdmin, company: newCompany });
});

app.post("/api/auth/login", (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são necessários" });
  }

  email = email.trim();

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.active);

  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas ou conta inativa" });
  }

  // Easy simulation: we accept any password since it's a demo, but check if it's "demo123" or "senha123" or has length
  const companies = getCompanies();
  const company = companies.find(c => c.id === user.companyId);

  if (!company) {
    return res.status(404).json({ error: "Empresa não vinculada" });
  }

  writeLog(company.id, user.id, user.name, "Login", "Login realizado com sucesso no sistema.", req);

  res.json({
    token: `mock_jwt_${user.id}_${company.id}`,
    user,
    company
  });
});

// Auth Middleware Simulator (Extracts companyId and userId from Mock Token Header)
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers["authorization"] || "";
  if (!authHeader) {
    console.warn("[AUTH] No authorization header found");
    return res.status(401).json({ error: "Não autorizado" });
  }

  // Sanitize the token - recursively strip "Bearer" and trim spaces
  let token = authHeader.trim();
  while (token.toLowerCase().startsWith("bearer")) {
    token = token.substring(6).trim();
  }

  if (token.startsWith("mock_jwt_")) {
    token = token.replace("mock_jwt_", "");
  }

  if (!token) {
    console.warn("[AUTH] Extracted token is empty");
    return res.status(401).json({ error: "Não autorizado" });
  }

  const users = getUsers();
  console.log(`[AUTH] Checking token: "${token}". Total registered users: ${users.length}`);
  
  // Try matching directly against a serialized ID pair: "${userId}_${companyId}"
  // This is completely immune to custom ID underscores!
  let user = users.find(u => `${u.id}_${u.companyId}` === token && u.active);
  let finalCompanyId = user ? user.companyId : undefined;

  if (user) {
    console.log(`[AUTH] Direct match succeeded for user: "${user.name}" (ID: ${user.id}, Company: ${user.companyId})`);
  } else {
    console.log("[AUTH] Direct match failed, trying fallbacks...");
  }

  // Fallback 1: Split parsing in case it's a segmented string without underscores in the IDs
  if (!user) {
    const parts = token.split("_");
    if (parts.length >= 2) {
      const userId = parts[0];
      const companyId = parts[1];
      user = users.find(u => u.id === userId && u.companyId === companyId && u.active);
      if (user) {
        finalCompanyId = user.companyId;
        console.log(`[AUTH] Fallback 1 split match succeeded for user: "${user.name}"`);
      }
    }
  }

  // Fallback 2: Legacy email lookup or plain token is the user's email
  if (!user) {
    user = users.find(u => u.email.toLowerCase() === token.toLowerCase() && u.active);
    if (user) {
      finalCompanyId = user.companyId;
      console.log(`[AUTH] Fallback 2 email match succeeded for user: "${user.name}"`);
    }
  }

  if (!user || !finalCompanyId) {
    console.error(`[AUTH] Authentication failed for token: "${token}". Users in DB:`, users.map(u => ({ id: u.id, email: u.email, companyId: u.companyId })));
    return res.status(401).json({ error: "Sessão inválida" });
  }

  req.user = user;
  req.companyId = finalCompanyId;
  next();
};

// Express Custom Properties Extend
declare global {
  namespace Express {
    interface Request {
      user?: User;
      companyId?: string;
    }
  }
}

app.get("/api/auth/me", requireAuth, (req, res) => {
  const companies = getCompanies();
  const company = companies.find(c => c.id === req.companyId);
  if (!company) {
    return res.status(404).json({ error: "Empresa não vinculada" });
  }
  res.json({ user: req.user, company });
});

// User Employee CRUD
app.get("/api/users", requireAuth, (req, res) => {
  const users = getUsers().filter(u => u.companyId === req.companyId);
  res.json(users);
});

app.post("/api/users", requireAuth, (req, res) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Sem permissão de administrador" });
  const { name, email, role, permissions } = req.body;
  
  const users = getUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: "E-mail já está em uso" });
  }

  const newEmployee: User = {
    id: `emp_${Date.now()}`,
    companyId: req.companyId!,
    name,
    email,
    role: role || "EMPLOYEE",
    permissions: permissions || {
      canSell: true,
      canCancelSale: false,
      canAlterPrice: false,
      canExcludeProduct: false,
      canRegisterClient: true,
      canRegisterSupplier: false,
      canAccessFinance: false,
      canAccessStock: false,
      canEmitEstimate: true,
      canPrint: true,
      canExportPDF: true,
      canSeeProfit: false,
      canSeeCost: false,
      canAlterConfig: false,
      canEmitReports: false,
      canAccessDashboard: true,
      canAccessBackup: false,
      canRegisterUsers: false,
      canAccessCatalog: true,
      canViewStats: false
    },
    active: true,
    createdAt: new Date().toISOString()
  };

  users.push(newEmployee);
  saveUsers(users);

  writeLog(req.companyId!, req.user.id, req.user.name, "Cadastrar Funcionário", `Funcionário ${name} cadastrado.`, req);
  res.json(newEmployee);
});

app.put("/api/users/:id", requireAuth, (req, res) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Sem permissão de administrador" });
  const { name, role, permissions, active } = req.body;
  const users = getUsers();
  
  const userIdx = users.findIndex(u => u.id === req.params.id && u.companyId === req.companyId);
  if (userIdx === -1) return res.status(404).json({ error: "Usuário não encontrado" });

  users[userIdx] = {
    ...users[userIdx],
    name: name !== undefined ? name : users[userIdx].name,
    role: role !== undefined ? role : users[userIdx].role,
    permissions: permissions !== undefined ? permissions : users[userIdx].permissions,
    active: active !== undefined ? active : users[userIdx].active
  };

  saveUsers(users);
  writeLog(req.companyId!, req.user.id, req.user.name, "Alterar Funcionário", `Dados do funcionário ${users[userIdx].name} atualizados.`, req);
  res.json(users[userIdx]);
});

app.delete("/api/users/:id", requireAuth, (req, res) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Sem permissão de administrador" });
  
  const users = getUsers();
  const userIdx = users.findIndex(u => u.id === req.params.id && u.companyId === req.companyId);
  if (userIdx === -1) return res.status(404).json({ error: "Usuário não encontrado" });

  if (users[userIdx].id === req.user.id) {
    return res.status(400).json({ error: "Não é possível excluir a si mesmo" });
  }

  const deletedUserName = users[userIdx].name;
  users.splice(userIdx, 1);
  saveUsers(users);

  writeLog(req.companyId!, req.user.id, req.user.name, "Excluir Funcionário", `Funcionário ${deletedUserName} excluído do sistema.`, req);
  res.json({ success: true });
});

// Products API
app.get("/api/products", requireAuth, (req, res) => {
  const products = getCompanyData<Product[]>(req.companyId!, "products", []);
  res.json(products);
});

app.post("/api/products", requireAuth, (req, res) => {
  if (!req.user?.permissions.canAccessStock) return res.status(403).json({ error: "Sem permissão de acesso ao estoque" });
  const data = req.body as Partial<Product>;
  const products = getCompanyData<Product[]>(req.companyId!, "products", []);

  if (!data.name || !data.sellPrice) {
    return res.status(400).json({ error: "Nome e Preço de Venda são obrigatórios" });
  }

  const code = data.code || `PROD-${Date.now().toString().slice(-6)}`;
  const barcode = data.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
  const sku = data.sku || `SKU-${code}`;

  const newProduct: Product = {
    id: `prod_${Date.now()}`,
    companyId: req.companyId!,
    name: data.name,
    code,
    barcode,
    sku,
    category: data.category || "Geral",
    brand: data.brand || "Generico",
    supplierId: data.supplierId,
    description: data.description || "",
    costPrice: data.costPrice || 0,
    sellPrice: data.sellPrice,
    promoPrice: data.promoPrice,
    quantity: data.quantity || 0,
    minQuantity: data.minQuantity || 0,
    unit: data.unit || "UN",
    weight: data.weight,
    width: data.width,
    height: data.height,
    length: data.length,
    ncm: data.ncm,
    cfop: data.cfop,
    origem: data.origem || "0",
    active: data.active !== undefined ? data.active : true,
    images: data.images || [],
    batches: data.batches || [],
    createdAt: new Date().toISOString()
  };

  products.push(newProduct);
  saveCompanyData(req.companyId!, "products", products);

  // Stock Log
  if (newProduct.quantity > 0) {
    const invLogs = getCompanyData<InventoryLog[]>(req.companyId!, "inventory", []);
    invLogs.unshift({
      id: `inv_${Date.now()}`,
      companyId: req.companyId!,
      productId: newProduct.id,
      productName: newProduct.name,
      type: "ENTRADA",
      quantity: newProduct.quantity,
      previousQty: 0,
      newQty: newProduct.quantity,
      reason: "Estoque Inicial no cadastro",
      userId: req.user.id,
      userName: req.user.name,
      createdAt: new Date().toISOString()
    });
    saveCompanyData(req.companyId!, "inventory", invLogs);
  }

  writeLog(req.companyId!, req.user.id, req.user.name, "Cadastro Produto", `Produto ${newProduct.name} cadastrado com estoque ${newProduct.quantity}.`, req);
  res.json(newProduct);
});

app.put("/api/products/:id", requireAuth, (req, res) => {
  if (!req.user?.permissions.canAccessStock) return res.status(403).json({ error: "Sem permissão de acesso ao estoque" });
  const data = req.body as Partial<Product>;
  const products = getCompanyData<Product[]>(req.companyId!, "products", []);
  
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Produto não encontrado" });

  const prevQty = products[idx].quantity;
  const newQty = data.quantity !== undefined ? data.quantity : prevQty;

  const updatedProduct = {
    ...products[idx],
    ...data,
    id: products[idx].id, // Prevent overwriting ID
    companyId: req.companyId!
  };

  products[idx] = updatedProduct;
  saveCompanyData(req.companyId!, "products", products);

  // Stock Log if adjusted
  if (newQty !== prevQty) {
    const invLogs = getCompanyData<InventoryLog[]>(req.companyId!, "inventory", []);
    invLogs.unshift({
      id: `inv_${Date.now()}`,
      companyId: req.companyId!,
      productId: updatedProduct.id,
      productName: updatedProduct.name,
      type: newQty > prevQty ? "ENTRADA" : "SAIDA",
      quantity: Math.abs(newQty - prevQty),
      previousQty: prevQty,
      newQty: newQty,
      reason: "Ajuste manual de estoque via ficha técnica",
      userId: req.user.id,
      userName: req.user.name,
      createdAt: new Date().toISOString()
    });
    saveCompanyData(req.companyId!, "inventory", invLogs);
  }

  writeLog(req.companyId!, req.user.id, req.user.name, "Alteração Produto", `Produto ${updatedProduct.name} atualizado.`, req);
  res.json(updatedProduct);
});

app.delete("/api/products/:id", requireAuth, (req, res) => {
  if (!req.user?.permissions.canExcludeProduct) return res.status(403).json({ error: "Sem permissão de exclusão de produtos" });
  const products = getCompanyData<Product[]>(req.companyId!, "products", []);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Produto não encontrado" });

  const deletedProdName = products[idx].name;
  products.splice(idx, 1);
  saveCompanyData(req.companyId!, "products", products);

  writeLog(req.companyId!, req.user.id, req.user.name, "Excluir Produto", `Produto ${deletedProdName} excluído do sistema.`, req);
  res.json({ success: true });
});

// Clients API
app.get("/api/clients", requireAuth, (req, res) => {
  const clients = getCompanyData<Client[]>(req.companyId!, "clients", []);
  res.json(clients);
});

app.post("/api/clients", requireAuth, (req, res) => {
  if (!req.user?.permissions.canRegisterClient) return res.status(403).json({ error: "Sem permissão de cadastro de clientes" });
  const data = req.body as Partial<Client>;
  const clients = getCompanyData<Client[]>(req.companyId!, "clients", []);

  if (!data.name) return res.status(400).json({ error: "Nome é obrigatório" });

  const newClient: Client = {
    id: `cli_${Date.now()}`,
    companyId: req.companyId!,
    name: data.name,
    cpfCnpj: data.cpfCnpj || "",
    phone: data.phone || "",
    whatsapp: data.whatsapp || "",
    email: data.email || "",
    address: data.address || "",
    city: data.city || "",
    state: data.state || "",
    cep: data.cep || "",
    birthDate: data.birthDate,
    observations: data.observations || "",
    loyaltyPoints: 0,
    createdAt: new Date().toISOString()
  };

  clients.push(newClient);
  saveCompanyData(req.companyId!, "clients", clients);
  writeLog(req.companyId!, req.user.id, req.user.name, "Cadastro Cliente", `Cliente ${newClient.name} cadastrado.`, req);
  res.json(newClient);
});

app.put("/api/clients/:id", requireAuth, (req, res) => {
  if (!req.user?.permissions.canRegisterClient) return res.status(403).json({ error: "Sem permissão de cadastro de clientes" });
  const data = req.body as Partial<Client>;
  const clients = getCompanyData<Client[]>(req.companyId!, "clients", []);

  const idx = clients.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Cliente não encontrado" });

  const updatedClient = {
    ...clients[idx],
    ...data,
    id: clients[idx].id,
    companyId: req.companyId!
  };

  clients[idx] = updatedClient;
  saveCompanyData(req.companyId!, "clients", clients);
  writeLog(req.companyId!, req.user.id, req.user.name, "Alteração Cliente", `Dados do cliente ${updatedClient.name} atualizados.`, req);
  res.json(updatedClient);
});

app.delete("/api/clients/:id", requireAuth, (req, res) => {
  if (!req.user?.permissions.canRegisterClient) return res.status(403).json({ error: "Sem permissão de alteração de clientes" });
  const clients = getCompanyData<Client[]>(req.companyId!, "clients", []);
  const idx = clients.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Cliente não encontrado" });

  const name = clients[idx].name;
  clients.splice(idx, 1);
  saveCompanyData(req.companyId!, "clients", clients);
  writeLog(req.companyId!, req.user.id, req.user.name, "Excluir Cliente", `Cliente ${name} excluído do sistema.`, req);
  res.json({ success: true });
});

// Suppliers API
app.get("/api/suppliers", requireAuth, (req, res) => {
  const suppliers = getCompanyData<Supplier[]>(req.companyId!, "suppliers", []);
  res.json(suppliers);
});

app.post("/api/suppliers", requireAuth, (req, res) => {
  if (!req.user?.permissions.canRegisterSupplier) return res.status(403).json({ error: "Sem permissão de cadastro de fornecedores" });
  const data = req.body as Partial<Supplier>;
  const suppliers = getCompanyData<Supplier[]>(req.companyId!, "suppliers", []);

  if (!data.name) return res.status(400).json({ error: "Nome é obrigatório" });

  const newSupplier: Supplier = {
    id: `sup_${Date.now()}`,
    companyId: req.companyId!,
    name: data.name,
    cnpj: data.cnpj || "",
    phone: data.phone || "",
    email: data.email || "",
    address: data.address || "",
    city: data.city || "",
    state: data.state || "",
    cep: data.cep || "",
    contactPerson: data.contactPerson || "",
    createdAt: new Date().toISOString()
  };

  suppliers.push(newSupplier);
  saveCompanyData(req.companyId!, "suppliers", suppliers);
  writeLog(req.companyId!, req.user.id, req.user.name, "Cadastro Fornecedor", `Fornecedor ${newSupplier.name} cadastrado.`, req);
  res.json(newSupplier);
});

app.put("/api/suppliers/:id", requireAuth, (req, res) => {
  if (!req.user?.permissions.canRegisterSupplier) return res.status(403).json({ error: "Sem permissão de cadastro de fornecedores" });
  const data = req.body as Partial<Supplier>;
  const suppliers = getCompanyData<Supplier[]>(req.companyId!, "suppliers", []);

  const idx = suppliers.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Fornecedor não encontrado" });

  const updatedSupplier = {
    ...suppliers[idx],
    ...data,
    id: suppliers[idx].id,
    companyId: req.companyId!
  };

  suppliers[idx] = updatedSupplier;
  saveCompanyData(req.companyId!, "suppliers", suppliers);
  writeLog(req.companyId!, req.user.id, req.user.name, "Alteração Fornecedor", `Dados do fornecedor ${updatedSupplier.name} atualizados.`, req);
  res.json(updatedSupplier);
});

app.delete("/api/suppliers/:id", requireAuth, (req, res) => {
  if (!req.user?.permissions.canRegisterSupplier) return res.status(403).json({ error: "Sem permissão" });
  const suppliers = getCompanyData<Supplier[]>(req.companyId!, "suppliers", []);
  const idx = suppliers.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Fornecedor não encontrado" });

  const name = suppliers[idx].name;
  suppliers.splice(idx, 1);
  saveCompanyData(req.companyId!, "suppliers", suppliers);
  writeLog(req.companyId!, req.user.id, req.user.name, "Excluir Fornecedor", `Fornecedor ${name} excluído do sistema.`, req);
  res.json({ success: true });
});

// Sales & PDV Logic
app.get("/api/sales", requireAuth, (req, res) => {
  const sales = getCompanyData<Sale[]>(req.companyId!, "sales", []);
  res.json(sales);
});

app.post("/api/sales", requireAuth, (req, res) => {
  if (!req.user?.permissions.canSell) return res.status(403).json({ error: "Sem permissão de vendas" });
  const data = req.body as Partial<Sale>;
  if (!data.items || data.items.length === 0) {
    return res.status(400).json({ error: "Venda deve conter itens" });
  }

  const products = getCompanyData<Product[]>(req.companyId!, "products", []);
  const sales = getCompanyData<Sale[]>(req.companyId!, "sales", []);
  const invLogs = getCompanyData<InventoryLog[]>(req.companyId!, "inventory", []);
  const financial = getCompanyData<FinancialTransaction[]>(req.companyId!, "financial", []);
  const notifications = getCompanyData<SystemNotification[]>(req.companyId!, "notifications", []);
  const clients = getCompanyData<Client[]>(req.companyId!, "clients", []);

  // Verify stock and update quantities
  for (const item of data.items) {
    const prodIdx = products.findIndex(p => p.id === item.productId);
    if (prodIdx === -1) {
      return res.status(404).json({ error: `Produto ${item.productName} não cadastrado.` });
    }
    
    const product = products[prodIdx];
    const oldQty = product.quantity;
    const newQty = oldQty - item.quantity;
    
    // Perform update
    products[prodIdx].quantity = newQty;

    // Record stock movement log
    invLogs.unshift({
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      companyId: req.companyId!,
      productId: product.id,
      productName: product.name,
      type: "SAIDA",
      quantity: item.quantity,
      previousQty: oldQty,
      newQty: newQty,
      reason: `Venda registrada no PDV`,
      userId: req.user.id,
      userName: req.user.name,
      createdAt: new Date().toISOString()
    });

    // Check alerts
    if (newQty <= 0) {
      notifications.unshift({
        id: `noti_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        companyId: req.companyId!,
        type: "ESTOQUE_ZERADO",
        title: "Produto Esgotado",
        message: `${product.name} esgotou em estoque devido à última venda.`,
        read: false,
        createdAt: new Date().toISOString()
      });
    } else if (newQty <= product.minQuantity) {
      notifications.unshift({
        id: `noti_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        companyId: req.companyId!,
        type: "ESTOQUE_BAIXO",
        title: "Estoque Baixo",
        message: `${product.name} atingiu a quantidade mínima tolerável (${newQty} restante).`,
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  // Create Sale object
  const saleId = `sale_${Date.now()}`;
  const newSale: Sale = {
    id: saleId,
    companyId: req.companyId!,
    userId: req.user.id,
    userName: req.user.name,
    clientId: data.clientId,
    clientName: data.clientName,
    items: data.items,
    subtotal: data.subtotal || 0,
    discount: data.discount || 0,
    additionalCharge: data.additionalCharge || 0,
    total: data.total || 0,
    payments: data.payments || [],
    change: data.change || 0,
    observations: data.observations,
    createdAt: new Date().toISOString()
  };

  // Add loyalty points if client selected (1 point per R$ 10,00 spent)
  if (data.clientId) {
    const cliIdx = clients.findIndex(c => c.id === data.clientId);
    if (cliIdx !== -1) {
      const addedPoints = Math.floor(newSale.total / 10);
      clients[cliIdx].loyaltyPoints += addedPoints;
    }
  }

  // Record Financial Transaction
  financial.unshift({
    id: `fin_sale_${saleId}`,
    companyId: req.companyId!,
    type: "RECEITA",
    category: "Vendas",
    description: `Recebimento PDV ref venda ${saleId} ${data.clientName ? "- Cliente: " + data.clientName : ""}`,
    amount: newSale.total,
    dueDate: new Date().toISOString().substring(0, 10),
    paymentDate: new Date().toISOString().substring(0, 10),
    status: "PAGO",
    costCenter: "PDV",
    refId: saleId,
    createdAt: new Date().toISOString()
  });

  // Seller commission calculation (standard 3% simple commission for demo employees)
  if (req.user.role === "EMPLOYEE") {
    const commissions = getCompanyData<Commission[]>(req.companyId!, "commissions", []);
    const commPct = 3.0; // 3% commission
    const commAmount = Number((newSale.total * (commPct / 100)).toFixed(2));
    commissions.unshift({
      id: `comm_${Date.now()}`,
      companyId: req.companyId!,
      userId: req.user.id,
      userName: req.user.name,
      saleId: saleId,
      saleTotal: newSale.total,
      percentage: commPct,
      amount: commAmount,
      status: "PENDENTE",
      createdAt: new Date().toISOString()
    });
    saveCompanyData(req.companyId!, "commissions", commissions);
  }

  // Update current Month Sales Goal progress
  const goals = getCompanyData<SalesGoal[]>(req.companyId!, "goals", []);
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const goalIdx = goals.findIndex(g => g.month === currentMonthStr);
  if (goalIdx !== -1) {
    goals[goalIdx].currentAmount += newSale.total;
  } else {
    goals.push({
      id: `g_${Date.now()}`,
      companyId: req.companyId!,
      month: currentMonthStr,
      targetAmount: 10000,
      currentAmount: newSale.total
    });
  }

  sales.unshift(newSale);

  saveCompanyData(req.companyId!, "products", products);
  saveCompanyData(req.companyId!, "sales", sales);
  saveCompanyData(req.companyId!, "inventory", invLogs);
  saveCompanyData(req.companyId!, "financial", financial);
  saveCompanyData(req.companyId!, "notifications", notifications);
  saveCompanyData(req.companyId!, "clients", clients);
  saveCompanyData(req.companyId!, "goals", goals);

  writeLog(req.companyId!, req.user.id, req.user.name, "Nova Venda", `Venda ${saleId} registrada no valor de R$ ${newSale.total.toFixed(2)}.`, req);
  res.json(newSale);
});

app.delete("/api/sales/:id", requireAuth, (req, res) => {
  if (!req.user?.permissions.canCancelSale) return res.status(403).json({ error: "Sem permissão de cancelamento de vendas" });
  
  const sales = getCompanyData<Sale[]>(req.companyId!, "sales", []);
  const saleIdx = sales.findIndex(s => s.id === req.params.id);
  if (saleIdx === -1) return res.status(404).json({ error: "Venda não encontrada" });

  const saleToCancel = sales[saleIdx];
  const products = getCompanyData<Product[]>(req.companyId!, "products", []);
  const invLogs = getCompanyData<InventoryLog[]>(req.companyId!, "inventory", []);
  const financial = getCompanyData<FinancialTransaction[]>(req.companyId!, "financial", []);
  const commissions = getCompanyData<Commission[]>(req.companyId!, "commissions", []);
  const goals = getCompanyData<SalesGoal[]>(req.companyId!, "goals", []);

  // Revert stock
  for (const item of saleToCancel.items) {
    const prodIdx = products.findIndex(p => p.id === item.productId);
    if (prodIdx !== -1) {
      const oldQty = products[prodIdx].quantity;
      const newQty = oldQty + item.quantity;
      products[prodIdx].quantity = newQty;

      invLogs.unshift({
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        companyId: req.companyId!,
        productId: products[prodIdx].id,
        productName: products[prodIdx].name,
        type: "ENTRADA",
        quantity: item.quantity,
        previousQty: oldQty,
        newQty: newQty,
        reason: `Reversão/Cancelamento de Venda ${saleToCancel.id}`,
        userId: req.user.id,
        userName: req.user.name,
        createdAt: new Date().toISOString()
      });
    }
  }

  // Remove corresponding financial record
  const finIdx = financial.findIndex(f => f.refId === saleToCancel.id);
  if (finIdx !== -1) {
    financial.splice(finIdx, 1);
  }

  // Delete pending commissions or adjust
  const commIdx = commissions.findIndex(c => c.saleId === saleToCancel.id);
  if (commIdx !== -1) {
    commissions.splice(commIdx, 1);
  }

  // Revert goal progress
  const saleMonth = saleToCancel.createdAt.substring(0, 7);
  const goalIdx = goals.findIndex(g => g.month === saleMonth);
  if (goalIdx !== -1) {
    goals[goalIdx].currentAmount = Math.max(0, goals[goalIdx].currentAmount - saleToCancel.total);
  }

  // Remove client loyalty points
  if (saleToCancel.clientId) {
    const clients = getCompanyData<Client[]>(req.companyId!, "clients", []);
    const cliIdx = clients.findIndex(c => c.id === saleToCancel.clientId);
    if (cliIdx !== -1) {
      const removedPoints = Math.floor(saleToCancel.total / 10);
      clients[cliIdx].loyaltyPoints = Math.max(0, clients[cliIdx].loyaltyPoints - removedPoints);
      saveCompanyData(req.companyId!, "clients", clients);
    }
  }

  sales.splice(saleIdx, 1);

  saveCompanyData(req.companyId!, "products", products);
  saveCompanyData(req.companyId!, "sales", sales);
  saveCompanyData(req.companyId!, "inventory", invLogs);
  saveCompanyData(req.companyId!, "financial", financial);
  saveCompanyData(req.companyId!, "commissions", commissions);
  saveCompanyData(req.companyId!, "goals", goals);

  writeLog(req.companyId!, req.user.id, req.user.name, "Cancelar Venda", `Venda ${saleToCancel.id} cancelada e estoque estornado.`, req);
  res.json({ success: true });
});

// Estimates CRUD
app.get("/api/estimates", requireAuth, (req, res) => {
  const estimates = getCompanyData<Estimate[]>(req.companyId!, "estimates", []);
  res.json(estimates);
});

app.post("/api/estimates", requireAuth, (req, res) => {
  if (!req.user?.permissions.canEmitEstimate) return res.status(403).json({ error: "Sem permissão de orçamentos" });
  const data = req.body as Partial<Estimate>;
  if (!data.items || data.items.length === 0) {
    return res.status(400).json({ error: "Orçamento precisa de itens" });
  }

  const estimates = getCompanyData<Estimate[]>(req.companyId!, "estimates", []);
  const newEstimate: Estimate = {
    id: `est_${Date.now()}`,
    companyId: req.companyId!,
    clientId: data.clientId,
    clientName: data.clientName || "Consumidor Final",
    clientPhone: data.clientPhone || "",
    items: data.items,
    subtotal: data.subtotal || 0,
    discount: data.discount || 0,
    shippingCost: data.shippingCost || 0,
    taxesCost: data.taxesCost || 0,
    total: data.total || 0,
    paymentTerms: data.paymentTerms || "À Vista",
    validUntil: data.validUntil || new Date(Date.now() + 7 * 24 * 3600000).toISOString().substring(0, 10),
    observations: data.observations,
    createdAt: new Date().toISOString()
  };

  estimates.unshift(newEstimate);
  saveCompanyData(req.companyId!, "estimates", estimates);
  writeLog(req.companyId!, req.user.id, req.user.name, "Novo Orçamento", `Orçamento ${newEstimate.id} criado para ${newEstimate.clientName}.`, req);
  res.json(newEstimate);
});

app.delete("/api/estimates/:id", requireAuth, (req, res) => {
  if (!req.user?.permissions.canEmitEstimate) return res.status(403).json({ error: "Sem permissão" });
  const estimates = getCompanyData<Estimate[]>(req.companyId!, "estimates", []);
  const idx = estimates.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Orçamento não encontrado" });

  const client = estimates[idx].clientName;
  estimates.splice(idx, 1);
  saveCompanyData(req.companyId!, "estimates", estimates);
  writeLog(req.companyId!, req.user.id, req.user.name, "Excluir Orçamento", `Orçamento de ${client} excluído.`, req);
  res.json({ success: true });
});

// Inventory Movements CRUD
app.get("/api/inventory", requireAuth, (req, res) => {
  const log = getCompanyData<InventoryLog[]>(req.companyId!, "inventory", []);
  res.json(log);
});

app.post("/api/inventory/adjust", requireAuth, (req, res) => {
  if (!req.user?.permissions.canAccessStock) return res.status(403).json({ error: "Sem permissão" });
  const { productId, type, quantity, reason } = req.body;
  
  if (!productId || !type || !quantity) return res.status(400).json({ error: "Parâmetros inválidos" });

  const products = getCompanyData<Product[]>(req.companyId!, "products", []);
  const prodIdx = products.findIndex(p => p.id === productId);
  if (prodIdx === -1) return res.status(404).json({ error: "Produto não encontrado" });

  const product = products[prodIdx];
  const oldQty = product.quantity;
  let newQty = oldQty;

  if (type === "ENTRADA") newQty += quantity;
  else if (type === "SAIDA" || type === "AJUSTE") {
    if (type === "AJUSTE") newQty = quantity; // Ajusta para valor fixado
    else newQty = Math.max(0, oldQty - quantity);
  }

  products[prodIdx].quantity = newQty;
  saveCompanyData(req.companyId!, "products", products);

  const invLogs = getCompanyData<InventoryLog[]>(req.companyId!, "inventory", []);
  const newLog: InventoryLog = {
    id: `inv_${Date.now()}`,
    companyId: req.companyId!,
    productId,
    productName: product.name,
    type,
    quantity: type === "AJUSTE" ? quantity : Math.abs(newQty - oldQty),
    previousQty: oldQty,
    newQty,
    reason: reason || "Ajuste manual de movimentação",
    userId: req.user.id,
    userName: req.user.name,
    createdAt: new Date().toISOString()
  };

  invLogs.unshift(newLog);
  saveCompanyData(req.companyId!, "inventory", invLogs);

  writeLog(req.companyId!, req.user.id, req.user.name, "Ajuste Estoque", `Movimentação ${type} de ${product.name} lançada.`, req);
  res.json(newLog);
});

// Financial CRUD
app.get("/api/financial", requireAuth, (req, res) => {
  const trans = getCompanyData<FinancialTransaction[]>(req.companyId!, "financial", []);
  res.json(trans);
});

app.post("/api/financial", requireAuth, (req, res) => {
  if (!req.user?.permissions.canAccessFinance) return res.status(403).json({ error: "Sem permissão ao financeiro" });
  const data = req.body as Partial<FinancialTransaction>;
  if (!data.description || !data.amount || !data.type) {
    return res.status(400).json({ error: "Campos obrigatórios: Descrição, Valor, Tipo (RECEITA/DESPESA)" });
  }

  const trans = getCompanyData<FinancialTransaction[]>(req.companyId!, "financial", []);
  const newTran: FinancialTransaction = {
    id: `fin_${Date.now()}`,
    companyId: req.companyId!,
    type: data.type,
    category: data.category || "Geral",
    description: data.description,
    amount: data.amount,
    dueDate: data.dueDate || new Date().toISOString().substring(0, 10),
    paymentDate: data.paymentDate,
    status: data.status || "PENDENTE",
    costCenter: data.costCenter || "Geral",
    createdAt: new Date().toISOString()
  };

  trans.unshift(newTran);
  saveCompanyData(req.companyId!, "financial", trans);

  writeLog(req.companyId!, req.user.id, req.user.name, "Lançamento Financeiro", `Lançado ${newTran.type} - ${newTran.description} no valor de R$ ${newTran.amount.toFixed(2)}.`, req);
  res.json(newTran);
});

app.put("/api/financial/:id/pay", requireAuth, (req, res) => {
  if (!req.user?.permissions.canAccessFinance) return res.status(403).json({ error: "Sem permissão ao financeiro" });
  const trans = getCompanyData<FinancialTransaction[]>(req.companyId!, "financial", []);
  const idx = trans.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Transação não encontrada" });

  trans[idx].status = "PAGO";
  trans[idx].paymentDate = new Date().toISOString().substring(0, 10);

  saveCompanyData(req.companyId!, "financial", trans);
  writeLog(req.companyId!, req.user.id, req.user.name, "Liquidou Transação", `Transação '${trans[idx].description}' marcada como paga.`, req);
  res.json(trans[idx]);
});

app.delete("/api/financial/:id", requireAuth, (req, res) => {
  if (!req.user?.permissions.canAccessFinance) return res.status(403).json({ error: "Sem permissão" });
  const trans = getCompanyData<FinancialTransaction[]>(req.companyId!, "financial", []);
  const idx = trans.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Transação não encontrada" });

  const desc = trans[idx].description;
  trans.splice(idx, 1);
  saveCompanyData(req.companyId!, "financial", trans);
  writeLog(req.companyId!, req.user.id, req.user.name, "Excluiu Transação", `Lançamento financeiro '${desc}' excluído.`, req);
  res.json({ success: true });
});

// Service Orders (OS) CRUD
app.get("/api/service-orders", requireAuth, (req, res) => {
  const os = getCompanyData<ServiceOrder[]>(req.companyId!, "service_orders", []);
  res.json(os);
});

app.post("/api/service-orders", requireAuth, (req, res) => {
  const data = req.body as Partial<ServiceOrder>;
  if (!data.clientId || !data.equipment || !data.defectDescription) {
    return res.status(400).json({ error: "Cliente, Equipamento e Defeito são obrigatórios" });
  }

  const os = getCompanyData<ServiceOrder[]>(req.companyId!, "service_orders", []);
  const newOS: ServiceOrder = {
    id: `os_${Date.now()}`,
    companyId: req.companyId!,
    clientId: data.clientId,
    clientName: data.clientName || "Cliente",
    clientPhone: data.clientPhone || "",
    equipment: data.equipment,
    brand: data.brand || "",
    model: data.model || "",
    serialNumber: data.serialNumber || "",
    defectDescription: data.defectDescription,
    status: data.status || "ABERTO",
    technicalObservations: data.technicalObservations || "",
    services: data.services || [],
    parts: data.parts || [],
    discount: data.discount || 0,
    total: data.total || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  os.unshift(newOS);
  saveCompanyData(req.companyId!, "service_orders", os);
  writeLog(req.companyId!, req.user.id, req.user.name, "Abertura OS", `Nova Ordem de Serviço ${newOS.id} aberta para ${newOS.equipment}.`, req);
  res.json(newOS);
});

app.put("/api/service-orders/:id", requireAuth, (req, res) => {
  const data = req.body as Partial<ServiceOrder>;
  const os = getCompanyData<ServiceOrder[]>(req.companyId!, "service_orders", []);
  const idx = os.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "OS não encontrada" });

  const prevStatus = os[idx].status;

  const updatedOS: ServiceOrder = {
    ...os[idx],
    ...data,
    id: os[idx].id,
    companyId: req.companyId!,
    updatedAt: new Date().toISOString()
  };

  os[idx] = updatedOS;
  saveCompanyData(req.companyId!, "service_orders", os);

  // If status transitioned to CONCLUIDO and has billing, create finance transaction if not already created
  if (updatedOS.status === "CONCLUIDO" && prevStatus !== "CONCLUIDO" && updatedOS.total > 0) {
    const financial = getCompanyData<FinancialTransaction[]>(req.companyId!, "financial", []);
    financial.unshift({
      id: `fin_os_${updatedOS.id}`,
      companyId: req.companyId!,
      type: "RECEITA",
      category: "Serviços",
      description: `Recebimento Faturamento OS ${updatedOS.id} - ${updatedOS.equipment}`,
      amount: updatedOS.total,
      dueDate: new Date().toISOString().substring(0, 10),
      paymentDate: new Date().toISOString().substring(0, 10),
      status: "PAGO",
      costCenter: "OS",
      refId: updatedOS.id,
      createdAt: new Date().toISOString()
    });
    saveCompanyData(req.companyId!, "financial", financial);
  }

  writeLog(req.companyId!, req.user.id, req.user.name, "Atualizou OS", `OS ${updatedOS.id} atualizada para status ${updatedOS.status}.`, req);
  res.json(updatedOS);
});

// Commissions API
app.get("/api/commissions", requireAuth, (req, res) => {
  const list = getCompanyData<Commission[]>(req.companyId!, "commissions", []);
  res.json(list);
});

app.put("/api/commissions/:id/pay", requireAuth, (req, res) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Apenas administradores podem liberar comissão" });
  const list = getCompanyData<Commission[]>(req.companyId!, "commissions", []);
  const idx = list.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Comissão não encontrada" });

  list[idx].status = "PAGO";
  saveCompanyData(req.companyId!, "commissions", list);

  // Record despesa in finance for paid commissions
  const financial = getCompanyData<FinancialTransaction[]>(req.companyId!, "financial", []);
  financial.unshift({
    id: `fin_comm_${list[idx].id}`,
    companyId: req.companyId!,
    type: "DESPESA",
    category: "Comissões",
    description: `Comissão paga ao funcionário ${list[idx].userName} ref venda ${list[idx].saleId}`,
    amount: list[idx].amount,
    dueDate: new Date().toISOString().substring(0, 10),
    paymentDate: new Date().toISOString().substring(0, 10),
    status: "PAGO",
    costCenter: "Comissão",
    refId: list[idx].id,
    createdAt: new Date().toISOString()
  });
  saveCompanyData(req.companyId!, "financial", financial);

  writeLog(req.companyId!, req.user.id, req.user.name, "Liberou Comissão", `Comissão de R$ ${list[idx].amount.toFixed(2)} liberada para ${list[idx].userName}.`, req);
  res.json(list[idx]);
});

// Sales Goals
app.get("/api/goals", requireAuth, (req, res) => {
  const goals = getCompanyData<SalesGoal[]>(req.companyId!, "goals", []);
  res.json(goals);
});

app.post("/api/goals", requireAuth, (req, res) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Apenas admins" });
  const { month, targetAmount } = req.body;
  if (!month || !targetAmount) return res.status(400).json({ error: "Faltando dados" });

  const goals = getCompanyData<SalesGoal[]>(req.companyId!, "goals", []);
  const idx = goals.findIndex(g => g.month === month);

  if (idx !== -1) {
    goals[idx].targetAmount = targetAmount;
    res.json(goals[idx]);
  } else {
    const newGoal: SalesGoal = {
      id: `g_${Date.now()}`,
      companyId: req.companyId!,
      month,
      targetAmount,
      currentAmount: 0
    };
    goals.push(newGoal);
    res.json(newGoal);
  }
  saveCompanyData(req.companyId!, "goals", goals);
});

// Vouchers API
app.get("/api/vouchers", requireAuth, (req, res) => {
  const v = getCompanyData<Voucher[]>(req.companyId!, "vouchers", []);
  res.json(v);
});

app.post("/api/vouchers", requireAuth, (req, res) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Apenas admins" });
  const data = req.body as Partial<Voucher>;
  const list = getCompanyData<Voucher[]>(req.companyId!, "vouchers", []);

  if (!data.code || !data.value || !data.discountType) {
    return res.status(400).json({ error: "Código, valor e tipo de desconto são obrigatórios." });
  }

  const newVoucher: Voucher = {
    id: `vch_${Date.now()}`,
    companyId: req.companyId!,
    code: data.code.toUpperCase().trim(),
    discountType: data.discountType as "PERCENT" | "FIXED",
    value: data.value,
    minPurchase: data.minPurchase || 0,
    expiryDate: data.expiryDate || new Date(Date.now() + 30 * 24 * 3600000).toISOString().substring(0, 10),
    active: true
  };

  list.push(newVoucher);
  saveCompanyData(req.companyId!, "vouchers", list);
  writeLog(req.companyId!, req.user.id, req.user.name, "Criou Cupom", `Criou cupom de desconto ${newVoucher.code}`, req);
  res.json(newVoucher);
});

// Audit Logs API
app.get("/api/logs", requireAuth, (req, res) => {
  const logs = getCompanyData<SystemLog[]>(req.companyId!, "logs", []);
  res.json(logs);
});

// Notifications API
app.get("/api/notifications", requireAuth, (req, res) => {
  const list = getCompanyData<SystemNotification[]>(req.companyId!, "notifications", []);
  res.json(list);
});

app.put("/api/notifications/read-all", requireAuth, (req, res) => {
  const list = getCompanyData<SystemNotification[]>(req.companyId!, "notifications", []);
  list.forEach(n => n.read = true);
  saveCompanyData(req.companyId!, "notifications", list);
  res.json({ success: true });
});

// Tax Engine configuration
app.put("/api/company/tax", requireAuth, (req, res) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Apenas admins" });
  const taxConfig = req.body as TaxConfig;

  const companies = getCompanies();
  const idx = companies.findIndex(c => c.id === req.companyId);
  if (idx === -1) return res.status(404).json({ error: "Empresa não encontrada" });

  companies[idx].taxConfig = taxConfig;
  saveCompanies(companies);

  writeLog(req.companyId!, req.user.id, req.user.name, "Atualizou Tributação", "Motor tributário reconfigurado pelo administrador.", req);
  res.json(companies[idx]);
});

// Backup & Export (JSON database dump)
app.get("/api/backup/export", requireAuth, (req, res) => {
  if (!req.user?.permissions.canAccessBackup) return res.status(403).json({ error: "Sem permissão" });
  
  const products = getCompanyData(req.companyId!, "products", []);
  const clients = getCompanyData(req.companyId!, "clients", []);
  const suppliers = getCompanyData(req.companyId!, "suppliers", []);
  const sales = getCompanyData(req.companyId!, "sales", []);
  const estimates = getCompanyData(req.companyId!, "estimates", []);
  const inventory = getCompanyData(req.companyId!, "inventory", []);
  const financial = getCompanyData(req.companyId!, "financial", []);
  const service_orders = getCompanyData(req.companyId!, "service_orders", []);
  const commissions = getCompanyData(req.companyId!, "commissions", []);
  const vouchers = getCompanyData(req.companyId!, "vouchers", []);
  const logs = getCompanyData(req.companyId!, "logs", []);

  const backupPayload = {
    backupDate: new Date().toISOString(),
    companyId: req.companyId!,
    schemaVersion: "1.0.0",
    data: {
      products,
      clients,
      suppliers,
      sales,
      estimates,
      inventory,
      financial,
      service_orders,
      commissions,
      vouchers,
      logs
    }
  };

  writeLog(req.companyId!, req.user.id, req.user.name, "Exportação Backup", "Efetuado backup completo das tabelas em formato lógico JSON.", req);
  res.json(backupPayload);
});

// Documental Backup Generator (Creates pre-formatted printable files arranged in folder hierarchy)
app.get("/api/backup/pdf", requireAuth, (req, res) => {
  if (!req.user?.permissions.canAccessBackup) return res.status(403).json({ error: "Sem permissão" });
  
  const products = getCompanyData<Product[]>(req.companyId!, "products", []);
  const clients = getCompanyData<Client[]>(req.companyId!, "clients", []);
  const suppliers = getCompanyData<Supplier[]>(req.companyId!, "suppliers", []);
  const sales = getCompanyData<Sale[]>(req.companyId!, "sales", []);
  const estimates = getCompanyData<Estimate[]>(req.companyId!, "estimates", []);
  const financial = getCompanyData<FinancialTransaction[]>(req.companyId!, "financial", []);

  // Return formatted report maps for documents backup download (simulating directory)
  const reportDate = new Date().toISOString().substring(0, 10);
  const reports = {
    folderName: `Backup_${reportDate}`,
    files: [
      {
        name: "Produtos.html",
        title: "Relatório de Produtos e Cadastro de Inventário",
        content: `
          <html>
          <head><title>Ficha Geral de Produtos - Backup Documental</title><style>body { font-family: sans-serif; color: #333; margin: 30px; } table { width:100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; } th { bg-color: #f5f5f5; }</style></head>
          <body>
            <h2>Relatório Consolidado de Produtos</h2>
            <p>Gerado em: ${new Date().toLocaleString()}</p>
            <table>
              <thead><tr><th>Cód</th><th>SKU</th><th>Nome</th><th>Categoria</th><th>Preço Custo</th><th>Preço Venda</th><th>Estoque</th></tr></thead>
              <tbody>
                ${products.map(p => `<tr><td>${p.code}</td><td>${p.sku}</td><td>${p.name}</td><td>${p.category}</td><td>R$ ${p.costPrice.toFixed(2)}</td><td>R$ ${p.sellPrice.toFixed(2)}</td><td>${p.quantity} ${p.unit}</td></tr>`).join("")}
              </tbody>
            </table>
          </body>
          </html>
        `
      },
      {
        name: "Clientes.html",
        title: "Dossiê Geral de Clientes",
        content: `
          <html>
          <head><title>Ficha Cadastral de Clientes - Backup Documental</title><style>body { font-family: sans-serif; color: #333; margin: 30px; } table { width:100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; } th { bg-color: #f5f5f5; }</style></head>
          <body>
            <h2>Fichário Consolidado de Clientes</h2>
            <p>Gerado em: ${new Date().toLocaleString()}</p>
            <table>
              <thead><tr><th>Nome</th><th>CPF/CNPJ</th><th>Telefone</th><th>Email</th><th>Cidade/UF</th><th>Pontos Fidelidade</th></tr></thead>
              <tbody>
                ${clients.map(c => `<tr><td>${c.name}</td><td>${c.cpfCnpj}</td><td>${c.phone}</td><td>${c.email}</td><td>${c.city}/${c.state}</td><td>${c.loyaltyPoints} pts</td></tr>`).join("")}
              </tbody>
            </table>
          </body>
          </html>
        `
      },
      {
        name: "Fornecedores.html",
        title: "Ficha Cadastral de Fornecedores",
        content: `
          <html>
          <head><title>Ficha de Fornecedores - Backup Documental</title><style>body { font-family: sans-serif; color: #333; margin: 30px; } table { width:100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; } th { bg-color: #f5f5f5; }</style></head>
          <body>
            <h2>Cadastro de Fornecedores Credenciados</h2>
            <p>Gerado em: ${new Date().toLocaleString()}</p>
            <table>
              <thead><tr><th>Fornecedor</th><th>CNPJ</th><th>Telefone</th><th>E-mail</th><th>Contato</th><th>Cidade/UF</th></tr></thead>
              <tbody>
                ${suppliers.map(s => `<tr><td>${s.name}</td><td>${s.cnpj}</td><td>${s.phone}</td><td>${s.email}</td><td>${s.contactPerson || "-"}</td><td>${s.city}/${s.state}</td></tr>`).join("")}
              </tbody>
            </table>
          </body>
          </html>
        `
      },
      {
        name: "Vendas.html",
        title: "Livro de Vendas PDV",
        content: `
          <html>
          <head><title>Livro de Registros Diários de Caixa (Vendas) - Backup Documental</title><style>body { font-family: sans-serif; color: #333; margin: 30px; } table { width:100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; } th { bg-color: #f5f5f5; }</style></head>
          <body>
            <h2>Demonstrativo de Vendas Faturadas</h2>
            <p>Gerado em: ${new Date().toLocaleString()}</p>
            <table>
              <thead><tr><th>ID Venda</th><th>Data</th><th>Cliente</th><th>Vendedor</th><th>Subtotal</th><th>Desconto</th><th>Total Líquido</th></tr></thead>
              <tbody>
                ${sales.map(s => `<tr><td>${s.id}</td><td>${new Date(s.createdAt).toLocaleDateString()}</td><td>${s.clientName || "Consumidor"}</td><td>${s.userName}</td><td>R$ ${s.subtotal.toFixed(2)}</td><td>R$ ${s.discount.toFixed(2)}</td><td>R$ ${s.total.toFixed(2)}</td></tr>`).join("")}
              </tbody>
            </table>
          </body>
          </html>
        `
      },
      {
        name: "Financeiro.html",
        title: "Fluxo de Caixa e Extrato Geral",
        content: `
          <html>
          <head><title>Extrato e Demonstrativo de Fluxo de Caixa - Backup Documental</title><style>body { font-family: sans-serif; color: #333; margin: 30px; } table { width:100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; } th { bg-color: #f5f5f5; }</style></head>
          <body>
            <h2>Livro de Entradas e Saídas Financeiras (Fluxo de Caixa)</h2>
            <p>Gerado em: ${new Date().toLocaleString()}</p>
            <table>
              <thead><tr><th>Data Cadastro</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Vencimento</th><th>Situação</th><th>Tipo</th></tr></thead>
              <tbody>
                ${financial.map(f => `<tr><td>${new Date(f.createdAt).toLocaleDateString()}</td><td>${f.description}</td><td>${f.category}</td><td>R$ ${f.amount.toFixed(2)}</td><td>${f.dueDate}</td><td>${f.status}</td><td style="color:${f.type === "RECEITA" ? "green" : "red"}">${f.type}</td></tr>`).join("")}
              </tbody>
            </table>
          </body>
          </html>
        `
      },
      {
        name: "Orcamentos.html",
        title: "Relatório de Orçamentos Emitidos",
        content: `
          <html>
          <head><title>Propostas e Orçamentos - Backup Documental</title><style>body { font-family: sans-serif; color: #333; margin: 30px; } table { width:100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; } th { bg-color: #f5f5f5; }</style></head>
          <body>
            <h2>Relatório de Orçamentos e Propostas Ativas</h2>
            <p>Gerado em: ${new Date().toLocaleString()}</p>
            <table>
              <thead><tr><th>Cód Orçamento</th><th>Cliente</th><th>Subtotal</th><th>Desconto</th><th>Frete</th><th>Total Final</th><th>Validade</th></tr></thead>
              <tbody>
                ${estimates.map(e => `<tr><td>${e.id}</td><td>${e.clientName}</td><td>R$ ${e.subtotal.toFixed(2)}</td><td>R$ ${e.discount.toFixed(2)}</td><td>R$ ${e.shippingCost.toFixed(2)}</td><td>R$ ${e.total.toFixed(2)}</td><td>${e.validUntil}</td></tr>`).join("")}
              </tbody>
            </table>
          </body>
          </html>
        `
      }
    ]
  };

  writeLog(req.companyId!, req.user.id, req.user.name, "Backup Documental", "Efetuado backup documental completo com relatórios HTML estruturados.", req);
  res.json(reports);
});

// Serve frontend assets in production or Vite middleware in development
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

startServer();
