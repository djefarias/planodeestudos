'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Eye, Plus, X, Save, Loader2, ChevronDown, ChevronRight,
  FileText, Lightbulb, Target, BookOpen, Link2, Trash2
} from 'lucide-react';

interface Topico {
  id: string;
  nome: string;
  link: string | null;
  concluido: boolean;
}

interface Materia {
  id: string;
  nome: string;
  cor: string;
  topicos: Topico[];
}

interface MaterialEstudo {
  id: string;
  nome: string;
  link: string;
  categoria: string;
}

const CATEGORIAS: Record<string, { label: string; icon: any; color: string }> = {
  testes: { label: 'Testes e Questões', icon: Target, color: 'bg-rose-50 text-rose-600 border-rose-200' },
  dicas: { label: 'Dicas de Estudo', icon: Lightbulb, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  estrategia: { label: 'Estratégia da Banca', icon: FileText, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  plano: { label: 'Plano de Estudos', icon: BookOpen, color: 'bg-teal-50 text-teal-600 border-teal-200' },
  geral: { label: 'Geral', icon: FolderOpen, color: 'bg-gray-50 text-gray-600 border-gray-200' },
};

export default function MateriaisContent() {
  const router = useRouter();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materiaisGerais, setMateriaisGerais] = useState<MaterialEstudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAddPdf, setShowAddPdf] = useState<string | null>(null); // materiaId
  const [pdfForm, setPdfForm] = useState({ nome: '', link: '' });
  const [saving, setSaving] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [materialForm, setMaterialForm] = useState({ nome: '', link: '', categoria: 'geral' });

  const fetchData = useCallback(async () => {
    try {
      const [materiaRes, matRes] = await Promise.all([
        fetch('/api/materias'),
        fetch('/api/materiais'),
      ]);
      if (materiaRes.ok) setMaterias(await materiaRes.json() ?? []);
      if (matRes.ok) setMateriaisGerais(await matRes.json() ?? []);
    } catch (err: any) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openViewer = (link: string, title: string) => {
    const params = new URLSearchParams({ url: link, title, back: '/materiais' });
    router.push(`/materiais/viewer?${params.toString()}`);
  };

  const addPdfToMateria = async () => {
    if (!pdfForm.nome.trim() || !pdfForm.link.trim() || !showAddPdf) return;
    setSaving(true);
    try {
      const res = await fetch('/api/topicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: pdfForm.nome, materiaId: showAddPdf, link: pdfForm.link }),
      });
      if (res.ok) {
        await fetchData();
        setShowAddPdf(null);
        setPdfForm({ nome: '', link: '' });
      }
    } catch (err: any) { console.error(err); }
    setSaving(false);
  };

  const addMaterialGeral = async () => {
    if (!materialForm.nome.trim() || !materialForm.link.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/materiais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialForm),
      });
      if (res.ok) {
        await fetchData();
        setShowAddMaterial(false);
        setMaterialForm({ nome: '', link: '', categoria: 'geral' });
      }
    } catch (err: any) { console.error(err); }
    setSaving(false);
  };

  const deletePdf = async (topicoId: string) => {
    if (!confirm('Remover este PDF?')) return;
    try {
      await fetch(`/api/topicos/${topicoId}`, { method: 'DELETE' });
      await fetchData();
    } catch (err: any) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  // Filter materias that have at least one topico with a link
  const materiasComPdfs = materias.filter(m => m.topicos.some(t => t.link));
  const materiasVazias = materias.filter(m => !m.topicos.some(t => t.link));

  // Group materiais gerais by categoria
  const grouped: Record<string, MaterialEstudo[]> = {};
  for (const m of materiaisGerais) {
    const cat = m?.categoria ?? 'geral';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(m);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materiais de Estudo</h1>
          <p className="text-gray-500 mt-1">PDFs organizados por matéria — clique para abrir</p>
        </div>
        <button
          onClick={() => setShowAddMaterial(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" /> Novo Material
        </button>
      </div>

      {/* Matérias com PDFs */}
      {materiasComPdfs.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> PDFs por Matéria
          </h2>
          <div className="space-y-3">
            {materiasComPdfs.map((materia) => {
              const pdfs = materia.topicos.filter(t => t.link);
              const isOpen = expanded[materia.id];
              return (
                <div key={materia.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [materia.id]: !prev[materia.id] }))}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: materia.cor + '20' }}>
                      <FolderOpen className="w-5 h-5" style={{ color: materia.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{materia.nome}</p>
                      <p className="text-xs text-gray-400">{pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''}</p>
                    </div>
                    {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-2">
                          {pdfs.map((topico) => (
                            <div
                              key={topico.id}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group"
                            >
                              <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                              <button
                                onClick={() => openViewer(topico.link!, topico.nome)}
                                className="flex-1 text-left min-w-0"
                              >
                                <p className="font-medium text-sm text-gray-800 truncate group-hover:text-indigo-700">{topico.nome}</p>
                                <p className="text-xs text-gray-400">Clique para abrir o PDF</p>
                              </button>
                              <button
                                onClick={() => openViewer(topico.link!, topico.nome)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors flex-shrink-0"
                                title="Visualizar PDF"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deletePdf(topico.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {/* Add PDF button */}
                          <button
                            onClick={() => { setShowAddPdf(materia.id); setPdfForm({ nome: '', link: '' }); }}
                            className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors text-sm"
                          >
                            <Plus className="w-4 h-4" /> Adicionar PDF
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Matérias sem PDFs ainda */}
      {materiasVazias.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-500 flex items-center gap-2 text-sm">
            <FolderOpen className="w-4 h-4" /> Matérias sem PDFs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {materiasVazias.map((m) => (
              <button
                key={m.id}
                onClick={() => { setShowAddPdf(m.id); setPdfForm({ nome: '', link: '' }); }}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.cor + '20' }}>
                  <FolderOpen className="w-5 h-5" style={{ color: m.cor }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-600 group-hover:text-indigo-700">{m.nome}</p>
                  <p className="text-xs text-gray-400">Clique para adicionar PDFs</p>
                </div>
                <Plus className="w-4 h-4 text-gray-300 group-hover:text-indigo-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Materiais gerais por categoria */}
      {Object.entries(grouped).map(([cat, items], groupIdx) => {
        const catInfo = CATEGORIAS[cat] ?? CATEGORIAS.geral;
        const CatIcon = catInfo.icon;
        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIdx * 0.1 }}
            className="space-y-3"
          >
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <CatIcon className="w-5 h-5" /> {catInfo.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(items ?? []).map((item) => (
                <button
                  key={item.id}
                  onClick={() => openViewer(item.link, item.nome)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md group text-left w-full ${catInfo.color}`}
                >
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate block">{item.nome}</span>
                    <span className="text-xs opacity-60">Clique para abrir</span>
                  </div>
                  <Eye className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Modal: Adicionar PDF a uma matéria */}
      <AnimatePresence>
        {showAddPdf && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddPdf(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Adicionar PDF</h2>
                <button onClick={() => setShowAddPdf(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Adicione o link do Google Drive do PDF. Use o link de compartilhamento ("Qualquer pessoa com o link pode ver").
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do PDF</label>
                  <input
                    type="text"
                    value={pdfForm.nome}
                    onChange={(e) => setPdfForm(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Administração Pública"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link do Google Drive</label>
                  <input
                    type="url"
                    value={pdfForm.link}
                    onChange={(e) => setPdfForm(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Cole o link de compartilhamento do PDF no Google Drive</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddPdf(null)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addPdfToMateria}
                    disabled={saving || !pdfForm.nome.trim() || !pdfForm.link.trim()}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Adicionar Material Geral */}
      <AnimatePresence>
        {showAddMaterial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddMaterial(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Novo Material</h2>
                <button onClick={() => setShowAddMaterial(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={materialForm.nome}
                    onChange={(e) => setMaterialForm({ ...materialForm, nome: e.target.value })}
                    placeholder="Ex: Apostila de Direito Penal"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link do Google Drive</label>
                  <input
                    type="url"
                    value={materialForm.link}
                    onChange={(e) => setMaterialForm({ ...materialForm, link: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={materialForm.categoria}
                    onChange={(e) => setMaterialForm({ ...materialForm, categoria: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(CATEGORIAS).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addMaterialGeral}
                  disabled={saving || !materialForm.nome.trim() || !materialForm.link.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Salvar Material
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
