import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import OpenAI from 'openai';
import { trackTokens } from '@/lib/track-tokens';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { noteId, transcription } = await request.json();

    if (!noteId || !transcription) {
      return NextResponse.json({ error: 'noteId and transcription required' }, { status: 400 });
    }

    // Generate new summary and key points
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that extracts structured information from voice note transcriptions.
Extract and return a JSON object with:
- summary: 2-3 sentence summary of the key content
- key_points: Array of bullet points (main ideas/insights, 3-7 points)

Return ONLY valid JSON, no markdown or explanation.`
        },
        {
          role: 'user',
          content: `Extract summary and key points from this transcription:\n\n"${transcription}"`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    // Track token usage
    if (completion.usage?.total_tokens) {
      await trackTokens(supabase, user.id, completion.usage.total_tokens);
    }

    let extracted;
    try {
      extracted = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      console.error('JSON parse error:', e);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Update the note in Supabase (ownership enforced via user_id)
    const { data, error } = await supabase
      .from('notes')
      .update({
        summary: extracted.summary || '',
        key_points: extracted.key_points || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Note update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      note: data,
      summary: extracted.summary,
      key_points: extracted.key_points
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
