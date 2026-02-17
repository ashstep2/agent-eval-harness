import { NextResponse } from 'next/server';

export async function GET() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const missing: string[] = [];
  if (!anthropicKey) missing.push('ANTHROPIC_API_KEY');
  if (!openaiKey) missing.push('OPENAI_API_KEY');

  if (missing.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        missing,
        message: `Missing API keys: ${missing.join(', ')}. Add them to .env.local and restart the dev server.`,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, missing: [] });
}
