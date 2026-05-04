'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, BookOpen, Loader2 } from 'lucide-react';

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

interface AtividadeCronograma {
  materia: string;
  cor: string;
  horas: number;
}

interface DiaCronograma {
  data: string;
  diaSemana: string;
  atividades: AtividadeCronograma[];
  totalHoras: number;
}

export default function CronogramaContent() {
  const [dias, setDias] = useState<DiaCronograma[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchCronograma();
  }, []);

  async function fetchCronograma() {
    try {
      const res = await fetch('/api/cronograma');
      if (res.ok) {
        const data = await res.json();
        setDias(data?.cronograma ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  const diasExibir = showAll ? dias : dias.slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cronograma de Estudos</h1>
          <p className="text-gray-500 mt-1">Distribuição semanal das matérias</p>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {showAll ? 'Mostrar apenas 7 dias' : 'Ver cronograma completo'}
        </button>
      </div>

      <div className="space-y-4">
        {diasExibir.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum cronograma gerado ainda.</p>
            <p className="text-sm mt-1">Configure suas matérias para gerar o cronograma automático.</p>
          </div>
        ) : (
          diasExibir.map((dia, idx) => (
            <motion.div
              key={dia.data}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden ${
                idx === 0 ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              }`}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="font-bold text-gray-900">{dia.diaSemana}</h3>
                      <p className="text-xs text-gray-400">{new Date(dia.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{dia.totalHoras}h</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {dia.atividades.map((atv, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: atv.cor }} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{atv.materia}</p>
                        <p className="text-xs text-gray-400">{atv.horas}h de estudo</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">{atv.horas}h</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
