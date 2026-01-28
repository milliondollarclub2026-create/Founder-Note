import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { trackTokens } from '@/lib/track-tokens';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Smartification prompt - creates structured, scannable notes
const SMARTIFY_SYSTEM_PROMPT = `You are an expert editor that transforms raw voice transcriptions into well-structured, scannable notes.

Your output must follow this exact format:
- Use **HEADINGS** (2-4 words, all caps) to organize major topics
- Use **Subheadings** (Title Case, bold with **) for sub-topics under each heading
- Use bullet points (•) for key information under subheadings
- Bullets must be concise (1-2 sentences max), scannable, not paragraphs

Rules:
- Remove all filler words (um, uh, like, you know, basically, so, actually, etc.)
- Fix grammar and punctuation
- Organize content logically by topic
- Keep the speaker's ideas and meaning intact
- DO NOT add information not in the original
- DO NOT use markdown code blocks
- Use plain text with the following formatting:
  - HEADINGS in ALL CAPS on their own line
  - Subheadings in Title Case with ** around them
  - Bullets starting with •

Example output format:

PRODUCT IDEAS

**Feature Concepts**
• Users want a simpler onboarding flow with fewer steps
• Mobile app should sync automatically with desktop

**Technical Considerations**
• Need to evaluate cloud storage options for scalability
• Consider implementing offline mode for mobile

NEXT STEPS

**Immediate Actions**
• Schedule follow-up meeting with the dev team
• Draft initial wireframes for the new onboarding flow

The goal is maximum readability when skimming - a user should grasp the full meaning in seconds.
Strike the right balance between clarity and completeness - not too wordy, but don't lose important context.`;

export async function POST(request) {
  try {
    const { getAuthenticatedUser } = await import('@/lib/supabase-server');
    const { user, supabase } = await getAuthenticatedUser();
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
          content: SMARTIFY_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Transform this voice transcription into a structured, scannable note:\n\n"${transcription}"`
        }
      ],
      temperature: 0.3,
    });

    // Track token usage
    if (completion.usage?.total_tokens) {
      await trackTokens(supabase, user.id, completion.usage.total_tokens);
    }

    return NextResponse.json({
      success: true,
      smartified: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
