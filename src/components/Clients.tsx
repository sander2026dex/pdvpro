/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Users, Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, Award, Save, ArrowLeft } from "lucide-react";
import { Client } from "../types";

interface ClientsProps {
  clients: Client[];
  onCreateClient: (data: Partial<Client>) => Promise<Client>;
  onUpdateClient: (id: string, data: Partial<Client>) => Promise<Client>;
  onDeleteClient: (id: string) => Promise<void>;
  permissions: any;
}

export default function Clients({ clients, onCreateClient, onUpdateClient, onDeleteClient, permissions }: ClientsProps) {
  const [viewMode, setViewMode] = useState<"LIST" | "FORM">("LIST");
  const [search, setSearch] = useState<string>("");

  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [cpfCnpj, setCpfCnpj] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);

  const handleOpenCreateForm = () => {
    setEditId(null);
    setName("");
    setCpfCnpj("");
    setEmail("");
    setPhone("");
    setAddress("");
    setLoyaltyPoints(0);
    setViewMode("FORM");
  };

  const handleOpenEditForm = (c: Client) => {
    setEditId(c.id);
    setName(c.name);
    setCpfCnpj(c.cpfCnpj || "");
    setEmail(c.email || "");
    setPhone(c.phone || "");
    setAddress(c.address || "");
    setLoyaltyPoints(c.loyaltyPoints || 0);
    setViewMode("FORM");
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert("O nome é obrigatório.");
      return;
    }

    const payload: Partial<Client> = {
      name,
      cpfCnpj: cpfCnpj || undefined,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      loyaltyPoints
    };

    try {
      if (editId) {
        await onUpdateClient(editId, payload);
      } else {
        await onCreateClient(payload);
      }
      setViewMode("LIST");
    } catch (err: any) {
      alert(err.message || "Erro ao salvar cliente");
    }
  };

  const filteredList = useMemo(() => {
    if (!search.trim()) return clients;
    return clients.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cpfCnpj?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    );
  }, [clients, search]);

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-10">
      
      {/* HEADER ROW */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" /> CRM de Clientes
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ficha cadastral de clientes e pontuação acumulada do programa fidelidade.
          </p>
        </div>

        {viewMode === "LIST" && permissions.canManageCRM && (
          <button
            onClick={handleOpenCreateForm}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase rounded-lg shadow cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Cliente
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
          {/* CRM Quick Stats Widget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Cadastrado</p>
                <p className="text-2xl font-extrabold text-white mt-1">{clients.length} clientes</p>
              </div>
              <Users className="w-8 h-8 text-emerald-400/40" />
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fidelidade Acumulado</p>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {clients.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0)} pts
                </p>
              </div>
              <Award className="w-8 h-8 text-cyan-400/40" />
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
                placeholder="Filtrar clientes por nome, e-mail, CPF, CNPJ ou telefone..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* CRM Table */}
          <div className="border border-slate-800 bg-slate-900/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/10">
                  <th className="p-4">Identificação</th>
                  <th className="p-4">CPF / CNPJ</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Endereço de Entrega</th>
                  <th className="p-4 text-center">Fidelidade</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map(c => (
                  <tr key={c.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-4 font-bold text-white">{c.name}</td>
                    <td className="p-4 font-mono text-slate-400">{c.cpfCnpj || "Não informado"}</td>
                    <td className="p-4 text-slate-300">
                      <p className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {c.email || "-"}</p>
                      <p className="flex items-center gap-1 mt-0.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {c.phone || "-"}</p>
                    </td>
                    <td className="p-4 text-slate-400 max-w-xs truncate" title={c.address}>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {c.address || "-"}</span>
                    </td>
                    <td className="p-4 text-center font-bold text-cyan-400 font-mono">
                      {c.loyaltyPoints || 0} pts
                    </td>
                    <td className="p-4 text-right space-x-1">
                      {permissions.canManageCRM && (
                        <button
                          onClick={() => handleOpenEditForm(c)}
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 hover:text-emerald-300"
                          title="Editar Cadastro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {permissions.canManageCRM && (
                        <button
                          onClick={() => {
                            if (confirm(`Excluir permanentemente ${c.name}?`)) {
                              onDeleteClient(c.id);
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
                Nenhum cliente ativo localizado.
              </div>
            )}
          </div>
        </>
      )}

      {/* --- CRUD FORM MODE --- */}
      {viewMode === "FORM" && (
        <form onSubmit={handleSaveClient} className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            {editId ? "Editar Informações do Cliente" : "Adicionar Novo Registro CRM"}
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Nome Completo / Razão Social *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
              placeholder="Ex: Maria das Graças"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">CPF / CNPJ</label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none"
                placeholder="Ex: 000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Pontos Fidelidade</label>
              <input
                type="number"
                value={loyaltyPoints}
                onChange={(e) => setLoyaltyPoints(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">E-mail de Contato</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                placeholder="exemplo@gmail.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">WhatsApp / Telefone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
                placeholder="Ex: (11) 98888-7777"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Endereço Completo de Entrega</label>
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
              <Save className="w-4 h-4" /> Gravar Ficha
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
