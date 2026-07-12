import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { APPLICATION_STATUSES, JOB_TYPES } from '@/lib/job-templates';

export const dynamic = 'force-dynamic';

const EDITABLE_FIELDS = [
  'companyName',
  'jobType',
  'jobTitle',
  'status',
  'recruiterName',
  'recruiterPhone',
  'location',
  'workMode',
  'salary',
  'source',
  'notes',
  'priority',
  'tags',
  'followUpDate',
  'lastContactAt',
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: params.id },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, application });
  } catch (error: unknown) {
    console.error('Application GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch application';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        data[field] = body[field];
      }
    }

    if ('status' in data && !APPLICATION_STATUSES.includes(data.status as typeof APPLICATION_STATUSES[number])) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    if ('jobType' in data && !JOB_TYPES.includes(data.jobType as typeof JOB_TYPES[number])) {
      return NextResponse.json({ success: false, error: 'Invalid job type' }, { status: 400 });
    }

    if ('followUpDate' in data) {
      data.followUpDate = data.followUpDate ? new Date(data.followUpDate as string) : null;
    }

    if ('lastContactAt' in data) {
      data.lastContactAt = data.lastContactAt ? new Date(data.lastContactAt as string) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    const application = await prisma.application.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ success: true, application });
  } catch (error: unknown) {
    console.error('Application PATCH error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update application';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.application.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Application DELETE error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete application';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
