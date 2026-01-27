import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { getAuthenticatedUser } = await import('@/lib/supabase-server');
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { transcription } = await request.json();

    if (!transcription) {
      return NextResponse.json({ error: 'No transcription provided' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that extracts structured information from voice note transcriptions.
Extract and return a JSON object with:
- title: A short, descriptive title (max 50 chars)
- summary: 2-3 sentence summary of the key content
- key_points: Array of bullet points (main ideas/insights, 3-7 points)
- action_items: Array of actionable tasks mentioned (if any)
- tags: Array of 2-5 relevant tags/categories

Return ONLY valid JSON, no markdown or explanation.`
        },
        {
          role: 'user',
          content: `Extract information from this voice note transcription:\n\n"${transcription}"`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    let extracted;
    try {
      extracted = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      console.error('JSON parse error:', e);
      extracted = {
        title: 'Voice Note',
        summary: transcription.substring(0, 200),
        key_points: [],
        action_items: [],
        tags: ['voice-note']
      };
    }

    return NextResponse.json({
      success: true,
      extracted
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
