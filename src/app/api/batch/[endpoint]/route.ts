import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ endpoint: string }> }) {
  const { endpoint } = await params;
  return NextResponse.json({ message: `Batch ${endpoint}` });
}
