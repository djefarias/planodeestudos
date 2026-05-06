import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-options';

export async function GET() {
  const results: any = {};
  
  try {
    // Testar se authOptions tem o provider
    const provider = authOptions.providers?.[0];
    results.hasProvider = !!provider;
    results.providerType = provider?.id;
    results.providerName = provider?.name;
    
    // Testar o authorize manualmente
    if ('authorize' in provider!) {
      results.hasAuthorize = true;
    }
    
    // Tentar criar uma sessão
    results.nextAuthVersion = 'v4';
    results.adapterConfigured = !!authOptions.adapter;
    results.sessionStrategy = authOptions.session?.strategy;
    
  } catch (e: any) {
    results.erro = e.message;
  }
  
  return NextResponse.json(results);
}
