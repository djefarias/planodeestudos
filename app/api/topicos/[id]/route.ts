import { getServerAuthSession } from "@/lib/auth-options";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = { user: { id: "anon", email: "dje.reis.17@gmail.com", name: "Jefferson" } };
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  
  const body = await req.json();
  const { link, nome, concluido } = body ?? {};
  
  const data: Record<string, unknown> = {};
  if (link !== undefined) data.link = link || null;
  if (nome !== undefined) data.nome = nome;
  if (concluido !== undefined) data.concluido = concluido;
  
  const topico = await prisma.topico.update({
    where: { id: params.id },
    data,
  });
  
  return NextResponse.json(topico);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = { user: { id: "anon", email: "dje.reis.17@gmail.com", name: "Jefferson" } };
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  await prisma.topico.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
