// GET /api/forge/projects/:id - Retrieve Forge Project
// Aligned with CLAUDE.md Section 12: API Spec

import { NextRequest, NextResponse } from 'next/server';
import { db, forgeProjects } from '../../../../../db';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch forge project with all relations
    const forgeProject = await db.query.forgeProjects.findFirst({
      where: eq(forgeProjects.id, id),
      with: {
        owner: true,
        blueprint: true,
        craftProposals: {
          with: {
            craftsman: {
              with: {
                user: true,
              },
            },
          },
        },
        forgeContract: true,
      },
    });

    if (!forgeProject) {
      return NextResponse.json(
        { error: 'Forge project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      forgeProject,
    });

  } catch (error) {
    console.error('Error fetching forge project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/forge/projects/:id - Update Forge Project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    // Validate updates (only allow certain fields)
    const allowedUpdates = ['forgeStatus', 'forgeFloorPrice', 'biddingClosesAt', 'title'];
    const updateData: Record<string, unknown> = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    // Update forge project
    const [updatedProject] = await db.update(forgeProjects)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(forgeProjects.id, id))
      .returning();

    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Forge project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      forgeProject: updatedProject,
    });

  } catch (error) {
    console.error('Error updating forge project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
