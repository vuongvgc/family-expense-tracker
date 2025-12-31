import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';

// Validation schemas
const createFamilySchema = z.object({
  action: z.literal('create'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  familyName: z.string().min(2, 'Family name must be at least 2 characters'),
});

const joinFamilySchema = z.object({
  action: z.literal('join'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  inviteCode: z.string().min(1, 'Invite code is required'),
});

const registerSchema = z.discriminatedUnion('action', [
  createFamilySchema,
  joinFamilySchema,
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    if (validatedData.action === 'create') {
      // CREATE NEW FAMILY FLOW
      // Transaction to create family, user, and default categories atomically
      const result = await prisma.$transaction(async (tx) => {
        // Create new family group
        const familyGroup = await tx.familyGroup.create({
          data: {
            name: validatedData.familyName,
          },
        });

        // Create user as ADMIN
        const user = await tx.user.create({
          data: {
            name: validatedData.name,
            email: validatedData.email,
            password: hashedPassword,
            role: 'ADMIN',
            familyGroupId: familyGroup.id,
          },
        });

        // Seed default categories for the new family
        await tx.category.createMany({
          data: DEFAULT_CATEGORIES.map((cat) => ({
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            familyGroupId: familyGroup.id,
          })),
        });

        return { user, familyGroup };
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Family created successfully! You can now log in.',
          inviteCode: result.familyGroup.inviteCode,
        },
        { status: 201 }
      );
    } else {
      // JOIN EXISTING FAMILY FLOW
      // Find family by invite code
      const familyGroup = await prisma.familyGroup.findUnique({
        where: { inviteCode: validatedData.inviteCode },
      });

      if (!familyGroup) {
        return NextResponse.json(
          { error: 'Invalid invite code. Please check and try again.' },
          { status: 404 }
        );
      }

      // Create user as MEMBER
      const user = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: 'MEMBER',
          familyGroupId: familyGroup.id,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: `Successfully joined ${familyGroup.name}! You can now log in.`,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
