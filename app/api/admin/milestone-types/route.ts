import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULTS = [
  { name: 'gate', label: 'Gate Event', color: '#DC2626', bgColor: '#FEE2E2', priority: 1, order: 0 },
  { name: 'production', label: 'Production Event', color: '#2563EB', bgColor: '#DBEAFE', priority: 2, order: 1 },
  { name: 'test', label: 'Test Event', color: '#7C3AED', bgColor: '#EDE9FE', priority: 2, order: 2 },
]

export async function GET() {
  let types = await prisma.milestoneType.findMany({ orderBy: [{ priority: 'asc' }, { order: 'asc' }] })
  if (types.length === 0) {
    await prisma.milestoneType.createMany({ data: DEFAULTS })
    types = await prisma.milestoneType.findMany({ orderBy: [{ priority: 'asc' }, { order: 'asc' }] })
  }
  return NextResponse.json(types)
}

export async function POST(req: Request) {
  const body = await req.json()
  const count = await prisma.milestoneType.count()
  const type = await prisma.milestoneType.create({
    data: {
      name: body.name,
      label: body.label,
      color: body.color ?? '#6B7280',
      bgColor: body.bgColor ?? '#F3F4F6',
      priority: body.priority ?? 2,
      order: body.order ?? count,
    },
  })
  return NextResponse.json(type)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const type = await prisma.milestoneType.update({
    where: { id: body.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.label !== undefined && { label: body.label }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.bgColor !== undefined && { bgColor: body.bgColor }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.order !== undefined && { order: body.order }),
    },
  })
  return NextResponse.json(type)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '0')
  await prisma.milestoneType.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
