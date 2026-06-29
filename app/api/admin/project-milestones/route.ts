import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const milestones = await prisma.projectMilestone.findMany({ orderBy: [{ projectName: 'asc' }, { order: 'asc' }] })
  return NextResponse.json(milestones)
}

export async function POST(req: Request) {
  const body = await req.json()
  const milestone = await prisma.projectMilestone.create({
    data: { projectName: body.projectName, label: body.label, date: new Date(body.date), status: body.status ?? 'pending', order: body.order ?? 0 },
  })
  return NextResponse.json(milestone)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const milestone = await prisma.projectMilestone.update({
    where: { id: body.id },
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.order !== undefined && { order: body.order }),
    },
  })
  return NextResponse.json(milestone)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '0')
  await prisma.projectMilestone.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
