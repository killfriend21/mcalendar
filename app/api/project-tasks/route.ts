import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncTaskToHomer } from '@/lib/homerSync'

export async function GET() {
  try {
    const tasks = await prisma.projectTask.findMany({
      orderBy: [{ projectName: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json(tasks)
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  try {
    const parentId: number | null = body.parentId ?? null
    const agg = await prisma.projectTask.aggregate({
      where: { projectName: body.projectName, parentId },
      _max: { order: true },
    })
    const nextOrder = (agg._max.order ?? -1) + 1
    const task = await prisma.projectTask.create({
      data: {
        projectName: body.projectName,
        title: body.title,
        month: body.month,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        order: nextOrder,
        parentId,
        members: body.members ?? null,
        scheduleId: body.scheduleId ?? null,
      },
    })
    if (parentId === null) {
      await syncTaskToHomer(task)
    }
    return NextResponse.json(task)
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  try {
    const task = await prisma.projectTask.update({
      where: { id: body.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.projectName !== undefined && { projectName: body.projectName }),
        ...(body.month !== undefined && { month: body.month }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.done !== undefined && { done: body.done }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.parentId !== undefined && { parentId: body.parentId }),
        ...(body.members !== undefined && { members: body.members }),
        ...(body.scheduleId !== undefined && { scheduleId: body.scheduleId }),
      },
    })
    return NextResponse.json(task)
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  try {
    await prisma.projectTask.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
