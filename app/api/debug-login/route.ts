import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body ?? {};
  
  const result: any = {
    email: email || 'não informado',
    passwordProvided: !!password,
    steps: [] as string[],
  };

  try {
    // Step 1: find user
    result.steps.push('1: buscando usuário');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      result.steps.push('1: USUÁRIO NÃO ENCONTRADO');
      result.erro = 'Usuário não encontrado';
      return NextResponse.json(result);
    }
    result.steps.push('1: usuário encontrado: ' + user.email);
    
    // Step 2: check hash
    result.steps.push('2: hash existe: ' + !!user.hashedPassword);
    if (!user.hashedPassword) {
      result.erro = 'Usuário sem hash de senha';
      return NextResponse.json(result);
    }
    
    // Step 3: compare password
    result.steps.push('3: comparando senha...');
    result.compareResult = await bcrypt.compare(password!, user.hashedPassword);
    result.steps.push('3: resultado: ' + result.compareResult);
    
    if (result.compareResult) {
      result.steps.push('4: AUTENTICAÇÃO VÁLIDA');
      result.success = true;
      result.user = { id: user.id, email: user.email, name: user.name };
    } else {
      result.steps.push('4: SENHA INVÁLIDA');
      result.erro = 'Senha incorreta';
    }
  } catch (e: any) {
    result.steps.push('ERRO: ' + e.message);
    result.erro = e.message;
  }

  return NextResponse.json(result);
}
