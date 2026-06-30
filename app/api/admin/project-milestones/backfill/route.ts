import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const schedules = await prisma.schedule.findMany()
  const linked = await prisma.projectMilestone.findMany({ where: { scheduleId: { not: null } } })
  const linkedScheduleIds = new Set(linked.map(m => m.scheduleId))

  const missing = schedules.filter(s => !linkedScheduleIds.has(s.id))

  if (missing.length === 0) {
    return NextResponse.json({ created: 0 })
  }

  await prisma.projectMilestone.createMany({
    data: missing.map(s => ({
      projectName: s.projectName,
      label: s.notes?.trim() || s.members,
      date: s.date,
      type: 'test',
      scheduleId: s.id,
    })),
  })

  return NextResponse.json({ created: missing.length })
}