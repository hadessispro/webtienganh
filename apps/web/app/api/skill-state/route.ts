import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const states = await prisma.userSkillState.findMany({
    where: { userId: session.user.id }
  })
  
  const stateMap = states.reduce((acc: any, curr: any) => {
    acc[curr.skillId] = {
      isUnlocked: curr.isUnlocked,
      isCompleted: curr.isCompleted,
      score: curr.score
    }
    return acc
  }, {} as Record<string, any>)

  return NextResponse.json(stateMap)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { states } = await req.json()
  
  if (!states || typeof states !== 'object') {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  // Upsert all skill states
  for (const [skillId, stateData] of Object.entries(states)) {
    const data: any = stateData
    await prisma.userSkillState.upsert({
      where: {
        userId_skillId: {
          userId: session.user.id,
          skillId: skillId
        }
      },
      update: {
        isUnlocked: data.isUnlocked,
        isCompleted: data.isCompleted,
        score: data.score
      },
      create: {
        userId: session.user.id,
        skillId: skillId,
        isUnlocked: data.isUnlocked || false,
        isCompleted: data.isCompleted || false,
        score: data.score
      }
    })
  }

  return NextResponse.json({ success: true })
}
