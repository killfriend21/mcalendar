import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET all schedules
export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: { date: 'asc' }
    })
    return NextResponse.json(schedules)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching schedules' }, { status: 500 })
  }
}

// CREATE schedule
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const schedule = await prisma.schedule.create({
      data: {
        date: new Date(body.date),
        endDate: body.endDate ? new Date(body.endDate) : null,
        projectName: body.projectName,
        teamName: body.teamName,
        peopleCount: parseInt(body.peopleCount),
        members: body.members,
        shift: body.shift || 'เช้า',
        notes: body.notes || null,
        color: body.color || '#3B82F6'
      }
    })
    return NextResponse.json(schedule)
  } catch (error) {
    return NextResponse.json({ error: 'Error creating schedule' }, { status: 500 })
  }
}

// UPDATE schedule
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const schedule = await prisma.schedule.update({
      where: { id: body.id },
      data: {
        date: new Date(body.date),
        endDate: body.endDate ? new Date(body.endDate) : null,
        projectName: body.projectName,
        teamName: body.teamName,
        peopleCount: parseInt(body.peopleCount),
        members: body.members,
        shift: body.shift,
        notes: body.notes || null,
        color: body.color || '#3B82F6'
      }
    })
    return NextResponse.json(schedule)
  } catch (error) {
    return NextResponse.json({ error: 'Error updating schedule' }, { status: 500 })
  }
}

// DELETE schedule
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    await prisma.schedule.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting schedule' }, { status: 500 })
  }
}