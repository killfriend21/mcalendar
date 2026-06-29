import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULTS = [
  { name: 'pending', label: 'รอ', color: '#9CA3AF', bgColor: '#F3F4F6', order: 0 },
  { name: 'active', label: 'กำลังมาถึง', color: '#3B82F6', bgColor: '#EFF6FF', order: 1 },
  { name: 'done', label: 'เสร็จ', color: '#10B981', bgColor: '#D1FAE5', order: 2 },
]

export async function GET() {
  let statuses = await prisma.milestoneStatus.findMany({ orderBy: { order: 'asc' } })
  if (statuses.length === 0) {
    await prisma.milestoneStatus.createMany({ data: DEFAULTS })
    statuses = await prisma.milestoneStatus.findMany({ orderBy: { order: 'asc' } })
  }
  return NextResponse.json(statuses)
}

export async function POST(req: Request) {
  const body = await req.json()
  const count = await prisma.milestoneStatus.count()
  const status = await prisma.milestoneStatus.create({
    data: {
      name: body.name,
      label: body.label,
      color: body.color ?? '#6B7280',
      bgColor: body.bgColor ?? '#F3F4F6',
      order: body.order ?? count,
    },
  })
  return NextResponse.json(status)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const status = await prisma.milestoneStatus.update({
    where: { id: body.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.label !== undefined && { label: body.label }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.bgColor !== undefined && { bgColor: body.bgColor }),
      ...(body.order !== undefined && { order: body.order }),
    },
  })
  return NextResponse.json(status)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '0')
  await prisma.milestoneStatus.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
