import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const testes = await prisma.teste.findMany({
    where: { userId: user.id },
    include: { materia: { select: { nome: true, cor: true } } },
    orderBy: { data: 'desc' },
    take: 100,
  });
  return NextResponse.json(testes ?? []);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const body = await req.json();
  const { data, questoesTotal, questoesAcertos, tipo, descricao, materiaId } = body ?? {};

  const teste = await prisma.teste.create({
    data: {
      data: data ? new Date(data) : new Date(),
      questoesTotal: questoesTotal ?? 10,
      questoesAcertos: questoesAcertos ?? 0,
      tipo: tipo ?? 'questoes',
      descricao: descricao || null,
      materiaId,
      userId: user.id,
    },
    include: { materia: { select: { nome: true, cor: true } } },
  });
  return NextResponse.json(teste);
}
