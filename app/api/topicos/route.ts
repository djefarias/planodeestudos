import { getServerAuthSession } from "@/lib/auth-options";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = { user: { id: "anon", email: "dje.reis.17@gmail.com", name: "Jefferson" } };
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const body = await req.json();
  const { nome, materiaId, link } = body ?? {};
  if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

  const topico = await prisma.topico.create({
    data: { nome: nome.trim(), link: link || null, materiaId },
  });
  return NextResponse.json(topico);
}
