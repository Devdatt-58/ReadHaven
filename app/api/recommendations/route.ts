import { NextResponse } from 'next/server';
import { parseBoundedInt } from '@/lib/validation';
import { recommendForQuery } from '@/lib/recommendations';

// The query is embedded locally with @xenova/transformers, which needs the
// Node.js runtime (it cannot run on the Edge runtime).
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = parseBoundedInt(searchParams.get('limit'), {
      defaultValue: 5,
      min: 1,
      max: 20,
    });

    if (!query) {
      return NextResponse.json(
        { error: 'A search query (q) is required' },
        { status: 400 }
      );
    }

    const books = await recommendForQuery(query, limit);
    return NextResponse.json({ books });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to compute recommendations' },
      { status: 500 }
    );
  }
}
