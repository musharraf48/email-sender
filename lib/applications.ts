import { prisma } from '@/lib/prisma';

export const APPLICATION_EXPIRY_DAYS = 15;

export const getExpiryDate = (appliedAt: Date = new Date()): Date => {
  const expiresAt = new Date(appliedAt);
  expiresAt.setDate(expiresAt.getDate() + APPLICATION_EXPIRY_DAYS);
  return expiresAt;
};

export const expireStaleApplications = async (): Promise<number> => {
  const now = new Date();

  const result = await prisma.application.updateMany({
    where: {
      status: 'applied',
      expiresAt: { lt: now },
    },
    data: {
      status: 'expired',
    },
  });

  return result.count;
};
