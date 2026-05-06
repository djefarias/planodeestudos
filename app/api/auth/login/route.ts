import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body ?? {};

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.hashedPassword) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isValid) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const secret = process.env.NEXTAUTH_SECRET || 'default-secret';
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    secret,
    { expiresIn: '7d' }
  );

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
