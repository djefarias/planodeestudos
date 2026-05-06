import { NextResponse } from 'next/server';

export async function GET() {
  const info: any = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✓ configurada' : '✗ faltando',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✓ configurada' : '✗ faltando',
    DATABASE_URL: process.env.DATABASE_URL ? '✓ configurada' : '✗ faltando',
    DATABASE_URL_PREVIEW: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'n/a',
  };
  
  let dbOk = false;
  let dbError = '';
  try {
    const { prisma } = await import('@/lib/prisma');
    const count = await prisma.user.count();
    dbOk = true;
    info.dbUsers = count;
  } catch (e: any) {
    dbError = e.message?.substring(0, 200) || String(e);
  }
  
  info.dbConnection = dbOk ? '✓ OK' : `✗ ${dbError}`;
  
  return NextResponse.json(info);
}
