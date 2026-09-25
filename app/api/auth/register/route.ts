import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const emailInput = typeof body?.email === 'string' ? body.email : '';
    const email = normalizeEmail(emailInput);
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const passwordBytes = Buffer.byteLength(password, 'utf8');
    if (passwordBytes < 8 || passwordBytes > 72) {
      return NextResponse.json(
        { error: 'Password must be between 8 and 72 bytes (UTF-8)' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { name, email, password: hashedPassword },
      });

      await tx.shelf.createMany({
        data: ['Want to Read', 'Currently Reading', 'Read'].map((name) => ({
          name,
          userId: createdUser.id,
          isDefault: true,
        })),
      });

      return createdUser;
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const rawTarget = error.meta?.target;
      const targetColumns = Array.isArray(rawTarget)
        ? rawTarget.map((value) => String(value).toLowerCase())
        : typeof rawTarget === 'string'
          ? [rawTarget.toLowerCase()]
          : [];

      const isEmailViolation = targetColumns.some((column) =>
        column.includes('email')
      );

      return NextResponse.json(
        {
          error: isEmailViolation
            ? 'Email already registered'
            : targetColumns.length > 0
              ? `Unique constraint violation: ${targetColumns.join(', ')}`
              : 'Unique constraint violation',
        },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
