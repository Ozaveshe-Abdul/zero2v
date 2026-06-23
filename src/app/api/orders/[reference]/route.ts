import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return NextResponse.json({ message: `Get Order ${reference}` });
}
