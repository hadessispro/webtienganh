import { PrismaClient } from '@prisma/client'
import { FOUNDATION_SEED } from '../app/lib/skill-seed-foundation'
import { TRACK_TEMPLATES } from '../app/lib/track-templates'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Seed Tracks
  for (const track of TRACK_TEMPLATES) {
    await prisma.track.upsert({
      where: { id: track.id },
      update: {
        nameVi: track.name_vi,
        descriptionVi: track.description_vi,
        cefrRangeLow: track.cefr_range[0],
        cefrRangeHigh: track.cefr_range[1],
        goal: track.goal,
        requiredTags: track.required_tags,
        preferredTags: track.preferred_tags || [],
        estimatedHours: track.estimated_hours,
      },
      create: {
        id: track.id,
        nameVi: track.name_vi,
        descriptionVi: track.description_vi,
        cefrRangeLow: track.cefr_range[0],
        cefrRangeHigh: track.cefr_range[1],
        goal: track.goal,
        requiredTags: track.required_tags,
        preferredTags: track.preferred_tags || [],
        estimatedHours: track.estimated_hours,
        isPublished: true,
      },
    })
  }

  // Seed Skills
  for (const skill of FOUNDATION_SEED) {
    await prisma.skill.upsert({
      where: { id: skill.id },
      update: {
        level: skill.level,
        tags: skill.tags,
        prerequisites: skill.prerequisites,
        estimatedSeconds: skill.estimated_seconds,
        payload: skill.payload as any,
        authorNote: skill.author_note,
      },
      create: {
        id: skill.id,
        level: skill.level,
        tags: skill.tags,
        prerequisites: skill.prerequisites,
        estimatedSeconds: skill.estimated_seconds,
        payload: skill.payload as any,
        authorNote: skill.author_note,
      },
    })
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
