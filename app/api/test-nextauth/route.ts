import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  // Teste exatamente como o authorize do NextAuth faz
  const logs: string[] = [];
  
  try {
    logs.push('1. Buscando usuário');
    const user = await prisma.user.findUnique({
      where: { email: 'dje.reis.17@gmail.com' },
    });
    
    if (!user) { logs.push('USUARIO NAO ENCONTRADO'); return NextResponse.json({ logs }); }
    logs.push('2. User: ' + user.email + ' | hash existe: ' + !!user.hashedPassword);
    
    if (!user.hashedPassword) { logs.push('SEM HASH'); return NextResponse.json({ logs }); }
    
    logs.push('3. Hash prefix: ' + user.hashedPassword.substring(0, 20));
    logs.push('4. Chamando bcrypt.compareSync');
    
    const isValid = bcrypt.compareSync('pcparana2026', user.hashedPassword);
    logs.push('5. isValid: ' + isValid);
    
    if (isValid) {
      logs.push('6. Retornando objeto user');
      return NextResponse.json({
        logs,
        userObj: { id: user.id, email: user.email, name: user.name },
      });
    } else {
      logs.push('6. SENHA INVALIDA');
      return NextResponse.json({ logs, erro: 'senha invalida' });
    }
  } catch (e: any) {
    logs.push('ERRO: ' + e.message);
    return NextResponse.json({ logs, erro: e.message });
  }
}
