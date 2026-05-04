'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Edit3, Trash2, X, Save, Loader2,
  ChevronDown, ChevronUp, PlusCircle, ExternalLink
} from 'lucide-react';

const CORES = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363', '#80D8C3', '#A19AD3', '#72BF78', '#F4A261', '#E76F51', '#2A9D8F', '#264653'];

interface Topico { id: string; nome: string; link?: string | null; concluido: boolean; }
interface Materia { id: string; nome: string; peso: number; questoes: number; cor: string; driveLink?: string | null; topicos: Topico[]; }

export default function MateriasContent() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: '', peso: 1, questoes: 10, cor: '#60B5FF', topicos: '', driveLink: '' });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newTopico, setNewTopico] = useState('');
  const [addingTopico, setAddingTopico] = useState(false);

  const fetchMaterias = useCallback(async () => {
    try {
      const res = await fetch('/api/materias');
      if (res.ok) setMaterias(await res.json() ?? []);
    } catch (err: any) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMaterias(); }, [fetchMaterias]);

  const handleSubmit = async () => {
    if (!formData.nome.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`/api/materias/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: formData.nome, peso: formData.peso, questoes: formData.questoes, cor: formData.cor, driveLink: formData.driveLink || null }),
        });
        await fetchMaterias();
      } else {
        const topicos = formData.topicos.split('\n').map(t => t.trim()).filter(Boolean);
        await fetch('/api/materias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, topicos }),
        });
        await fetchMaterias();
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ nome: '', peso: 1, questoes: 10, cor: '#60B5FF', topicos: '', driveLink: '' });
    } catch (err: any) { console.error(err); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta matéria e todos os seus tópicos?')) return;
    try {
      await fetch(`/api/materias/${id}`, { method: 'DELETE' });
      setMaterias(prev => (prev ?? []).filter(m => m?.id !== id));
    } catch (err: any) { console.error(err); }
  };

  const handleAddTopico = async (materiaId: string) => {
    if (!newTopico.trim()) return;
    setAddingTopico(true);
    try {
      await fetch('/api/topicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newTopico, materiaId }),
      });
      await fetchMaterias();
      setNewTopico('');
    } catch (err: any) { console.error(err); }
    setAddingTopico(false);
  };

  const handleDeleteTopico = async (topicoId: string) => {
    try {
      await fetch(`/api/topicos/${topicoId}`, { method: 'DELETE' });
      await fetchMaterias();
    } catch (err: any) { console.error(err); }
  };

  const startEdit = (m: Materia) => {
    setEditingId(m?.id ?? null);
    setFormData({ nome: m?.nome ?? '', peso: m?.peso ?? 1, questoes: m?.questoes ?? 10, cor: m?.cor ?? '#60B5FF', topicos: '', driveLink: m?.driveLink ?? '' });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matérias</h1>
          <p className="text-gray-500 mt-1">Gerencie as matérias e tópicos do seu plano de estudos</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ nome: '', peso: 1, questoes: 10, cor: '#60B5FF', topicos: '', driveLink: '' }); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" /> Nova Matéria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(materias ?? []).map((materia, idx) => {
          const isExpanded = expandedId === materia?.id;
          const totalTopicos = materia?.topicos?.length ?? 0;
          const concluidos = materia?.topicos?.filter((t: any) => t?.concluido)?.length ?? 0;
          return (
            <motion.div
              key={materia?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * idx }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: materia?.cor ?? '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{materia?.nome ?? ''}</h3>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span>Peso: {materia?.peso ?? 1}</span>
                      <span>Questões: {materia?.questoes ?? 0}</span>
                      <span>{concluidos}/{totalTopicos} tópicos</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {materia?.driveLink && (
                      <a href={materia.driveLink} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Abrir material no Drive">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => startEdit(materia)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(materia?.id ?? '')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${totalTopicos > 0 ? (concluidos / totalTopicos) * 100 : 0}%`, backgroundColor: materia?.cor ?? '#6366f1' }} />
                </div>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : (materia?.id ?? null))}
                  className="mt-3 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {isExpanded ? 'Ocultar tópicos' : `Ver tópicos (${totalTopicos})`}
                </button>
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-4 space-y-2 border-t border-gray-50 pt-3">
                      {(materia?.topicos ?? []).map((t: Topico) => (
                        <div key={t?.id} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {t?.link && <span className="text-red-500 flex-shrink-0" title="PDF vinculado">📄</span>}
                            <span className={`text-sm truncate ${t?.concluido ? 'line-through text-gray-400' : 'text-gray-700'}`}>{t?.nome ?? ''}</span>
                          </div>
                          <button onClick={() => handleDeleteTopico(t?.id ?? '')} className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={newTopico}
                          onChange={(e) => setNewTopico(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTopico(materia?.id ?? '')}
                          placeholder="Novo tópico..."
                          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => handleAddTopico(materia?.id ?? '')}
                          disabled={addingTopico || !newTopico.trim()}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {addingTopico ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Editar Matéria' : 'Nova Matéria'}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Matéria</label>
                  <input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
                    <input type="number" min={1} max={10} value={formData.peso}
                      onChange={(e) => setFormData({ ...formData, peso: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Questões</label>
                    <input type="number" min={1} value={formData.questoes}
                      onChange={(e) => setFormData({ ...formData, questoes: parseInt(e.target.value) || 10 })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                  <div className="flex flex-wrap gap-2">
                    {CORES.map((c) => (
                      <button key={c} onClick={() => setFormData({ ...formData, cor: c })}
                        className={`w-8 h-8 rounded-lg transition-all ${formData.cor === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Google Drive (opcional)</label>
                  <input type="url" value={formData.driveLink} onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tópicos (um por linha)</label>
                    <textarea value={formData.topicos} onChange={(e) => setFormData({ ...formData, topicos: e.target.value })}
                      rows={4} placeholder="Tópico 1\nTópico 2\nTópico 3"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                )}
                <button onClick={handleSubmit} disabled={saving || !formData.nome.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {editingId ? 'Salvar Alterações' : 'Criar Matéria'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
