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
    include: {
      topicos: { orderBy: { createdAt: 'asc' } },
      materiais: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(materias ?? []);
}

export async function POST(req: Request) {
  const session = { user: { id: "anon", email: "dje.reis.17@gmail.com", name: "Jefferson" } };
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const body = await req.json();
  const { nome, peso, questoes, cor, driveLink, topicos = [] } = body ?? {};

  if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

  const materia = await prisma.materia.create({
    data: {
      nome: nome.trim(),
      peso: peso ?? 1,
      questoes: questoes ?? 10,
      cor: cor ?? '#60B5FF',
      driveLink: driveLink || null,
      userId: user.id,
      topicos: {
        create: topicos.filter(Boolean).map((t: string) => ({ nome: t })),
      },
    },
    include: { topicos: true },
  });
  return NextResponse.json(materia);
}
