'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Clock, Target, Flame, Calendar, BookOpen,
  CheckCircle2, BarChart3, PieChart as PieIcon, Activity, Award,
  Lightbulb, CalendarDays, ExternalLink
} from 'lucide-react';
import AnimatedNumber from '@/components/animated-number';
import { LazyLineChart, LazyBarChart, LazyPieChart } from '@/components/charts';
import Link from 'next/link';

interface DashboardData {
  progressoGeral: number;
  totalTopicos: number;
  topicosConcluidos: number;
  totalHoras: number;
  totalQuestoes: number;
  totalAcertos: number;
  aproveitamentoGeral: number;
  streak: number;
  diasRestantes: number;
  dataProva: string;
  porMateria: any[];
  evolucao: any[];
}

interface HojeAgenda {
  data: string;
  diaSemana: string;
  tipo: string;
  atividades: { materia: string; cor: string; horas: number; driveLink?: string | null }[];
}

const DICAS_ESTUDO = [
  'Estude cada matéria no máximo 2 horas por dia para melhor rendimento.',
  'A cada hora de estudo, pare 10 minutos para descanso FORA do ambiente de estudo.',
  'Faça resumos e esquemas à mão — ativa mais sinapses cerebrais e favorece a fixação.',
  'Faça simulados a cada 15 dias e corrija no mesmo dia, anotando os erros.',
  'Priorize matérias com maior peso × número de questões na prova.',
  'Na semana antes da prova: revise resumos, faça questões da banca e pare 2 dias antes.',
  'Grave a matéria em áudio para estudar no trânsito ou academia.',
  'Ao estudar redação: 1h lendo temas atuais/polêmicos + 1h escrevendo.',
];

const DICAS_BANCA = [
  'Estude questões de provas anteriores da mesma banca organizadora.',
  'Identifique os temas mais cobrados por matéria na banca.',
  'Foque em competências, prazos e assuntos que demandem memorização.',
  'Matérias de peso 1 com poucas questões: não invista tempo excessivo.',
  'Matérias de peso 3 com muitas questões: dedique a maior parte do seu tempo.',
];

export default function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [hoje, setHoje] = useState<HojeAgenda | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, cronRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/cronograma'),
      ]);
      if (dashRes.ok) {
        const d = await dashRes.json();
        setData(d);
      }
      if (cronRes.ok) {
        const c = await cronRes.json();
        setHoje(c?.hoje ?? null);
      }
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  const stats = [
    { label: 'Progresso Geral', value: data?.progressoGeral ?? 0, suffix: '%', icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Horas Estudadas', value: data?.totalHoras ?? 0, suffix: 'h', icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Questões Feitas', value: data?.totalQuestoes ?? 0, suffix: '', icon: Target, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Sequência', value: data?.streak ?? 0, suffix: ' dias', icon: Flame, color: 'bg-rose-50 text-rose-600' },
    { label: 'Dias Restantes', value: data?.diasRestantes ?? 0, suffix: '', icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    { label: 'Aproveitamento', value: data?.aproveitamentoGeral ?? 0, suffix: '%', icon: Award, color: 'bg-cyan-50 text-cyan-600' },
  ];

  const pieData = (data?.porMateria ?? []).filter((m: any) => (m?.horas ?? 0) > 0).map((m: any) => ({
    name: m?.nome ?? '',
    value: m?.horas ?? 0,
    cor: m?.cor ?? '#6366f1',
  }));

  const barData = (data?.porMateria ?? []).map((m: any) => ({
    nome: (m?.nome ?? '').length > 12 ? (m?.nome ?? '').slice(0, 10) + '..' : (m?.nome ?? ''),
    questoes: m?.questoes ?? 0,
    cor: m?.cor ?? '#6366f1',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Acompanhe seu progresso de preparação para a prova</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Progresso Geral Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-800">Progresso Geral</h2>
          </div>
          <span className="text-sm text-gray-500">{data?.topicosConcluidos ?? 0}/{data?.totalTopicos ?? 0} tópicos</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data?.progressoGeral ?? 0}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-4 rounded-full relative"
          >
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
              {(data?.progressoGeral ?? 0) > 10 ? `${data?.progressoGeral ?? 0}%` : ''}
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-800">Evolução (Últimos 30 dias)</h2>
          </div>
          <div className="h-[250px]">
            <LazyLineChart data={data?.evolucao ?? []} dataKey="minutos" xKey="data" color="#6366f1" name="Minutos" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-gray-800">Horas por Matéria</h2>
          </div>
          <div className="h-[250px]">
            {pieData.length > 0 ? (
              <LazyPieChart data={pieData} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Registre sessões de estudo para ver o gráfico
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-gray-800">Questões por Matéria</h2>
          </div>
          <div className="h-[250px]">
            <LazyBarChart data={barData} dataKey="questoes" xKey="nome" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-800">Progresso por Matéria</h2>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
            {(data?.porMateria ?? []).map((m: any) => (
              <div key={m?.id ?? m?.nome} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">{m?.nome ?? ''}</span>
                  <span className="text-gray-500">{m?.topicosConc ?? 0}/{m?.topicosTotal ?? 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${m?.progresso ?? 0}%`, backgroundColor: m?.cor ?? '#6366f1' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Estudo de Hoje + Cronograma */}
      {hoje && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              <h2 className="font-bold text-lg">Estudo de Hoje &mdash; {hoje.diaSemana}</h2>
            </div>
            <Link href="/cronograma" className="text-sm bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
              Ver cronograma completo &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(hoje.atividades ?? []).map((a, i) => (
              <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.cor }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{a.materia}</p>
                  <p className="text-sm opacity-80">{a.horas}h de estudo</p>
                </div>
                {a.driveLink && (
                  <a href={a.driveLink} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex-shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Dicas Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6"
        >
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" /> Dicas de Estudo (PPE)
          </h3>
          <ul className="space-y-2.5">
            {DICAS_ESTUDO.map((dica, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                {dica}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-purple-50 border border-purple-200 rounded-2xl p-6"
        >
          <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" /> Estrat&eacute;gia da Banca
          </h3>
          <ul className="space-y-2.5">
            {DICAS_BANCA.map((dica, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-purple-700">
                <span className="w-5 h-5 bg-purple-200 text-purple-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                {dica}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
