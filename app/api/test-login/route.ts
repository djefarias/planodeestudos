import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  const steps: string[] = [];
  
  try {
    // 1. Test CSRF endpoint
    steps.push('testando CSRF...');
    const csrfUrl = new URL('/api/auth/csrf', request.url).toString();
    const csrfResp = await fetch(csrfUrl);
    const csrfData = await csrfResp.json();
    steps.push('csrf token obtido: ' + (csrfData.csrfToken?.substring(0,20) || 'N/A'));
    
    // 2. Test callback
    steps.push('chamando callback/credentials...');
    const callbackUrl = new URL('/api/auth/callback/credentials', request.url).toString();
    
    const body = new URLSearchParams();
    body.set('email', 'dje.reis.17@gmail.com');
    body.set('password', 'pcparana2026');
    body.set('csrfToken', csrfData.csrfToken);
    
    // Try with the session cookie
    const callbackResp = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': request.url.replace(/\/api\/test-login.*/, ''),
        'Cookie': `__Host-next-auth.csrf-token=${csrfData.csrfToken}`,
      },
      body: body.toString(),
      redirect: 'manual',
    });
    
    steps.push('callback status: ' + callbackResp.status);
    steps.push('callback location: ' + (callbackResp.headers.get('location') || 'N/A'));
    
    const cookies = callbackResp.headers.getSetCookie?.() || callbackResp.headers.get('set-cookie') || '';
    const sessionCookie = [...cookies.toString().matchAll(/next-auth\.session-token=([^;]+)/g)].map(m => m[1]);
    steps.push('session cookies: ' + (sessionCookie.length > 0 ? 'SIM' : 'NAO'));
    
    // 3. Try accessing a protected page
    if (sessionCookie.length > 0) {
      const dashResp = await fetch(new URL('/dashboard', request.url).toString(), {
        headers: { 'Cookie': `next-auth.session-token=${sessionCookie[0]}` },
        redirect: 'manual',
      });
      steps.push('dashboard status with session: ' + dashResp.status);
      steps.push('dashboard location: ' + (dashResp.headers.get('location') || 'N/A'));
    }
    
  } catch (e: any) {
    steps.push('ERRO: ' + e.message);
  }
  
  return NextResponse.json({ steps });
}
