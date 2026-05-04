'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Clock, CheckCircle2, Plus, ChevronDown, ChevronRight,
  Target, Lightbulb, X
} from 'lucide-react';

interface Topico {
  id: string;
  nome: string;
  concluido: boolean;
  concluidoEm: string | null;
}

interface Materia {
  id: string;
  nome: string;
  cor: string;
  topicos: Topico[];
}

interface Sessao {
  id: string;
  data: string;
  minutos: number;
  tipo: string;
  descricao: string | null;
  materia: { nome: string; cor: string };
}

const DICAS_DIA = [
  'Estude no máximo 2h por matéria por dia — seu cérebro absorve melhor em blocos menores.',
  'Faça pausas de 10 minutos a cada hora de estudo.',
  'Revise rapidamente o que estudou ontem antes de começar hoje.',
  'Marque os tópicos concluídos para acompanhar seu progresso!',
];

export default function PlanoDiarioContent() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [sessaoForm, setSessaoForm] = useState({
    materiaId: '',
    minutos: 60,
    tipo: 'ESTUDO',
    descricao: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [matRes, sessRes] = await Promise.all([
        fetch('/api/materias'),
        fetch('/api/sessoes?dias=1'),
      ]);
      if (matRes.ok) {
        const matData = await matRes.json();
        setMaterias(matData);
      }
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setSessoes(sessData);
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTopico(topicoId: string, concluido: boolean) {
    try {
      const res = await fetch(`/api/topicos/${topicoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concluido: !concluido }),
      });
      if (res.ok) {
        setMaterias(prev =>
          prev.map(m => ({
            ...m,
            topicos: m.topicos.map(t =>
              t.id === topicoId ? { ...t, concluido: !concluido, concluidoEm: !concluido ? new Date().toISOString() : null } : t
            ),
          }))
        );
      }
    } catch (e) {
      console.error('Erro ao atualizar tópico:', e);
    }
  }

  async function registrarSessao(e: React.FormEvent) {
    e.preventDefault();
    if (!sessaoForm.materiaId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/sessoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: new Date().toISOString(),
          minutos: sessaoForm.minutos,
          materiaId: sessaoForm.materiaId,
          tipo: sessaoForm.tipo,
          descricao: sessaoForm.descricao || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setSessaoForm({ materiaId: '', minutos: 60, tipo: 'ESTUDO', descricao: '' });
        fetchData();
      }
    } catch (e) {
      console.error('Erro ao registrar sessão:', e);
    } finally {
      setSaving(false);
    }
  }

  const totalMinutosHoje = sessoes.reduce((acc, s) => acc + s.minutos, 0);
  const horasHoje = Math.floor(totalMinutosHoje / 60);
  const minutosHoje = totalMinutosHoje % 60;

  const dicaDoDia = DICAS_DIA[new Date().getDay() % DICAS_DIA.length];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plano Diário</h1>
          <p className="text-gray-500 mt-1">Organize seu estudo do dia e registre suas sessões</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Registrar Sessão
        </button>
      </div>

      {/* Resumo do dia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Tempo Estudado Hoje</span>
          </div>
          <p className="text-3xl font-bold">
            {horasHoje}h{minutosHoje > 0 ? ` ${minutosHoje}min` : ''}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Sessões Hoje</span>
          </div>
          <p className="text-3xl font-bold">{sessoes.length}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Meta Diária</span>
          </div>
          <p className="text-3xl font-bold">4h</p>
          <div className="mt-2 bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${Math.min((totalMinutosHoje / 240) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dica do dia */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-amber-800 text-sm">Dica PPE do Dia</p>
          <p className="text-amber-700 text-sm mt-1">{dicaDoDia}</p>
        </div>
      </div>

      {/* Sessões de hoje */}
      {sessoes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" /> Sessões de Hoje
          </h2>
          <div className="space-y-3">
            {sessoes.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.materia.cor }} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{s.materia.nome}</p>
                  {s.descricao && <p className="text-gray-500 text-xs mt-0.5">{s.descricao}</p>}
                </div>
                <span className="text-sm font-medium text-gray-600">{s.minutos}min</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{s.tipo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matérias e tópicos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" /> Matérias e Tópicos
        </h2>
        {materias.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma matéria cadastrada. Vá em Matérias para adicionar.</p>
        ) : (
          <div className="space-y-3">
            {materias.map((m) => {
              const total = m.topicos.length;
              const concluidos = m.topicos.filter(t => t.concluido).length;
              const isExpanded = expanded[m.id];

              return (
                <div key={m.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: m.cor }} />
                    <span className="font-medium text-gray-900 flex-1">{m.nome}</span>
                    <span className="text-sm text-gray-500">{concluidos}/{total} tópicos</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>
                  <AnimatePresence>
                    {isExpanded && m.topicos.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-2">
                          {m.topicos.map((t) => (
                            <label
                              key={t.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={t.concluido}
                                onChange={() => toggleTopico(t.id, t.concluido)}
                                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <span className={`text-sm ${t.concluido ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                {t.nome}
                              </span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Registrar Sessão */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Registrar Sessão de Estudo</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={registrarSessao} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matéria</label>
                  <select
                    value={sessaoForm.materiaId}
                    onChange={(e) => setSessaoForm(prev => ({ ...prev, materiaId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione uma matéria</option>
                    {materias.map(m => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tempo (minutos)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={sessaoForm.minutos}
                    onChange={(e) => setSessaoForm(prev => ({ ...prev, minutos: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Máximo 120 minutos (2h) por sessão — método PPE</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={sessaoForm.tipo}
                    onChange={(e) => setSessaoForm(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="ESTUDO">Estudo</option>
                    <option value="REVISAO">Revisão</option>
                    <option value="EXERCICIO">Exercício</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                  <input
                    type="text"
                    value={sessaoForm.descricao}
                    onChange={(e) => setSessaoForm(prev => ({ ...prev, descricao: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Capítulo 3 - Crimes contra o patrimônio"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {saving ? 'Salvando...' : 'Registrar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
