import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncMilestoneToNews } from '@/lib/homerSync'

export async function GET() {
  const milestones = await prisma.projectMilestone.findMany({ orderBy: [{ projectName: 'asc' }, { order: 'asc' }] })
  return NextResponse.json(milestones)
}

export async function POST(req: Request) {
  const body = await req.json()
  const milestone = await prisma.projectMilestone.create({
    data: {
      projectName: body.projectName,
      label: body.label,
      date: new Date(body.date),
      type: body.type ?? 'production',
      order: body.order ?? 0,
      scheduleId: body.scheduleId ?? null,
    },
  })
  await syncMilestoneToNews(milestone)
  return NextResponse.json(milestone)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const where = body.id !== undefined ? { id: body.id } : { scheduleId: body.scheduleId }
  const milestone = await prisma.projectMilestone.update({
    where,
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.order !== undefined && { order: body.order }),
    },
  })
  return NextResponse.json(milestone)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const scheduleId = searchParams.get('scheduleId')
  if (scheduleId) {
    await prisma.projectMilestone.deleteMany({ where: { scheduleId: parseInt(scheduleId) } })
    return NextResponse.json({ success: true })
  }
  const id = parseInt(searchParams.get('id') || '0')
  await prisma.projectMilestone.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
