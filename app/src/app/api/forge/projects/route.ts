// POST /api/forge/projects - Create Forge Project
// Aligned with CLAUDE.md Section 12: API Spec

import { NextRequest, NextResponse } from 'next/server';
import { db, forgeProjects, forgeBlueprints } from '@/db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface ClientBrief {
  event_type: string;
  date: string;
  city: string;
  guest_count: string;
  venue_status: string;
}

interface CreateForgeProjectRequest {
  userId: string;
  clientBrief: ClientBrief;
  blueprintId?: string;
  title?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateForgeProjectRequest = await request.json();
    const { userId, clientBrief, blueprintId, title } = body;

    // Validate required fields
    if (!userId || !clientBrief) {
      return NextResponse.json(
        { error: 'userId and clientBrief are required' },
        { status: 400 }
      );
    }

    // Get blueprint (either provided or select default)
    let blueprint;
    if (blueprintId) {
      const blueprintResult = await db.query.forgeBlueprints.findFirst({
        where: eq(forgeBlueprints.eventTypeKey, blueprintId),
      });
      blueprint = blueprintResult;
    }

    // If no blueprint found, use master blueprint
    if (!blueprint) {
      const masterBlueprint = await db.query.forgeBlueprints.findFirst({
        where: eq(forgeBlueprints.eventTypeKey, 'master_forge_blueprint'),
      });
      blueprint = masterBlueprint;
    }

    // Generate project title if not provided
    const projectTitle = title || `${clientBrief.event_type} Forge - ${clientBrief.date}`;

    // Create forge project
    const [newProject] = await db.insert(forgeProjects).values({
      ownerUserId: userId,
      title: projectTitle,
      clientBriefJson: clientBrief,
      blueprintId: blueprint?.id,
      blueprintSnapshotJson: blueprint?.blueprintContentJson || {},
      forgeStatus: 'BLUEPRINT_READY',
    }).returning();

    return NextResponse.json({
      success: true,
      forgeProjectId: newProject.id,
      forgeProject: newProject,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating forge project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/forge/projects - List all forge projects (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = db.query.forgeProjects.findMany({
      with: {
        owner: true,
        blueprint: true,
        craftProposals: true,
      },
      orderBy: (forgeProjects, { desc }) => [desc(forgeProjects.createdAt)],
    });

    // Note: Drizzle query builder doesn't allow dynamic where clauses easily
    // For production, implement proper filtering
    const allProjects = await query;

    // Filter in memory for now (not ideal for large datasets)
    let filteredProjects = allProjects;
    if (userId) {
      filteredProjects = filteredProjects.filter(p => p.ownerUserId === userId);
    }
    if (status) {
      filteredProjects = filteredProjects.filter(p => p.forgeStatus === status);
    }

    return NextResponse.json({
      success: true,
      projects: filteredProjects,
      count: filteredProjects.length,
    });

  } catch (error) {
    console.error('Error fetching forge projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
