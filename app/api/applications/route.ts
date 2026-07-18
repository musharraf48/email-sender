import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { expireStaleApplications } from '@/lib/applications';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await expireStaleApplications();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));
    const skip = (page - 1) * limit;

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { companyName: { contains: search, mode: 'insensitive' as const } },
              { domain: { contains: search, mode: 'insensitive' as const } },
              { jobType: { contains: search, mode: 'insensitive' as const } },
              { recruiterPhone: { contains: search, mode: 'insensitive' as const } },
              { notes: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [applications, total, statusGroups] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
      prisma.application.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const statusCounts = Object.fromEntries(
      statusGroups.map((group) => [group.status, group._count.status])
    );

    return NextResponse.json({
      success: true,
      applications,
      statusCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: unknown) {
    console.error('Applications GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch applications';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
