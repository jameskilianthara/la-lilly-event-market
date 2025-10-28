import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;

    // Map type to available checklist files
    const validTypes = ['wedding', 'conference', 'party', 'exhibition'];
    const checklistType = validTypes.includes(type) ? type : 'wedding';

    // Read the JSON file
    const filePath = path.join(process.cwd(), 'src', 'data', 'checklists', `${checklistType}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const checklist = JSON.parse(fileContent);

    return NextResponse.json(checklist);
  } catch (error) {
    console.error('Error loading checklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}