import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const materias = await prisma.materia.findMany({ where: { userId: user.id } });
  if (materias.length === 0) return NextResponse.json({ hoje: null, cronograma: [] });

  // Gerar cronograma para 28 dias
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dias: any[] = [];
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  for (let d = 0; d < 28; d++) {
    const dataAtual = new Date(hoje);
    dataAtual.setDate(hoje.getDate() + d);
    const diaSemana = dataAtual.getDay();
    // Distribuir 2 matérias por dia (exceto domingo)
    const atividades: any[] = [];

    if (diaSemana !== 0) { // Não domingo
      const idx1 = (d * 2) % materias.length;
      const idx2 = (d * 2 + 1) % materias.length;
      const m1 = materias[idx1];
      const m2 = materias[idx2];
      if (m1) atividades.push({ materia: m1.nome, cor: m1.cor, horas: 1.5, driveLink: m1.driveLink });
      if (m2 && m2.id !== m1.id) atividades.push({ materia: m2.nome, cor: m2.cor, horas: 1.5, driveLink: m2.driveLink });
    }

    const dataStr = dataAtual.toISOString().split('T')[0];
    dias.push({
      data: dataStr,
      diaSemana: diasSemana[diaSemana],
      atividades,
      totalHoras: atividades.reduce((a: number, atv: any) => a + (atv.horas ?? 0), 0),
    });
  }

  return NextResponse.json({
    hoje: dias[0],
    cronograma: dias,
  });
}
