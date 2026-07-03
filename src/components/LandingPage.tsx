/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Building2, ShoppingCart, DollarSign, Package, FileText, ClipboardList, ShieldCheck, 
  HelpCircle, MessageCircle, ArrowRight, UserPlus, LogIn, CheckCircle2, ChevronDown, Monitor, Laptop, Tablet, Smartphone
} from "lucide-react";

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export default function LandingPage({ onLoginClick, onRegisterClick }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <ShoppingCart className="w-10 h-10 text-emerald-400" />,
      title: "PDV Ultra Rápido",
      desc: "Venda no caixa em menos de 3 segundos. Atalhos no teclado, busca rápida por código de barras, múltiplos pagamentos, cálculo automático de troco e impressão térmica automatizada."
    },
    {
      icon: <Package className="w-10 h-10 text-cyan-400" />,
      title: "Controle de Estoque Inteligente",
      desc: "Entradas, saídas, curva ABC de relevância de mercadorias, controle detalhado de lotes/vencimento e notificações automáticas de estoque baixo ou zerado."
    },
    {
      icon: <DollarSign className="w-10 h-10 text-amber-400" />,
      title: "Gestão Financeira e Fluxo de Caixa",
      desc: "Contas a pagar e a receber, centro de custos, demonstrativo de lucros e despesas e comissionamento de funcionários integrado."
    },
    {
      icon: <FileText className="w-10 h-10 text-blue-400" />,
      title: "Orçamentos e Motor Tributário",
      desc: "Orçamentos elegantes com logotipo próprio. Copie a proposta formatada para WhatsApp em um clique. Motor tributário integrado para ICMS, IPI, PIS, COFINS e regimes fiscais."
    },
    {
      icon: <ClipboardList className="w-10 h-10 text-purple-400" />,
      title: "Ordem de Serviço (O.S.)",
      desc: "Gestão completa para prestadores de serviços, oficinas e assistências técnicas. Cadastro de equipamentos, marcas, laudos, serviços executados e peças utilizadas."
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-indigo-400" />,
      title: "Segurança e Backups Documentais",
      desc: "Separação lógica total por empresa. Criptografia de ponta e backups duplos: exporte a base de dados JSON e faça o download documental automático em PDF das suas tabelas."
    }
  ];

  const plans = [
    {
      name: "Plano Starter",
      price: "R$ 59,90",
      period: "/mês",
      desc: "Perfeito para microempreendedores e comércios individuais.",
      features: [
        "1 Empresa (Banco isolado)",
        "Administrador + 1 Funcionário",
        "PDV Rápido e Orçamentos",
        "Controle de Estoque básico",
        "Backup de dados lógico JSON",
        "Suporte por E-mail"
      ],
      popular: false
    },
    {
      name: "Plano Pro",
      price: "R$ 119,90",
      period: "/mês",
      desc: "A melhor escolha para comércios e prestadores de serviço em crescimento.",
      features: [
        "1 Empresa (Banco isolado)",
        "Administrador + up to 4 Funcionários",
        "PDV Rápido, Orçamentos e O.S.",
        "Estoque Completo + Alertas + Lotes",
        "Financeiro Completo (DRE, Caixa)",
        "Backup Lógico + Backup Documental PDF",
        "Catálogo Digital Exclusivo QR Code",
        "Suporte Prioritário WhatsApp"
      ],
      popular: true
    }
  ];

  const faqs = [
    {
      q: "Meus dados estarão realmente isolados de outras empresas?",
      a: "Sim, absolutamente. Nosso sistema utiliza uma arquitetura multi-tenant lógica estrita. Cada empresa tem seu próprio diretório físico e arquivos lógicos de armazenamento criptografados. É impossível que um usuário visualize, modifique ou acesse qualquer dado fora da sua própria empresa."
    },
    {
      q: "Preciso instalar algum software nos meus computadores?",
      a: "Não. O sistema funciona 100% em nuvem e roda diretamente no navegador de qualquer dispositivo, seja computador, tablet, celular ou impressora de rede. Você pode gerenciar seu negócio de qualquer lugar do mundo."
    },
    {
      q: "Como funciona o backup documental em PDF?",
      a: "Diferente de sistemas comuns que apenas geram arquivos compactados ilegíveis, o nosso gera um arquivo estruturado que compila os principais cadastros de produtos, clientes, movimentações de vendas e financeiro em relatórios HTML/PDF totalmente organizados por pastas. Se você precisar parar o serviço, seus relatórios vitais continuam com você para leitura offline instantânea."
    },
    {
      q: "Posso utilizar leitores de código de barras e impressoras térmicas?",
      a: "Sim! Nosso PDV é otimizado para o padrão de mercado. Leitores de código de barras simulam entrada de teclado e funcionam imediatamente. A impressão térmica de cupons de 58mm/80mm é totalmente suportada com formatação adequada de corte automático."
    },
    {
      q: "O que é o motor tributário configurável?",
      a: "É uma calculadora fiscal que você configura nas configurações da sua empresa de acordo com seu regime tributário (Simples Nacional, Lucro Presumido ou Lucro Real). Ela calcula automaticamente os custos fiscais integrados nas vendas e orçamentos de produtos, detalhando as alíquotas de ICMS, IPI, PIS, COFINS ou ISS."
    }
  ];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-emerald-400" />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              LEXPRO
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Recursos</a>
            <a href="#plans" className="hover:text-emerald-400 transition-colors">Planos</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-emerald-400 transition-colors">Contato</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={onLoginClick}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent transition-all"
            >
              <LogIn className="w-4 h-4" /> Entrar
            </button>
            <button 
              onClick={onRegisterClick}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20"
            >
              <UserPlus className="w-4 h-4" /> Criar Conta
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 mb-6 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Novo: Backup Documental Estruturado e O.S. Integrada
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              A gestão completa do seu comércio <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">em um só lugar</span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              Simplifique o faturamento, controle seu estoque com alerta automático de vencimento e cuide do seu caixa. Ideal para lojas, mercados, oficinas, oficinas mecânicas e comércios em geral.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button 
                onClick={onRegisterClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/10 hover:shadow-emerald-400/20 transition-all"
              >
                Começar Teste Grátis <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={onLoginClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all"
              >
                Acessar Demonstração
              </button>
            </div>
          </div>

          {/* Interactive UI Mockup */}
          <div className="mt-16 rounded-xl border border-slate-800 bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xl shadow-2xl relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 overflow-hidden relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-xs text-slate-500 font-mono ml-2">https://lexpro.app/dashboard</span>
                </div>
                <div className="flex gap-2">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <Tablet className="w-4 h-4 text-slate-500" />
                  <Smartphone className="w-4 h-4 text-slate-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800/80">
                  <p className="text-xs text-slate-400 font-medium">Vendas do Dia (Faturamento)</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">R$ 5.548,00</p>
                  <p className="text-xs text-slate-500 mt-1">+12% em relação a ontem</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800/80">
                  <p className="text-xs text-slate-400 font-medium">Lucro Líquido Estimado</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-1">R$ 2.140,50</p>
                  <p className="text-xs text-slate-500 mt-1">Margem média de 38.5%</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800/80">
                  <p className="text-xs text-slate-400 font-medium">Alertas de Estoque Crítico</p>
                  <p className="text-2xl font-bold text-amber-500 mt-1">3 Produtos</p>
                  <p className="text-xs text-slate-500 mt-1">Necessitam reposição imediata</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-900/40 border-t border-b border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Equipado com recursos de nível Enterprise
            </h2>
            <p className="text-slate-400 text-base">
              Nosso sistema foi desenvolvido do zero para ser extremamente performático, unindo módulos financeiros, orçamentários, fiscais e operacionais em uma interface fácil e amigável.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, idx) => (
              <div 
                key={idx} 
                className="p-6 rounded-xl border border-slate-800/60 bg-slate-950/60 hover:bg-slate-900 hover:border-slate-700 transition-all group duration-300"
              >
                <div className="mb-4 p-3 rounded-lg bg-slate-900 w-fit group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Planos simples, transparentes e sob medida
            </h2>
            <p className="text-slate-400 text-base">
              Sem taxas escondidas. Sem taxas de instalação. Altere ou cancele seu plano a qualquer momento. Experimente gratuitamente por 7 dias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8 items-stretch">
            {plans.map((p, idx) => (
              <div 
                key={idx}
                className={`rounded-2xl border p-8 flex flex-col justify-between relative transition-all duration-300 ${
                  p.popular 
                    ? "bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-500/50 shadow-xl shadow-emerald-500/5 scale-100 md:scale-105" 
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-xs font-extrabold uppercase px-4 py-1.5 rounded-full tracking-wider shadow-lg">
                    Mais Escolhido
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                  <p className="text-xs text-slate-400 mb-6">{p.desc}</p>
                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">{p.price}</span>
                    <span className="text-sm text-slate-400">{p.period}</span>
                  </div>
                  <ul className="space-y-3.5 mb-8">
                    {p.features.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  disabled
                  className="w-full py-3 px-4 rounded-lg text-sm font-bold transition-all bg-slate-900 border border-slate-800 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Em manutenção
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="py-24 bg-slate-900/30 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-2">
              <HelpCircle className="w-8 h-8 text-emerald-400" /> Perguntas Frequentes
            </h2>
            <p className="text-slate-400 text-sm">
              Tudo o que você precisa saber sobre a nossa plataforma. Se ainda tiver dúvidas, entre em contato.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="rounded-xl border border-slate-800/80 bg-slate-950/40 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 flex items-center justify-between text-left text-base font-bold text-white hover:bg-slate-900/60 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${activeFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-sm text-slate-400 leading-relaxed border-t border-slate-900 bg-slate-950/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Floating WhatsApp Button */}
      <a 
        href="https://wa.me/5511987654321?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20o%20LexPro"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center cursor-pointer group"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold text-sm whitespace-nowrap">
          Falar no WhatsApp
        </span>
      </a>

      {/* Footer */}
      <footer id="contact" className="bg-slate-950 border-t border-slate-900 py-12 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-base tracking-tight text-white">LEXPRO</span>
          </div>
          <p>© 2026 LexPro Ltda. CNPJ: 12.345.678/0001-90. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-emerald-400">Termos de Uso</a>
            <a href="#" className="hover:text-emerald-400">Políticas de Privacidade</a>
            <a href="#" className="hover:text-emerald-400">Suporte Técnico</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
