/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { api } from "../lib/api";
import { Company, User } from "../types";
import { Building2, Mail, Lock, User as UserIcon, Briefcase, ArrowLeft, AlertCircle, Key } from "lucide-react";

interface AuthProps {
  onAuthSuccess: (token: string, user: User, company: Company) => void;
  onBackToLanding: () => void;
  initialMode?: "login" | "register";
}

export default function Auth({ onAuthSuccess, onBackToLanding, initialMode = "login" }: AuthProps) {
  const [isLogin, setIsLogin] = useState<boolean>(initialMode === "login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await api.login("demo@erp.com", "senha123");
      api.setToken(data.token);
      onAuthSuccess(data.token, data.user, data.company);
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com a demonstração");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const trimmedCompany = company.trim();

    try {
      if (isLogin) {
        if (!trimmedEmail || !password) {
          throw new Error("Por favor, preencha todos os campos.");
        }
        const data = await api.login(trimmedEmail, password);
        api.setToken(data.token);
        onAuthSuccess(data.token, data.user, data.company);
      } else {
        if (!trimmedName || !trimmedCompany || !trimmedEmail || !password) {
          throw new Error("Todos os campos do formulário são obrigatórios.");
        }
        const data = await api.register(trimmedName, trimmedCompany, trimmedEmail, password);
        api.setToken(data.token);
        onAuthSuccess(data.token, data.user, data.company);
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Back Button */}
      <button 
        onClick={onBackToLanding}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao início
      </button>

      {/* Main Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-md">
        
        {/* Branding Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 w-fit mb-3">
            <Building2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            LEXPRO
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isLogin ? "Acesse sua conta corporativa isolada" : "Crie uma nova empresa lógica e inicie"}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-lg mb-6 border border-slate-800">
          <button
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`py-2 text-xs font-bold rounded-md transition-all ${
              isLogin ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Acessar Sistema
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`py-2 text-xs font-bold rounded-md transition-all ${
              !isLogin ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Cadastrar Empresa
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-2 text-sm leading-relaxed">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <>
              {/* Owner Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Seu Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome da Empresa / Razão Social
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ex: Auto Peças São Paulo Ltda"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              E-mail Corporativo
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Senha de Acesso
              </label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={() => alert("Para redefinir a senha do ambiente isolado, contate o administrador da sua empresa ou suporte.")}
                  className="text-[10px] text-emerald-400 font-bold hover:underline"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/15 focus:outline-none disabled:opacity-50 flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : isLogin ? (
              "Entrar no ERP"
            ) : (
              "Iniciar Minha Empresa"
            )}
          </button>
        </form>

        {/* Quick Demo Helper */}
        {isLogin && (
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <p className="text-xs text-slate-500 text-center mb-3">
              Quer testar o sistema imediatamente? Use a empresa de testes pré-carregada!
            </p>
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Key className="w-4 h-4" /> Logar com Empresa Demo (senha123)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
