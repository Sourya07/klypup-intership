import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@prisma/client';
import { prisma } from '../../lib';
import { env } from '../../config';
import { UnauthorizedError, ConflictError } from '../../utils/errors';
import { SignupInput, LoginInput } from './schema';
import { AuthResponse, TokenPair } from './types';

const SALT_ROUNDS = 12;

function generateAccessToken(payload: { userId: string; orgId: string; role: UserRole; email: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any });
}

function generateRefreshTokenValue(): string {
  return uuidv4();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function signup(input: SignupInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('An account with this email already exists');

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const slug = slugify(input.organizationName) + '-' + uuidv4().slice(0, 6);

  // Transaction: create user, org, and membership atomically
  const result = await prisma.$transaction(async (tx:any) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
      },
    });

    const org = await tx.organization.create({
      data: {
        name: input.organizationName,
        slug,
      },
    });

    const membership = await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: 'ADMIN',
      },
    });

    return { user, org, membership };
  });

  const tokens = await createTokenPair(result.user.id, result.org.id, result.membership.role, result.user.email);

  return {
    user: { id: result.user.id, email: result.user.email, name: result.user.name },
    organization: { id: result.org.id, name: result.org.name, slug: result.org.slug },
    role: result.membership.role,
    tokens,
  };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      memberships: {
        include: { organization: true },
        take: 1, // Default to first org
      },
    },
  });

  if (!user) throw new UnauthorizedError('Invalid email or password');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  const membership = user.memberships[0];
  if (!membership) throw new UnauthorizedError('User has no organization membership');

  const tokens = await createTokenPair(user.id, membership.organizationId, membership.role, user.email);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
    },
    role: membership.role,
    tokens,
  };
}

export async function refresh(refreshToken: string): Promise<TokenPair> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: {
      user: {
        include: {
          memberships: {
            include: { organization: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!stored || stored.expiresAt < new Date()) {
    // Clean up expired token if it exists
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const membership = stored.user.memberships[0];
  if (!membership) throw new UnauthorizedError('User has no organization membership');

  // Rotate: delete old token, issue new pair
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  return createTokenPair(stored.userId, membership.organizationId, membership.role, stored.user.email);
}

export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

export async function getMe(userId: string, orgId: string) {
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    include: { user: true, organization: true },
  });

  if (!membership) throw new UnauthorizedError('Membership not found');

  return {
    id: membership.user.id,
    email: membership.user.email,
    name: membership.user.name,
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
    },
    role: membership.role,
  };
}

// Internal helper: create access + refresh token pair and persist refresh token
async function createTokenPair(
  userId: string,
  orgId: string,
  role: UserRole,
  email: string
): Promise<TokenPair> {
  const accessToken = generateAccessToken({ userId, orgId, role, email });
  const refreshTokenValue = generateRefreshTokenValue();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId,
      expiresAt,
    },
  });

  return { accessToken, refreshToken: refreshTokenValue };
}
