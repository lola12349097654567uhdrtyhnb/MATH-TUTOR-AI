import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/lib/models/Question';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    await dbConnect();
    
    // In NextJS app router, process.cwd() is the frontend directory
    const dataPath = path.join(process.cwd(), '../questions.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const questions = JSON.parse(rawData);

    for (const q of questions) {
      await Question.findOneAndUpdate(
        { id: q.id },
        { $set: q },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true, migrated_count: questions.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
