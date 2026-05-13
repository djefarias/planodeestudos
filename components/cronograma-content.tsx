'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Clock, BookOpen, CheckCircle2, ChevronDown, ChevronRight,
  Target, Lightbulb, Plus, X, Loader2, TrendingUp, Flame, Trash2
} from 'lucide-react';

// ===== DADOS MOCKADOS (fallback sem banco) =====
import materiasSeed from '@/data/materias-mock.json';

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DICAS = [
  'Estude no máximo 2h por matéria — blocos menores = mais absorção.',
  'Faça pausas de 10 min a cada hora de estudo.',
  'Revise o que estudou ontem antes de começar hoje.',
  'Alternar matérias de exatas e humanas ajuda o cérebro a descansar.',
  'Durma bem! O cérebro consolida memórias durante o sono.',
  'Use a técnica Pomodoro: 25min foco, 5min pausa.',
];

type EstadoTopico = 'nao_iniciado' | 'em_andamento' | 'concluido';

interface Topico { id: string; nome: string; link?: string | null; concluido: boolean; }

// Mapeamento de estados para os checkbox
const PROXIMO_ESTADO: Record<EstadoTopico, EstadoTopico> = {
  'nao_iniciado': 'em_andamento',
  'em_andamento': 'concluido',
  'concluido': 'nao_iniciado',
};

const ESTADO_ICONE: Record<EstadoTopico, { icone: string; cor: string; bg: string; label: string }> = {
  'nao_iniciado': { icone: '○', cor: '#D1D5DB', bg: 'bg-gray-50', label: 'Não iniciado' },
  'em_andamento': { icone: '◐', cor: '#F59E0B', bg: 'bg-amber-50', label: 'Em andamento' },
  'concluido': { icone: '●', cor: '#10B981', bg: 'bg-green-50', label: 'Concluído' },
};
interface Materia { id: string; nome: string; peso: number; questoes: number; cor: string; topicos: Topico[]; }
interface Sessao { id: string; materiaNome: string; materiaCor: string; minutos: number; tipo: string; descricao: string; timestamp: number; }

// ===== CHAVE DO LOCALSTORAGE =====
const LS_KEY_CONCLUIDOS = 'ppe_topicos_concluidos';
const LS_KEY_SESSOES = 'ppe_sessoes';

// ===== CRONOGRAMA FIXO POR DIA DA SEMANA =====
// Distribuição fixa: cada dia da semana tem matérias definidas (sem aleatoriedade)
const CRONOGRAMA_FIXO: Record<number, string[]> = {
  0: [],                           // Domingo - descanso/simulado (sem matérias fixas no grid)
  1: ['Direito Penal'],            // Segunda
  2: ['Processo Penal'],           // Terça
  3: ['Português'],                // Quarta
  4: ['Direito Constitucional', 'Direito Administrativo'], // Quinta
  5: ['Informática', 'Raciocínio Lógico', 'Legislação Especial'], // Sexta
  6: [],                           // Sábado - revisão (sem matérias fixas no grid)
};

function gerarCronograma(materias: Materia[], dias: number = 90) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const resultado: Array<{ data: string; diaSemana: string; materias: Materia[]; totalHoras: number }> = [];

  for (let d = 0; d < dias; d++) {
    const dataAtual = new Date(hoje);
    dataAtual.setDate(hoje.getDate() + d);
    const diaSemana = dataAtual.getDay();
    const dataStr = dataAtual.toLocaleDateString('pt-BR');

    const nomesMateriasHoje = CRONOGRAMA_FIXO[diaSemana] || [];
    const materiasHoje: Materia[] = [];

    for (const nome of nomesMateriasHoje) {
      const materia = materias.find(m => m.nome === nome);
      if (materia) {
        materiasHoje.push(materia);
      }
    }

    resultado.push({
      data: dataStr,
      diaSemana: DIAS_SEMANA[diaSemana],
      materias: materiasHoje,
      totalHoras: Math.max(1, materiasHoje.length * 1.5),
    });
  }

  return resultado;
}

function formatDateDisplay(dataStr: string): string {
  // dataStr no formato dd/mm/aaaa
  if (dataStr.includes('/')) return dataStr;
  const d = new Date(dataStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR');
}

function isToday(dataStr: string): boolean {
  const hoje = new Date().toLocaleDateString('pt-BR');
  return dataStr === hoje || formatDateDisplay(dataStr) === hoje;
}

function getSemanaAtual(dias: any[]): any[] {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=domingo
  const diff = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); // seg = 0
  const segunda = new Date(hoje.setDate(diff));
  segunda.setHours(0, 0, 0, 0);
  
  return dias.filter(d => {
    const partes = d.data.split('/');
    const dataDia = new Date(partes[2], partes[1]-1, partes[0]);
    const fim = new Date(segunda);
    fim.setDate(segunda.getDate() + 6);
    return dataDia >= segunda && dataDia <= fim;
  });
}

export default function CronogramaPage() {
  const [materias, setMaterias] = useState<Materia[]>(materiasSeed as Materia[]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'semana' | 'completo'>('semana');
  
  // Estados de conclusão por tópico (3 estados, persistidos no localStorage)
  const [concluidos, setConcluidos] = useState<Record<string, EstadoTopico>>({});
  // Sessões de estudo
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  // Modal de registrar sessão
  const [showSessaoModal, setShowSessaoModal] = useState(false);
  const [sessaoForm, setSessaoForm] = useState({ materiaNome: '', minutos: 60, tipo: 'ESTUDO', descricao: '' });
  const [saving, setSaving] = useState(false);
  // Tópicos expandidos
  const [expandedMateria, setExpandedMateria] = useState<string | null>(null);
  // Dica do dia
  const dicaHoje = DICAS[new Date().getDate() % DICAS.length];

  // Carregar localStorage + dados mockados
  useEffect(() => {
    try {
      const savedConcluidos = localStorage.getItem(LS_KEY_CONCLUIDOS);
      if (savedConcluidos) setConcluidos(JSON.parse(savedConcluidos));
      
      const savedSessoes = localStorage.getItem(LS_KEY_SESSOES);
      if (savedSessoes) {
        const parsed = JSON.parse(savedSessoes);
        // Filtrar apenas sessoes de hoje
        setSessoes(parsed);
      }
    } catch (e) {}
    
    setLoading(false);
  }, []);

  // Salvar conclusões no localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(LS_KEY_CONCLUIDOS, JSON.stringify(concluidos));
    }
  }, [concluidos, loading]);

  // Salvar sessões no localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(LS_KEY_SESSOES, JSON.stringify(sessoes));
    }
  }, [sessoes, loading]);

  // Gerar cronograma
  const cronograma = useMemo(() => gerarCronograma(materias, 90), [materias]);
  const diasExibir = viewMode === 'semana' ? getSemanaAtual(cronograma) : cronograma;

  // Estatísticas
  const sessoesHoje = sessoes.filter(s => {
    const hoje = new Date().toDateString();
    return new Date(s.timestamp).toDateString() === hoje;
  });
  const totalMinHoje = sessoesHoje.reduce((a, s) => a + s.minutos, 0);
  const materiasEstudadasHoje = [...new Set(sessoesHoje.map(s => s.materiaNome))];

  const toggleConcluido = (topicoId: string) => {
    setConcluidos(prev => {
      const atual: EstadoTopico = prev[topicoId] || 'nao_iniciado';
      return { ...prev, [topicoId]: PROXIMO_ESTADO[atual] };
    });
  };

  const registrarSessao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessaoForm.materiaNome) return;
    setSaving(true);
    
    const novaSessao: Sessao = {
      id: `sessao_${Date.now()}`,
      materiaNome: sessaoForm.materiaNome,
      materiaCor: materias.find(m => m.nome === sessaoForm.materiaNome)?.cor || '#6366f1',
      minutos: sessaoForm.minutos,
      tipo: sessaoForm.tipo,
      descricao: sessaoForm.descricao,
      timestamp: Date.now(),
    };
    
    setSessoes(prev => [novaSessao, ...prev]);
    setShowSessaoModal(false);
    setSessaoForm({ materiaNome: '', minutos: 60, tipo: 'ESTUDO', descricao: '' });
    setSaving(false);
  };

  const removerSessao = (id: string) => {
    setSessoes(prev => prev.filter(s => s.id !== id));
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cronograma de Estudos</h1>
          <p className="text-gray-500 mt-1">Plano PPE diário baseado nas suas matérias</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('semana')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'semana' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setViewMode('completo')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'completo' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Completo
          </button>
          <button
            onClick={() => setShowSessaoModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Registrar
          </button>
        </div>
      </div>

      {/* Cards de resumo do dia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 opacity-80" />
            <span className="text-xs font-medium opacity-80">Hoje</span>
          </div>
          <p className="text-2xl font-bold">
            {Math.floor(totalMinHoje / 60)}h{totalMinHoje % 60 > 0 ? ` ${totalMinHoje % 60}min` : ''}
          </p>
          <p className="text-xs opacity-80 mt-1">tempo registrado</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 opacity-80" />
            <span className="text-xs font-medium opacity-80">Sessões</span>
          </div>
          <p className="text-2xl font-bold">{sessoesHoje.length}</p>
          <p className="text-xs opacity-80 mt-1">{materiasEstudadasHoje.length} matérias</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 opacity-80" />
            <span className="text-xs font-medium opacity-80">Meta</span>
          </div>
          <p className="text-2xl font-bold">4h</p>
          <div className="mt-2 bg-white/20 rounded-full h-1.5">
            <div className="bg-white rounded-full h-1.5 transition-all" style={{ width: `${Math.min((totalMinHoje / 240) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 opacity-80" />
            <span className="text-xs font-medium opacity-80">Streak</span>
          </div>
          <p className="text-2xl font-bold">
            {Object.keys(concluidos).filter(k => concluidos[k]).length}
          </p>
          <p className="text-xs opacity-80 mt-1">tópicos concluídos</p>
        </div>
      </div>

      {/* Dica do dia */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-amber-800 text-sm">{dicaHoje}</p>
      </div>

      {/* Grade de dias do cronograma */}
      <div className="space-y-3">
        {diasExibir.length === 0 && (
          <div className="bg-white rounded-2xl p-10 shadow-sm text-center text-gray-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum cronograma gerado.</p>
            <p className="text-sm mt-1">Adicione matérias para gerar automaticamente.</p>
          </div>
        )}
        
        {diasExibir.map((dia, idx) => {
          const hoje = isToday(dia.data);
          return (
            <motion.div
              key={dia.data}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
                hoje ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              }`}
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${hoje ? 'bg-indigo-500 animate-pulse' : 'bg-gray-300'}`} />
                    <h3 className={`font-bold ${hoje ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {dia.diaSemana}
                    </h3>
                    <span className="text-xs text-gray-400">{formatDateDisplay(dia.data)}</span>
                    {hoje && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">HOJE</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{dia.totalHoras}h</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {dia.materias.map((m: Materia) => {
                    const topicosMateria = m.topicos || [];
                    const concluidosMateria = topicosMateria.filter(t => concluidos[t.id] === "concluido").length;
                    return (
                      <div
                        key={m.id}
                        className="bg-gray-50 rounded-xl p-3 border-l-4"
                        style={{ borderLeftColor: m.cor }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800 text-sm truncate">{m.nome}</span>
                          <span className="text-xs text-gray-400 ml-auto">{concluidosMateria}/{topicosMateria.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="h-1 rounded-full transition-all"
                            style={{ width: `${topicosMateria.length > 0 ? (concluidosMateria / topicosMateria.length) * 100 : 0}%`, backgroundColor: m.cor }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">1.5h sugerido</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sessões de hoje */}
      {sessoesHoje.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" /> Sessões de Hoje
          </h2>
          <div className="space-y-2">
            {sessoesHoje.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.materiaCor }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{s.materiaNome}</p>
                  {s.descricao && <p className="text-gray-500 text-xs truncate">{s.descricao}</p>}
                </div>
                <span className="text-sm font-medium text-gray-600">{s.minutos}min</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{s.tipo}</span>
                <button
                  onClick={() => removerSessao(s.id)}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                  title="Remover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matérias com tópicos para marcar conclusão */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> Matérias e Tópicos
        </h2>
        <p className="text-xs text-gray-400 mb-4">Clique para expandir e marcar tópicos como concluídos</p>

        {materias.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma matéria cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {materias.map((m) => {
              const topicos = m.topicos || [];
              const isExpanded = expandedMateria === m.id;
              const total = topicos.length;
              const concluidosCount = topicos.filter(t => concluidos[t.id] === 'concluido').length;
              const emAndamentoCount = topicos.filter(t => concluidos[t.id] === 'em_andamento').length;

              return (
                <div key={m.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedMateria(isExpanded ? null : m.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.cor }} />
                    <span className="font-medium text-gray-900 flex-1">{m.nome}</span>
                    <span className="text-sm text-gray-500">{concluidosCount}/{total}{emAndamentoCount > 0 ? ` (+${emAndamentoCount} em andamento)` : ''}</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-1">
                          {topicos.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-3">Nenhum tópico</p>
                          ) : (
                            topicos.map(t => (
                              <label
                                key={t.id}
                                className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer group transition-colors"
                                style={{ backgroundColor: ESTADO_ICONE[concluidos[t.id] || 'nao_iniciado'].bg }}
                              >
                                <div className="relative flex items-center justify-center w-6 h-6">
                                  <span
                                    onClick={(e) => { e.preventDefault(); toggleConcluido(t.id); }}
                                    className="text-lg cursor-pointer select-none transition-transform hover:scale-125"
                                    style={{ color: ESTADO_ICONE[concluidos[t.id] || 'nao_iniciado'].cor }}
                                    title={ESTADO_ICONE[concluidos[t.id] || 'nao_iniciado'].label}
                                  >
                                    {ESTADO_ICONE[concluidos[t.id] || 'nao_iniciado'].icone}
                                  </span>
                                </div>
                                <span className={`text-sm flex-1 ${(concluidos[t.id]) === 'concluido' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                  {t.nome}
                                </span>
                                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mr-1">
                                  {ESTADO_ICONE[concluidos[t.id] || 'nao_iniciado'].label}
                                </span>
                                {t.link && (
                                  <a
                                    href={t.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-xs text-indigo-500 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Abrir PDF"
                                  >
                                    📄 PDF
                                  </a>
                                )}
                              </label>
                            ))
                          )}
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
        {showSessaoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSessaoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Registrar Estudo</h2>
                <button onClick={() => setShowSessaoModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={registrarSessao} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matéria</label>
                  <select
                    value={sessaoForm.materiaNome}
                    onChange={e => setSessaoForm(p => ({ ...p, materiaNome: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Selecione</option>
                    {materias.map(m => (
                      <option key={m.id} value={m.nome}>{m.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tempo (minutos)</label>
                  <input
                    type="number" min={5} max={240}
                    value={sessaoForm.minutos}
                    onChange={e => setSessaoForm(p => ({ ...p, minutos: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={sessaoForm.tipo}
                    onChange={e => setSessaoForm(p => ({ ...p, tipo: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ESTUDO">📖 Estudo</option>
                    <option value="REVISAO">🔄 Revisão</option>
                    <option value="EXERCICIO">📝 Exercício</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                  <input
                    type="text"
                    value={sessaoForm.descricao}
                    onChange={e => setSessaoForm(p => ({ ...p, descricao: e.target.value }))}
                    placeholder="Ex: Capítulo 3 - Crimes contra o patrimônio"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSessaoModal(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Registrar'}
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
