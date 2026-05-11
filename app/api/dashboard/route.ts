import { getServerAuthSession } from "@/lib/auth-options";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function GET() {
  const session = { user: { id: "anon", email: "dje.reis.17@gmail.com", name: "Jefferson" } };
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const materias = await prisma.materia.findMany({
    where: { userId: user.id },
    include: { topicos: true, sessoes: true, testes: true },
  });

  const totalTopicos = materias.reduce((acc, m) => acc + m.topicos.length, 0);
  const topicosConcluidos = materias.reduce((acc, m) => acc + m.topicos.filter(t => t.concluido).length, 0);
  const progressoGeral = totalTopicos > 0 ? Math.round((topicosConcluidos / totalTopicos) * 100) : 0;

  const totalHoras = materias.reduce((acc, m) => {
    return acc + m.sessoes.reduce((sAcc, s) => sAcc + s.minutos, 0);
  }, 0);

  const totalQuestoes = materias.reduce((acc, m) => {
    return acc + m.testes.reduce((tAcc, t) => tAcc + t.questoesTotal, 0);
  }, 0);
  const totalAcertos = materias.reduce((acc, m) => {
    return acc + m.testes.reduce((tAcc, t) => tAcc + t.questoesAcertos, 0);
  }, 0);
  const aproveitamentoGeral = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;

  // Streak (dias consecutivos com sessão)
  const sessoesAll = await prisma.sessao.findMany({
    where: { userId: user.id },
    orderBy: { data: 'desc' },
  });
  let streak = 0;
  const diasComSessao = new Set(sessoesAll.map(s => new Date(s.data).toISOString().split('T')[0]));
  const hoje = new Date().toISOString().split('T')[0];
  if (diasComSessao.has(hoje)) {
    streak = 1;
    let d = new Date();
    while (true) {
      d.setDate(d.getDate() - 1);
      const key = d.toISOString().split('T')[0];
      if (diasComSessao.has(key)) streak++;
      else break;
    }
  }

  const porMateria = materias.map(m => ({
    id: m.id,
    nome: m.nome,
    peso: m.peso,
    questoes: m.questoes,
    cor: m.cor,
    horas: Math.round(m.sessoes.reduce((a, s) => a + s.minutos, 0) / 60 * 10) / 10,
    topicosTotal: m.topicos.length,
    topicosConc: m.topicos.filter(t => t.concluido).length,
    progresso: m.topicos.length > 0 ? Math.round((m.topicos.filter(t => t.concluido).length / m.topicos.length) * 100) : 0,
  }));

  // Evolução (últimos 30 dias)
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
  const sessoes30d = await prisma.sessao.findMany({
    where: { userId: user.id, data: { gte: trintaDiasAtras } },
    orderBy: { data: 'asc' },
  });
  const evolucaoMap: Record<string, number> = {};
  sessoes30d.forEach(s => {
    const key = new Date(s.data).toISOString().split('T')[0];
    evolucaoMap[key] = (evolucaoMap[key] || 0) + s.minutos;
  });
  const evolucao = Object.entries(evolucaoMap).map(([data, minutos]) => ({ data, minutos }));

  return NextResponse.json({
    progressoGeral,
    totalTopicos,
    topicosConcluidos,
    totalHoras: Math.round(totalHoras / 60 * 10) / 10,
    totalQuestoes,
    totalAcertos,
    aproveitamentoGeral,
    streak,
    diasRestantes: 0,
    dataProva: '',
    porMateria,
    evolucao,
  });
}
