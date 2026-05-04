import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const body = await req.json();
  const materia = await prisma.materia.update({ where: { id: params.id }, data: body });
  return NextResponse.json(materia);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  await prisma.sessao.deleteMany({ where: { materiaId: params.id } });
  await prisma.teste.deleteMany({ where: { materiaId: params.id } });
  await prisma.topico.deleteMany({ where: { materiaId: params.id } });
  await prisma.materia.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
