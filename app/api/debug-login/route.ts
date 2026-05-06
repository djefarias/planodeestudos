import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body ?? {};
  
  const result: any = {
    email: email || 'não informado',
    passwordProvided: !!password,
  };

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      result.erro = 'Usuário não encontrado no banco';
    } else {
      result.usuarioEncontrado = true;
      result.userEmail = user.email;
      result.userName = user.name;
      result.hashExiste = !!user.hashedPassword;
      result.hashPrefix = user.hashedPassword?.substring(0, 20);
      
      if (password && user.hashedPassword) {
        result.compareResult = bcrypt.compareSync(password, user.hashedPassword);
      } else {
        result.compareResult = 'não foi possível comparar';
      }
    }
  } catch (e: any) {
    result.erro = e.message || String(e);
    result.erroCompleto = JSON.stringify(e, Object.getOwnPropertyNames(e)).substring(0, 500);
  }

  return NextResponse.json(result);
}
