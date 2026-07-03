/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Settings as SettingsIcon, Save, Users, Plus, Shield, ShieldCheck, 
  Trash2, Mail, Landmark, Building 
} from "lucide-react";
import { Company, User, TaxConfig } from "../types";

interface SettingsProps {
  company: Company;
  employees: User[];
  onUpdateCompanyTax: (tax: TaxConfig) => Promise<Company>;
  onCreateEmployee: (data: Partial<User>) => Promise<User>;
  onUpdateEmployee: (id: string, data: Partial<User>) => Promise<User>;
  onDeleteEmployee: (id: string) => Promise<void>;
  currentUser: User;
}

export default function Settings({ company, employees, onUpdateCompanyTax, onCreateEmployee, onUpdateEmployee, onDeleteEmployee, currentUser }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<"COMPANY" | "EMPLOYEES">("COMPANY");

  // Company states
  const [regime, setRegime] = useState<"SIMPLES" | "PRESUMIDO" | "REAL">(company.taxConfig?.regime || "SIMPLES");
  const [icmsAliquota, setIcmsAliquota] = useState<number>(company.taxConfig?.icmsAliquota || 4);
  const [ipiAliquota, setIpiAliquota] = useState<number>(company.taxConfig?.ipiAliquota || 0);
  const [pisAliquota, setPisAliquota] = useState<number>(company.taxConfig?.pisAliquota || 0);
  const [cofinsAliquota, setCofinsAliquota] = useState<number>(company.taxConfig?.cofinsAliquota || 0);

  // Employee CRUD states
  const [showEmployeeForm, setShowEmployeeForm] = useState<boolean>(false);
  const [empId, setEmpId] = useState<string | null>(null);
  const [empName, setEmpName] = useState<string>("");
  const [empEmail, setEmpEmail] = useState<string>("");
  const [empPassword, setEmpPassword] = useState<string>("");
  
  // Custom permissions matrix checkboxes
  const [pAccessStock, setPAccessStock] = useState<boolean>(true);
  const [pManageCRM, setPManageCRM] = useState<boolean>(true);
  const [pEmitEstimate, setPEmitEstimate] = useState<boolean>(true);
  const [pManageFinance, setPManageFinance] = useState<boolean>(false);
  const [pSeeCost, setPSeeCost] = useState<boolean>(false);
  const [pSeeProfit, setPSeeProfit] = useState<boolean>(false);
  const [pExcludeProduct, setPExcludeProduct] = useState<boolean>(false);

  const handleSaveTaxConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateCompanyTax({
        regime,
        icmsAliquota,
        icmsStAliquota: 0,
        ipiAliquota,
        pisAliquota,
        cofinsAliquota,
        issAliquota: 0
      });
      alert("Configurações fiscais e tributárias atualizadas com sucesso!");
    } catch (err: any) {
      alert(err.message || "Erro ao salvar regime tributário");
    }
  };

  const handleOpenCreateEmp = () => {
    setEmpId(null);
    setEmpName("");
    setEmpEmail("");
    setEmpPassword("");
    setPAccessStock(true);
    setPManageCRM(true);
    setPEmitEstimate(true);
    setPManageFinance(false);
    setPSeeCost(false);
    setPSeeProfit(false);
    setPExcludeProduct(false);
    setShowEmployeeForm(true);
  };

  const handleOpenEditEmp = (u: User) => {
    setEmpId(u.id);
    setEmpName(u.name);
    setEmpEmail(u.email);
    setEmpPassword(""); // leave empty to not change
    setPAccessStock(u.permissions?.canAccessStock || false);
    setPManageCRM(u.permissions?.canRegisterClient || false);
    setPEmitEstimate(u.permissions?.canEmitEstimate || false);
    setPManageFinance(u.permissions?.canAccessFinance || false);
    setPSeeCost(u.permissions?.canSeeCost || false);
    setPSeeProfit(u.permissions?.canSeeProfit || false);
    setPExcludeProduct(u.permissions?.canExcludeProduct || false);
    setShowEmployeeForm(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empEmail) {
      alert("Preencha o nome e e-mail");
      return;
    }
    if (!empId && !empPassword) {
      alert("A senha de acesso provisória é obrigatória para novos usuários.");
      return;
    }

    const payload: Partial<User> = {
      name: empName,
      email: empEmail,
      ...(empPassword ? { password: empPassword } : {}),
      permissions: {
        canAccessStock: pAccessStock,
        canRegisterClient: pManageCRM,
        canEmitEstimate: pEmitEstimate,
        canAccessFinance: pManageFinance,
        canSeeCost: pSeeCost,
        canSeeProfit: pSeeProfit,
        canExcludeProduct: pExcludeProduct,
        canSell: true,
        canCancelSale: true,
        canAlterPrice: true,
        canRegisterSupplier: true,
        canPrint: true,
        canExportPDF: true,
        canAlterConfig: true,
        canEmitReports: true,
        canAccessDashboard: true,
        canAccessBackup: true,
        canRegisterUsers: true,
        canAccessCatalog: true,
        canViewStats: true
      }
    };

    try {
      if (empId) {
        await onUpdateEmployee(empId, payload);
      } else {
        await onCreateEmployee(payload);
      }
      setShowEmployeeForm(false);
    } catch (err: any) {
      alert(err.message || "Erro ao salvar funcionário");
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-emerald-400" /> Configurações do Workspace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Administração tributária da empresa, perfil organizacional e controle de permissões de funcionários.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800/60 pb-1">
        <button
          onClick={() => { setActiveTab("COMPANY"); setShowEmployeeForm(false); }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === "COMPANY" 
              ? "text-emerald-400 border-b-2 border-emerald-400 font-extrabold" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Regime Tributário e Perfil
        </button>
        <button
          onClick={() => { setActiveTab("EMPLOYEES"); }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === "EMPLOYEES" 
              ? "text-emerald-400 border-b-2 border-emerald-400 font-extrabold" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Gerenciar Usuários & Permissões ({employees.length})
        </button>
      </div>

      {/* TAB 1: COMPANY PROFILE AND FISCAL */}
      {activeTab === "COMPANY" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <form onSubmit={handleSaveTaxConfig} className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-cyan-400" /> Motor Tributário e Alíquotas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Regime Tributário Oficial</label>
                <select
                  value={regime}
                  onChange={(e) => setRegime(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="SIMPLES">Simples Nacional (ME / EPP)</option>
                  <option value="PRESUMIDO">Lucro Presumido</option>
                  <option value="REAL">Lucro Real (Industrial)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Alíquota ICMS Estimada (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={icmsAliquota}
                  onChange={(e) => setIcmsAliquota(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Alíquota IPI (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ipiAliquota}
                  onChange={(e) => setIpiAliquota(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">PIS (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={pisAliquota}
                  onChange={(e) => setPisAliquota(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">COFINS (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cofinsAliquota}
                  onChange={(e) => setCofinsAliquota(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer mt-6 shadow"
            >
              <Save className="w-4 h-4" /> Gravar Alíquotas Fiscais
            </button>
          </form>

          {/* Company identity card overview */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5 mb-4">
                <Building className="w-4 h-4 text-cyan-400" /> Identidade de Workspace
              </h3>
              
              <div className="space-y-3.5 text-xs text-slate-400">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Razão Social Vinculada</p>
                  <p className="text-white font-bold text-sm mt-1">{company.name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">ID Lógico do Banco Separado</p>
                  <p className="text-cyan-400 font-mono mt-1">{company.id}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Proprietário da Empresa</p>
                  <p className="text-white mt-1">{employees.find(e => e.role === "ADMIN")?.name || "Administrador"}</p>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 pt-3 border-t border-slate-800/60 mt-6 leading-relaxed">
              O LexPro isola os bancos de dados lógicos em conformidade estrita com a LGPD. Seus arquivos de dados residem no cluster corporativo criptografado.
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: EMPLOYEES & ROLE MATRIX */}
      {activeTab === "EMPLOYEES" && (
        <div className="space-y-6">
          
          {!showEmployeeForm ? (
            <>
              {/* Header and create */}
              <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800 p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Colaboradores Autorizados</h3>
                  <p className="text-xs text-slate-500 mt-1">Este workspace suporta até 1 Administrador + 4 Funcionários (Simultâneos).</p>
                </div>
                {employees.length < 5 && currentUser.role === "ADMIN" && (
                  <button
                    onClick={handleOpenCreateEmp}
                    className="flex items-center gap-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded text-xs font-bold uppercase cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Colaborador
                  </button>
                )}
              </div>

              {/* Employees Grid */}
              <div className="border border-slate-800 bg-slate-900/10 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/10">
                      <th className="p-4">Nome Completo</th>
                      <th className="p-4">E-mail Corporativo</th>
                      <th className="p-4 text-center">Papel</th>
                      <th className="p-4">Status de Permissão</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {employees.map(u => {
                      const isAdmin = u.role === "ADMIN";
                      return (
                        <tr key={u.id} className="hover:bg-slate-900/20 transition-colors text-slate-300">
                          <td className="p-4 font-sans font-bold text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" /> {u.name}
                          </td>
                          <td className="p-4 font-sans text-slate-400">{u.email}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              isAdmin ? "bg-amber-950/40 text-amber-400 border border-amber-500/20" : "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 font-sans text-slate-400">
                            {isAdmin ? (
                              <span className="text-amber-400 font-bold text-xs flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Acesso Total (Root)</span>
                            ) : (
                              <div className="text-[10px] text-slate-500 flex flex-wrap gap-1">
                                {u.permissions?.canAccessStock && <span className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-400 text-[9px] font-bold">Estoque</span>}
                                {u.permissions?.canRegisterClient && <span className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-400 text-[9px] font-bold">CRM</span>}
                                {u.permissions?.canAccessFinance && <span className="bg-slate-900 px-1.5 py-0.5 rounded text-red-400 text-[9px] font-bold">Financeiro</span>}
                                {!u.permissions?.canAccessStock && !u.permissions?.canRegisterClient && !u.permissions?.canAccessFinance && <span className="text-slate-600 italic">Nenhum privilégio</span>}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right font-sans space-x-1.5">
                            {currentUser.role === "ADMIN" && (
                              <button
                                onClick={() => handleOpenEditEmp(u)}
                                className="p-1.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 hover:text-emerald-300"
                                title="Editar Colaborador / Permissões"
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isAdmin && currentUser.role === "ADMIN" && (
                              <button
                                onClick={async () => {
                                  if (confirm(`Remover permanentemente ${u.name} do workspace?`)) {
                                    await onDeleteEmployee(u.id);
                                  }
                                }}
                                className="p-1.5 rounded bg-slate-950 border border-slate-800 text-red-400 hover:text-red-300"
                                title="Excluir Colaborador"
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
              </div>
            </>
          ) : (
            /* CRUD FORM EMPLOYEE & SHIELD permissions */
            <form onSubmit={handleSaveEmployee} className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                {empId ? "Configurar Acesso de Colaborador" : "Registrar Novo Colaborador no Workspace"}
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Nome Completo do Funcionário *</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
                  placeholder="Ex: Pedro da Silva"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">E-mail Corporativo *</label>
                  <input
                    type="email"
                    required
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                    placeholder="pedro@minhaempresa.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {empId ? "Redefinir Senha (Deixe vazio para manter)" : "Senha Provisória de Acesso *"}
                  </label>
                  <input
                    type="password"
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                    placeholder="******"
                  />
                </div>
              </div>

              {/* Permissions Checkbox Panel Matrix */}
              <div className="pt-3 border-t border-slate-800">
                <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Matriz de Privilégios Corporativos</label>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="p_stock"
                      checked={pAccessStock}
                      onChange={(e) => setPAccessStock(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded bg-slate-950 border-slate-800"
                    />
                    <label htmlFor="p_stock" className="text-slate-300 select-none">Pode acessar faturamento e produtos no Estoque</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="p_crm"
                      checked={pManageCRM}
                      onChange={(e) => setPManageCRM(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded bg-slate-950 border-slate-800"
                    />
                    <label htmlFor="p_crm" className="text-slate-300 select-none">Pode gerenciar CRM, clientes, fornecedores e O.S.</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="p_estimate"
                      checked={pEmitEstimate}
                      onChange={(e) => setPEmitEstimate(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded bg-slate-950 border-slate-800"
                    />
                    <label htmlFor="p_estimate" className="text-slate-300 select-none">Pode emitir orçamentos</label>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/40">
                    <input
                      type="checkbox"
                      id="p_finance"
                      checked={pManageFinance}
                      onChange={(e) => setPManageFinance(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded bg-slate-950 border-slate-800"
                    />
                    <label htmlFor="p_finance" className="text-red-400 select-none font-bold">Pode faturar, pagar e excluir lançamentos no Fluxo Financeiro</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="p_cost"
                      checked={pSeeCost}
                      onChange={(e) => setPSeeCost(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded bg-slate-950 border-slate-800"
                    />
                    <label htmlFor="p_cost" className="text-slate-300 select-none">Pode visualizar preços de custo dos insumos</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="p_profit"
                      checked={pSeeProfit}
                      onChange={(e) => setPSeeProfit(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded bg-slate-950 border-slate-800"
                    />
                    <label htmlFor="p_profit" className="text-slate-300 select-none">Pode visualizar indicadores de lucro líquido no Painel de Controle</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="p_exclude_prod"
                      checked={pExcludeProduct}
                      onChange={(e) => setPExcludeProduct(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded bg-slate-950 border-slate-800"
                    />
                    <label htmlFor="p_exclude_prod" className="text-slate-300 select-none">Pode excluir produtos cadastrados fisicamente no banco</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEmployeeForm(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-bold rounded uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded uppercase cursor-pointer flex items-center gap-1 shadow"
                >
                  <Save className="w-4 h-4" /> Gravar Privilégios
                </button>
              </div>
            </form>
          )}

        </div>
      )}

    </div>
  );
}
