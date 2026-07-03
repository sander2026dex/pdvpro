/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Package, Plus, Search, Edit2, Trash2, Layers, AlertCircle, FileSpreadsheet, Eye, 
  QrCode, Share2, Tag, Percent, ArrowLeft, Image, Save, ChevronRight, Check, X, Calendar
} from "lucide-react";
import { Product, Batch, Supplier } from "../types";

interface ProductsProps {
  products: Product[];
  suppliers: Supplier[];
  onCreateProduct: (data: Partial<Product>) => Promise<Product>;
  onUpdateProduct: (id: string, data: Partial<Product>) => Promise<Product>;
  onDeleteProduct: (id: string) => Promise<void>;
  permissions: any;
}

export default function Products({ products, suppliers, onCreateProduct, onUpdateProduct, onDeleteProduct, permissions }: ProductsProps) {
  // Navigation
  const [viewMode, setViewMode] = useState<"LIST" | "FORM" | "CATALOG">("LIST");
  
  // Search and Filter
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // CRUD Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [barcode, setBarcode] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [promoPrice, setPromoPrice] = useState<number | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(0);
  const [minQuantity, setMinQuantity] = useState<number>(5);
  const [unit, setUnit] = useState<string>("UN");
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [length, setLength] = useState<number | undefined>(undefined);
  const [ncm, setNcm] = useState<string>("");
  const [cfop, setCfop] = useState<string>("");
  const [origem, setOrigem] = useState<string>("0");
  const [active, setActive] = useState<boolean>(true);

  // Batch states
  const [batches, setBatches] = useState<Batch[]>([]);
  const [newLote, setNewLote] = useState<string>("");
  const [newLoteExp, setNewLoteExp] = useState<string>("");
  const [newLoteQty, setNewLoteQty] = useState<number>(0);

  // Digital Catalog Selected product
  const [catalogProduct, setCatalogProduct] = useState<Product | null>(null);

  // Categories list
  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  }, [products]);

  // Filtered List
  const filteredList = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.code.toLowerCase().includes(search.toLowerCase()) ||
                          p.sku.toLowerCase().includes(search.toLowerCase()) ||
                          p.barcode.includes(search);
      const matchCat = selectedCategory ? p.category === selectedCategory : true;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  const handleOpenCreateForm = () => {
    setEditId(null);
    setName("");
    setCode("");
    setBarcode("");
    setSku("");
    setCategory("Geral");
    setBrand("");
    setSupplierId("");
    setDescription("");
    setCostPrice(0);
    setSellPrice(0);
    setPromoPrice(undefined);
    setQuantity(0);
    setMinQuantity(5);
    setUnit("UN");
    setWeight(undefined);
    setWidth(undefined);
    setHeight(undefined);
    setLength(undefined);
    setNcm("");
    setCfop("");
    setOrigem("0");
    setActive(true);
    setBatches([]);
    setViewMode("FORM");
  };

  const handleOpenEditForm = (p: Product) => {
    setEditId(p.id);
    setName(p.name);
    setCode(p.code);
    setBarcode(p.barcode);
    setSku(p.sku);
    setCategory(p.category);
    setBrand(p.brand);
    setSupplierId(p.supplierId || "");
    setDescription(p.description);
    setCostPrice(p.costPrice);
    setSellPrice(p.sellPrice);
    setPromoPrice(p.promoPrice);
    setQuantity(p.quantity);
    setMinQuantity(p.minQuantity);
    setUnit(p.unit);
    setWeight(p.weight);
    setWidth(p.width);
    setHeight(p.height);
    setLength(p.length);
    setNcm(p.ncm || "");
    setCfop(p.cfop || "");
    setOrigem(p.origem || "0");
    setActive(p.active);
    setBatches(p.batches || []);
    setViewMode("FORM");
  };

  const handleAddBatch = () => {
    if (!newLote || !newLoteExp || newLoteQty <= 0) {
      alert("Preencha lote, vencimento e quantidade");
      return;
    }
    const newBatch: Batch = {
      id: `b_${Date.now()}`,
      lote: newLote,
      expirationDate: newLoteExp,
      quantity: newLoteQty
    };
    setBatches([...batches, newBatch]);
    setNewLote("");
    setNewLoteExp("");
    setNewLoteQty(0);
  };

  const handleRemoveBatch = (bId: string) => {
    setBatches(batches.filter(b => b.id !== bId));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || sellPrice <= 0) {
      alert("Nome e Preço de Venda são obrigatórios.");
      return;
    }

    const payload: Partial<Product> = {
      name,
      code: code || undefined,
      barcode: barcode || undefined,
      sku: sku || undefined,
      category,
      brand,
      supplierId: supplierId || undefined,
      description,
      costPrice,
      sellPrice,
      promoPrice: promoPrice || undefined,
      quantity,
      minQuantity,
      unit,
      weight,
      width,
      height,
      length,
      ncm,
      cfop,
      origem,
      active,
      batches
    };

    try {
      if (editId) {
        await onUpdateProduct(editId, payload);
      } else {
        await onCreateProduct(payload);
      }
      setViewMode("LIST");
    } catch (err: any) {
      alert(err.message || "Erro ao salvar produto");
    }
  };

  const handleOpenCatalog = (p: Product) => {
    setCatalogProduct(p);
    setViewMode("CATALOG");
  };

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-10">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-400" /> Fichário de Produtos
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão física de estoque, tributação e catálogo virtual.
          </p>
        </div>
        
        {viewMode === "LIST" && permissions.canAccessStock && (
          <button
            onClick={handleOpenCreateForm}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase rounded-lg shadow cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        )}

        {viewMode !== "LIST" && (
          <button
            onClick={() => setViewMode("LIST")}
            className="flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs rounded-lg text-slate-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar à lista
          </button>
        )}
      </div>

      {/* --- LIST MODE --- */}
      {viewMode === "LIST" && (
        <>
          {/* Filters shelf */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/30 border border-slate-800 p-4 rounded-xl">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por nome, SKU, código..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="">Todas as Categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end text-xs text-slate-500 font-mono">
              Listando {filteredList.length} de {products.length} produtos
            </div>
          </div>

          {/* Grid listing */}
          <div className="border border-slate-800 bg-slate-900/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/10">
                  <th className="p-4">Foto / Item</th>
                  <th className="p-4">Cod / SKU</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4 text-right">Preço Venda</th>
                  <th className="p-4 text-center">Estoque</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map(p => {
                  const isLow = p.quantity > 0 && p.quantity <= p.minQuantity;
                  const isZero = p.quantity === 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4 font-bold text-slate-200">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-600">
                            <Image className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-white font-bold leading-tight">{p.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        <p>{p.code}</p>
                        <p className="text-[9px] text-slate-600">SKU: {p.sku}</p>
                      </td>
                      <td className="p-4 text-slate-400">{p.category}</td>
                      <td className="p-4 text-right">
                        {p.promoPrice ? (
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 line-through">R$ {p.sellPrice.toFixed(2)}</span>
                            <p className="font-bold text-emerald-400">R$ {p.promoPrice.toFixed(2)}</p>
                          </div>
                        ) : (
                          <span className="font-bold text-white">R$ {p.sellPrice.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] font-mono ${
                          isZero 
                            ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                            : isLow 
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {p.quantity} {p.unit}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          p.active ? "bg-emerald-950/40 text-emerald-400" : "bg-red-950/40 text-red-400"
                        }`}>
                          {p.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenCatalog(p)}
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:border-slate-700"
                          title="Visualizar no Catálogo Digital"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {permissions.canAccessStock && (
                          <button
                            onClick={() => handleOpenEditForm(p)}
                            className="p-1.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 hover:text-emerald-300 hover:border-slate-700"
                            title="Editar Cadastro"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {permissions.canExcludeProduct && (
                          <button
                            onClick={() => {
                              if (confirm(`Excluir permanentemente ${p.name}?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 rounded bg-slate-950 border border-slate-800 text-red-400 hover:text-red-300 hover:border-slate-700"
                            title="Excluir"
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
            {filteredList.length === 0 && (
              <div className="py-20 text-center text-slate-500 italic">
                Nenhum produto correspondente cadastrado.
              </div>
            )}
          </div>
        </>
      )}

      {/* --- CRUD FORM MODE --- */}
      {viewMode === "FORM" && (
        <form onSubmit={handleSaveProduct} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Main specifications */}
            <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Informações Primárias</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: Teclado Mecânico HyperX"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Código de Referência</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: TEC001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Código de Barras (EAN-13)</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: 78900000001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">SKU (Ficha)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: ACC-KEY-KB"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Unidade de Medida</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="KG">KG (Quilo)</option>
                    <option value="LT">LT (Litro)</option>
                    <option value="MT">MT (Metro)</option>
                    <option value="PCT">PCT (Pacote)</option>
                    <option value="CX">CX (Caixa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Categoria</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: Informática, Papelaria..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Marca / Fabricante</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: Logitech, Samsung..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Descrição Detalhada do Catálogo</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-emerald-500 min-h-20"
                  placeholder="Informações adicionais, especificações técnicas, compatibilidade do item..."
                />
              </div>

              {/* Taxation details panel */}
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pt-3 pb-2 flex items-center gap-1">
                Tributos & NCM
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Código NCM</label>
                  <input
                    type="text"
                    value={ncm}
                    onChange={(e) => setNcm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: 8471.30.12"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Código CFOP Padrão</label>
                  <input
                    type="text"
                    value={cfop}
                    onChange={(e) => setCfop(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: 5102"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Origem da Mercadoria</label>
                  <select
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="0">0 - Nacional</option>
                    <option value="1">1 - Estrangeira (Importação direta)</option>
                    <option value="2">2 - Estrangeira (Adquirida interna)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Col: Cost and inventories panel */}
            <div className="space-y-6">
              
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Valores & Custos</h3>
                
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice || ""}
                    onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Preço de Venda Praticado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellPrice || ""}
                    onChange={(e) => setSellPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Preço Promocional (Opcional - R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={promoPrice || ""}
                    onChange={(e) => setPromoPrice(parseFloat(e.target.value) || undefined)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded bg-slate-950 border-slate-800"
                  />
                  <label htmlFor="is_active" className="text-xs font-bold text-slate-300 select-none">Disponível para venda (Ativo)</label>
                </div>
              </div>

              {/* Quantidade em estoque panel */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Gestão de Estoque</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Quantidade Atual</label>
                    <input
                      type="number"
                      value={quantity || ""}
                      onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Estoque Mínimo</label>
                    <input
                      type="number"
                      value={minQuantity || ""}
                      onChange={(e) => setMinQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                      placeholder="5"
                    />
                  </div>
                </div>

                {/* Batch Panel inside inventory */}
                <div className="pt-2 border-t border-slate-800/60">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Controle de Lotes / Validade</h4>
                  
                  <div className="space-y-2 mb-3 max-h-24 overflow-y-auto pr-1">
                    {batches.map(b => (
                      <div key={b.id} className="flex justify-between items-center text-[10px] bg-slate-950 border border-slate-850 p-1.5 rounded">
                        <div>
                          <span className="font-bold text-white">Lote: {b.lote}</span>
                          <span className="text-slate-500 ml-2">Venc: {new Date(b.expirationDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-cyan-400 font-bold">{b.quantity} un</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveBatch(b.id)}
                            className="p-1 hover:bg-slate-900 rounded text-red-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-1 items-end">
                    <input
                      type="text"
                      value={newLote}
                      onChange={(e) => setNewLote(e.target.value)}
                      placeholder="Lote"
                      className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-white focus:outline-none"
                    />
                    <input
                      type="date"
                      value={newLoteExp}
                      onChange={(e) => setNewLoteExp(e.target.value)}
                      className="px-1 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-white focus:outline-none"
                    />
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={newLoteQty || ""}
                        onChange={(e) => setNewLoteQty(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="Qtd"
                        className="w-10 px-1 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-white focus:outline-none text-center"
                      />
                      <button
                        type="button"
                        onClick={handleAddBatch}
                        className="px-2 bg-slate-800 text-white rounded text-xs hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className="px-5 py-2.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Save className="w-4 h-4" /> Gravar Ficha técnica
            </button>
          </div>
        </form>
      )}

      {/* --- EXCLUSIVE DIGITAL CATALOG PORTAL VIEW --- */}
      {viewMode === "CATALOG" && catalogProduct && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative p-6">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-full w-fit mb-6">
            <Tag className="w-4 h-4" /> LEXPRO DIGITAL CATALOG MODE
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Catalog product visual info */}
            <div className="space-y-4">
              <div className="aspect-square rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-600 relative overflow-hidden">
                <Image className="w-12 h-12 mb-2" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Visual da Ficha Principal</span>
              </div>
              <h2 className="text-xl font-bold text-white">{catalogProduct.name}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{catalogProduct.description || "Nenhuma descrição técnica adicionada a este item no momento."}</p>
              
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Preço Exclusivo de Venda</p>
                <p className="text-3xl font-black text-emerald-400 font-mono mt-1">
                  R$ {catalogProduct.sellPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                {catalogProduct.promoPrice && (
                  <p className="text-xs text-amber-400 font-bold mt-1">
                    ✓ Oferta Relâmpago: R$ {catalogProduct.promoPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>

            {/* Catalog sharing utilities */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center gap-5 text-center">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Código de Compartilhamento</h4>
              
              {/* Mock QR Code drawing */}
              <div className="p-3 bg-white rounded-lg flex flex-col items-center gap-1 shadow-lg relative group">
                <div className="grid grid-cols-4 gap-1 p-2 bg-slate-900 rounded">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span 
                      key={i} 
                      className={`w-6 h-6 rounded ${Math.random() > 0.45 ? "bg-white" : "bg-emerald-400"}`}
                    ></span>
                  ))}
                </div>
                <span className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider mt-1.5">QR CODE DO PRODUTO</span>
              </div>

              <div className="w-full space-y-2.5 text-xs">
                <p className="text-[10px] text-slate-400">Este QR Code direciona clientes diretamente para a finalização deste item no WhatsApp.</p>
                
                <button
                  onClick={() => {
                    const text = `Confira nosso produto: *${catalogProduct.name}* no valor de R$ ${catalogProduct.sellPrice.toFixed(2)}!\nLink exclusivo: https://lexpro.app/catalog/${catalogProduct.id}`;
                    navigator.clipboard.writeText(text);
                    alert("Link do catálogo digital copiado para área de transferência!");
                  }}
                  className="w-full py-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" /> Copiar Link do Produto
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Olá! Confira nosso produto no catálogo digital: *${catalogProduct.name}* - R$ ${catalogProduct.sellPrice.toFixed(2)}. Link: https://lexpro.app/catalog/${catalogProduct.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5"
                >
                  Compartilhar no WhatsApp
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
