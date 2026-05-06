import { getServerAuthSession } from "@/lib/auth-options";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = { user: { id: "anon", email: "dje.reis.17@gmail.com", name: "Jefferson" } };
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const materiais = await prisma.materialEstudo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(materiais ?? []);
}

export async function POST(req: Request) {
  const session = { user: { id: "anon", email: "dje.reis.17@gmail.com", name: "Jefferson" } };
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const body = await req.json();
  const { nome, link, categoria } = body ?? {};
  if (!nome?.trim() || !link?.trim()) return NextResponse.json({ error: 'Nome e link são obrigatórios' }, { status: 400 });

  const material = await prisma.materialEstudo.create({
    data: { nome: nome.trim(), link: link.trim(), categoria: categoria ?? 'geral', userId: user.id },
  });
  return NextResponse.json(material);
}

export async function DELETE(req: Request) {
  const session = { user: { id: "anon", email: "dje.reis.17@gmail.com", name: "Jefferson" } };
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const body = await req.json();
  await prisma.materialEstudo.delete({ where: { id: body.id } });
  return NextResponse.json({ success: true });
}
