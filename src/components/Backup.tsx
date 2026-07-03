/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { HardDrive, Download, FileArchive, CheckCircle2, AlertCircle, RefreshCw, Printer } from "lucide-react";
import { api } from "../lib/api";

export default function Backup() {
  const [loadingDb, setLoadingDb] = useState<boolean>(false);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Documental backup files outputted
  const [docBackupFolder, setDocBackupFolder] = useState<string | null>(null);
  const [docBackupFiles, setDocBackupFiles] = useState<{ name: string; title: string; content: string }[]>([]);

  const handleExportDB = async () => {
    setLoadingDb(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const data = await api.exportDatabaseBackup();
      
      // Create trigger to download JSON file locally
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lexpro_database_backup_${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg("Banco de dados físico JSON exportado e baixado com sucesso!");
    } catch (err: any) {
      setErrorMsg(err.message || "Falha ao realizar exportação do banco de dados");
    } finally {
      setLoadingDb(false);
    }
  };

  const handleExportDoc = async () => {
    setLoadingDoc(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const data = await api.exportDocumentalBackup();
      setDocBackupFolder(data.folderName);
      setDocBackupFiles(data.files);
      setSuccessMsg(`Backup documental gerado com sucesso no diretório virtual '${data.folderName}'!`);
    } catch (err: any) {
      setErrorMsg(err.message || "Falha ao gerar dossiê de relatórios documental");
    } finally {
      setLoadingDoc(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-10 max-w-4xl">
      
      {/* HEADER ROW */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-emerald-400" /> Central de Salvaguarda & Backups
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Gere réplicas lógicas instantâneas dos seus dados estruturados para salvamento físico offline.
        </p>
      </div>

      {/* Notifications banners */}
      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Physical database */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col justify-between h-64">
          <div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg w-fit mb-4">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Exportar JSON Físico</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Realiza uma cópia bruta estruturada de todos os cadastros, vendas e movimentações financeiras da empresa, descarregando um arquivo compactado localmente.
            </p>
          </div>

          <button
            onClick={handleExportDB}
            disabled={loadingDb}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            {loadingDb ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Baixar Banco de Dados"
            )}
          </button>
        </div>

        {/* Card 2: Documental backup (PDF dossiers) */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col justify-between h-64">
          <div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg w-fit mb-4">
              <FileArchive className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gerar Backup Documental</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Consolida relatórios detalhados, orçamentos, faturamento de caixa e tabelas de estoque em arquivos HTML independentes offline com formatação profissional de impressão.
            </p>
          </div>

          <button
            onClick={handleExportDoc}
            disabled={loadingDoc}
            className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            {loadingDoc ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Compilar Dossiê Documental"
            )}
          </button>
        </div>

      </div>

      {/* Render Documental Reports list when generated */}
      {docBackupFiles.length > 0 && (
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 space-y-4">
          <div className="border-b border-slate-850 pb-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Documentos Consolidados no Dossiê ({docBackupFolder})</h3>
            <p className="text-[10px] text-slate-500 mt-1">Clique nos botões abaixo para abrir cada relatório e acionar a impressão física / salvar em PDF.</p>
          </div>

          <div className="space-y-3">
            {docBackupFiles.map((f, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-950 border border-slate-850">
                <div>
                  <p className="text-xs font-bold text-white">{f.title}</p>
                  <p className="text-[10px] font-mono text-slate-500">{f.name}</p>
                </div>
                
                <button
                  onClick={() => {
                    // Open a new popup window with the HTML content and immediate print command
                    const win = window.open("", "_blank");
                    if (win) {
                      win.document.write(f.content);
                      win.document.close();
                    } else {
                      alert("Por favor, ative a exibição de popups para visualizar o dossiê.");
                    }
                  }}
                  className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-cyan-400"
                >
                  <Printer className="w-3.5 h-3.5" /> Abrir e Imprimir / PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
