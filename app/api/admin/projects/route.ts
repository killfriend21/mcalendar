import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const projects = await prisma.project.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(projects)
}

export async function POST(req: Request) {
  const body = await req.json()
  const project = await prisma.project.create({ data: { name: body.name, color: body.color || '#3B82F6' } })
  return NextResponse.json(project)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const project = await prisma.project.update({ where: { id: body.id }, data: { name: body.name, color: body.color } })
  return NextResponse.json(project)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '0')
  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
