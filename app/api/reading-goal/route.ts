import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateWithSchema } from '@/lib/validation';

function getCurrentYear() {
  return new Date().getFullYear();
}

function parseIntegerInput(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return value;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}

const readingGoalBodySchema = z.object({
  year: z.preprocess(parseIntegerInput, z.number().int().min(1900).max(3000)),
  target: z.preprocess(parseIntegerInput, z.number().int().min(1).max(1000)),
});

const readingGoalQuerySchema = z.object({
  year: z.preprocess((value) => {
    if (value === null || value === undefined || value === '') {
      return getCurrentYear();
    }
    return parseIntegerInput(value);
  }, z.number().int().min(1900).max(3000)),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const parsedBody = await request.json().catch(() => null);

    const bodyValidation = validateWithSchema(
      readingGoalBodySchema,
      parsedBody
    );
    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: bodyValidation.error },
        { status: 400 }
      );
    }

    const { year, target } = bodyValidation.data;

    const goal = await prisma.readingGoal.upsert({
      where: { userId_year: { userId: session.user.id, year } },
      update: { target },
      create: { userId: session.user.id, year, target },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Reading goal error:', error);
    return NextResponse.json(
      { error: 'Failed to save reading goal' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryValidation = validateWithSchema(readingGoalQuerySchema, {
      year: searchParams.get('year'),
    });
    if (!queryValidation.success) {
      return NextResponse.json(
        { error: queryValidation.error },
        { status: 400 }
      );
    }

    const { year } = queryValidation.data;

    const goal = await prisma.readingGoal.findUnique({
      where: {
        userId_year: {
          userId: session.user.id,
          year,
        },
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Fetch reading goal error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reading goal' },
      { status: 500 }
    );
  }
}
