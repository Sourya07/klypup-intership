import { UserRole } from '@prisma/client';
import { prisma } from '../../lib';
import { NotFoundError, ConflictError, ForbiddenError } from '../../utils/errors';
import { InviteInput } from './schema';

export async function getOrganization(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
      _count: { select: { researchRuns: true, reports: true, watchlistItems: true } },
    },
  });
  if (!org) throw new NotFoundError('Organization');
  return org;
}

export async function createInvite(orgId: string, input: InviteInput) {
  // Check if user already a member
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: existingUser.id, organizationId: orgId } },
    });
    if (existingMembership) throw new ConflictError('User is already a member of this organization');
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.invite.create({
    data: {
      email: input.email,
      organizationId: orgId,
      role: input.role as UserRole,
      expiresAt,
    },
  });

  return invite;
}

export async function joinByCode(userId: string, inviteCode: string) {
  const org = await prisma.organization.findUnique({ where: { inviteCode } });
  if (!org) throw new NotFoundError('Organization with that invite code');

  const existing = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: org.id } },
  });
  if (existing) throw new ConflictError('You are already a member of this organization');

  const membership = await prisma.membership.create({
    data: { userId, organizationId: org.id, role: 'ANALYST' },
  });

  return { organization: org, membership };
}

export async function joinByToken(userId: string, inviteToken: string) {
  const invite = await prisma.invite.findUnique({ where: { token: inviteToken } });
  if (!invite) throw new NotFoundError('Invite');
  if (invite.accepted) throw new ConflictError('This invite has already been used');
  if (invite.expiresAt < new Date()) throw new ForbiddenError('This invite has expired');

  const existing = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: invite.organizationId } },
  });
  if (existing) throw new ConflictError('You are already a member of this organization');

  const [membership] = await prisma.$transaction([
    prisma.membership.create({
      data: { userId, organizationId: invite.organizationId, role: invite.role },
    }),
    prisma.invite.update({ where: { id: invite.id }, data: { accepted: true } }),
  ]);

  const org = await prisma.organization.findUnique({ where: { id: invite.organizationId } });

  return { organization: org, membership };
}

export async function getMembers(orgId: string) {
  return prisma.membership.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, email: true, name: true, createdAt: true } } },
    orderBy: { createdAt: 'asc' },
  });
}
