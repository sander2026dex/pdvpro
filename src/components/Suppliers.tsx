/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Truck, Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, Save, ArrowLeft, Building } from "lucide-react";
import { Supplier } from "../types";

interface SuppliersProps {
  suppliers: Supplier[];
  onCreateSupplier: (data: Partial<Supplier>) => Promise<Supplier>;
  onUpdateSupplier: (id: string, data: Partial<Supplier>) => Promise<Supplier>;
  onDeleteSupplier: (id: string) => Promise<void>;
  permissions: any;
}

export default function Suppliers({ suppliers, onCreateSupplier, onUpdateSupplier, onDeleteSupplier, permissions }: SuppliersProps) {
  const [viewMode, setViewMode] = useState<"LIST" | "FORM">("LIST");
  const [search, setSearch] = useState<string>("");

  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [cnpj, setCnpj] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  const handleOpenCreateForm = () => {
    setEditId(null);
    setName("");
    setCnpj("");
    setEmail("");
    setPhone("");
    setAddress("");
    setViewMode("FORM");
  };

  const handleOpenEditForm = (s: Supplier) => {
    setEditId(s.id);
    setName(s.name);
    setCnpj(s.cnpj || "");
    setEmail(s.email || "");
    setPhone(s.phone || "");
    setAddress(s.address || "");
    setViewMode("FORM");
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert("O nome é obrigatório.");
      return;
    }

    const payload: Partial<Supplier> = {
      name,
      cnpj: cnpj || undefined,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined
    };

    try {
      if (editId) {
        await onUpdateSupplier(editId, payload);
      } else {
        await onCreateSupplier(payload);
      }
      setViewMode("LIST");
    } catch (err: any) {
      alert(err.message || "Erro ao salvar fornecedor");
    }
  };

  const filteredList = useMemo(() => {
    if (!search.trim()) return suppliers;
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.cnpj?.includes(search) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search)
    );
  }, [suppliers, search]);

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-10">
      
      {/* HEADER ROW */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" /> Fornecedores de Insumos
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cadastro de indústrias, distribuidores e parceiros logísticos para reabastecimento de estoque.
          </p>
        </div>

        {viewMode === "LIST" && permissions.canAccessStock && (
          <button
            onClick={handleOpenCreateForm}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase rounded-lg shadow cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Fornecedor
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
          {/* Quick stats */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 flex items-center justify-between w-fit min-w-64">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fornecedores Ativos</p>
              <p className="text-2xl font-extrabold text-white mt-1">{suppliers.length} cadastrados</p>
            </div>
            <Truck className="w-8 h-8 text-emerald-400/40" />
          </div>

          {/* Search bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar fornecedores por nome, CNPJ, e-mail ou WhatsApp..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-800 bg-slate-900/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/10">
                  <th className="p-4">Razão Social / Fantasia</th>
                  <th className="p-4">CNPJ Corporativo</th>
                  <th className="p-4">Contatos</th>
                  <th className="p-4">Endereço Fiscal / Galpão</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map(s => (
                  <tr key={s.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-500" /> {s.name}
                    </td>
                    <td className="p-4 font-mono text-slate-400">{s.cnpj || "Sem CNPJ cadastrado"}</td>
                    <td className="p-4 text-slate-300">
                      <p className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {s.email || "-"}</p>
                      <p className="flex items-center gap-1 mt-0.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {s.phone || "-"}</p>
                    </td>
                    <td className="p-4 text-slate-400 max-w-xs truncate" title={s.address}>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {s.address || "-"}</span>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      {permissions.canAccessStock && (
                        <button
                          onClick={() => handleOpenEditForm(s)}
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 hover:text-emerald-300"
                          title="Editar Cadastro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {permissions.canAccessStock && (
                        <button
                          onClick={() => {
                            if (confirm(`Excluir permanentemente ${s.name}?`)) {
                              onDeleteSupplier(s.id);
                            }
                          }}
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-red-400 hover:text-red-300"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredList.length === 0 && (
              <div className="py-16 text-center text-slate-500 italic">
                Nenhum fornecedor localizado ou cadastrado.
              </div>
            )}
          </div>
        </>
      )}

      {/* --- FORM MODE --- */}
      {viewMode === "FORM" && (
        <form onSubmit={handleSaveSupplier} className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            {editId ? "Editar Informações do Fornecedor" : "Adicionar Novo Fornecedor"}
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Nome / Razão Social / Distribuidora *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
              placeholder="Ex: Ambev Distribuidora"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">CNPJ Fiscal</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none"
              placeholder="Ex: 00.000.000/0001-00"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">E-mail Comercial</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                placeholder="vendas@fornecedor.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">WhatsApp / Telefone de Contato</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                placeholder="Ex: (11) 97777-6666"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Endereço Galpão / Faturamento</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none min-h-16"
              placeholder="Rua, Número, Bairro, CEP, Cidade - UF"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-bold rounded uppercase cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded uppercase cursor-pointer flex items-center gap-1 shadow"
            >
              <Save className="w-4 h-4" /> Gravar Fornecedor
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
