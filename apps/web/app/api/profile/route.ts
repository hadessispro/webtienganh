import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.placementProfile.findUnique({
    where: { userId: session.user.id }
  })
  
  return NextResponse.json(profile || {})
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await req.json()
  
  const profile = await prisma.placementProfile.upsert({
    where: { userId: session.user.id },
    update: {
      ...data,
      updatedAt: new Date()
    },
    create: {
      userId: session.user.id,
      ...data,
    }
  })

  return NextResponse.json(profile)
}
