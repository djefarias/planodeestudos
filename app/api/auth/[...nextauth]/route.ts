import { NextResponse } from 'next/server';

// Handler mínimo pra evitar 404 nas chamadas do next-auth
export async function GET() { return NextResponse.redirect(new URL('/')); }
export async function POST() { return NextResponse.json({}); }
