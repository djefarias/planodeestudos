'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, X, Save, Loader2, Target, CheckCircle2,
  TrendingUp, Calendar
} from 'lucide-react';

interface Teste {
  id: string;
  data: string;
  questoesTotal: number;
  questoesAcertos: number;
  tipo: string;
  descricao: string | null;
  materia: { nome: string; cor: string };
}

interface Materia { id: string; nome: string; cor: string; }

export default function TestesContent() {
  const [testes, setTestes] = useState<Teste[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ materiaId: '', questoesTotal: 10, questoesAcertos: 0, tipo: 'questoes', descricao: '' });

  const fetchData = useCallback(async () => {
    try {
      const [tRes, mRes] = await Promise.all([fetch('/api/testes'), fetch('/api/materias')]);
      if (tRes.ok) setTestes(await tRes.json() ?? []);
      if (mRes.ok) setMaterias(await mRes.json() ?? []);
    } catch (err: any) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!formData.materiaId || !formData.questoesTotal) return;
    setSaving(true);
    try {
      const res = await fetch('/api/testes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const novo = await res.json();
        setTestes(prev => [novo, ...(prev ?? [])]);
        setShowForm(false);
        setFormData({ materiaId: '', questoesTotal: 10, questoesAcertos: 0, tipo: 'questoes', descricao: '' });
      }
    } catch (err: any) { console.error(err); }
    setSaving(false);
  };

  const totalQuestoes = (testes ?? []).reduce((a: number, t: any) => a + (t?.questoesTotal ?? 0), 0);
  const totalAcertos = (testes ?? []).reduce((a: number, t: any) => a + (t?.questoesAcertos ?? 0), 0);
  const aproveitamento = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Testes e Questões</h1>
          <p className="text-gray-500 mt-1">Registre seus simulados e questões resolvidas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" /> Registrar Teste
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalQuestoes}</p>
              <p className="text-xs text-gray-500">Questões Feitas</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalAcertos}</p>
              <p className="text-xs text-gray-500">Acertos</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{aproveitamento}%</p>
              <p className="text-xs text-gray-500">Aproveitamento</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Testes List */}
      <div className="space-y-3">
        {(testes ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum teste registrado ainda</p>
            <p className="text-sm">Clique em &quot;Registrar Teste&quot; para começar</p>
          </div>
        ) : (
          (testes ?? []).map((teste, idx) => {
            const pct = (teste?.questoesTotal ?? 0) > 0 ? Math.round(((teste?.questoesAcertos ?? 0) / (teste?.questoesTotal ?? 1)) * 100) : 0;
            return (
              <motion.div
                key={teste?.id ?? idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * idx }}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: teste?.materia?.cor ?? '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{teste?.materia?.nome ?? ''}</p>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-500">{teste?.tipo ?? ''}</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(teste?.data ?? '').toLocaleDateString('pt-BR')}</span>
                      <span>{teste?.questoesAcertos ?? 0}/{teste?.questoesTotal ?? 0} acertos</span>
                      {teste?.descricao && <span className="truncate">{teste.descricao}</span>}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${
                    pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'
                  }`}>
                    {pct}%
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Registrar Teste</h2>
                <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matéria</label>
                  <select
                    value={formData.materiaId}
                    onChange={(e) => setFormData({ ...formData, materiaId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione...</option>
                    {(materias ?? []).map((m) => <option key={m?.id} value={m?.id ?? ''}>{m?.nome ?? ''}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Questões</label>
                    <input
                      type="number" min={1} value={formData.questoesTotal}
                      onChange={(e) => setFormData({ ...formData, questoesTotal: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acertos</label>
                    <input
                      type="number" min={0} value={formData.questoesAcertos}
                      onChange={(e) => setFormData({ ...formData, questoesAcertos: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="questoes">Questões</option>
                    <option value="simulado">Simulado</option>
                    <option value="prova_anterior">Prova Anterior</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                  <input
                    type="text" value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Detalhes..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={saving || !formData.materiaId}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Registrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
