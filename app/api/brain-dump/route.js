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

    const { contextScope, forceRefresh } = await request.json();

    // Determine scope type and value for caching
    const scopeType = contextScope?.type || 'global';
    const scopeValue = scopeType === 'folder' ? contextScope.folder :
                       scopeType === 'tag' ? contextScope.tag : null;

    let notes = [];
    let scopeDescription = '';

    // Fetch notes based on context scope
    if (scopeType === 'folder' && scopeValue) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('folder', scopeValue)
        .order('created_at', { ascending: false });

      if (error) throw error;
      notes = data || [];
      scopeDescription = `the "${scopeValue}" folder`;
    } else if (scopeType === 'tag' && scopeValue) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .contains('tags', [scopeValue])
        .order('created_at', { ascending: false });

      if (error) throw error;
      notes = data || [];
      scopeDescription = `notes tagged "${scopeValue}"`;
    } else {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      notes = data || [];
      scopeDescription = 'all your notes';
    }

    // Return empty synthesis if no notes
    if (notes.length === 0) {
      return NextResponse.json({
        success: true,
        synthesis: {
          openThoughts: [],
          decisions: [],
          questions: [],
          blockers: [],
          ideas: [],
          themes: []
        },
        scope: scopeDescription,
        noteCount: 0,
        cached: false
      });
    }

    // Generate content hash based on note IDs + updated timestamps
    // This hash changes when notes are added, edited, or removed
    const contentSignature = notes
      .map(n => `${n.id}:${n.updated_at || n.created_at}`)
      .sort()
      .join('|');
    const contentHash = Buffer.from(contentSignature).toString('base64').substring(0, 64);

    // Check for existing cached synthesis (unless force refresh)
    if (!forceRefresh) {
      try {
        const { data: cached } = await supabase
          .from('brain_dump_cache')
          .select('*')
          .eq('user_id', user.id)
          .eq('scope_type', scopeType)
          .eq('scope_value', scopeValue || '')
          .single();

        // If cache exists and hash matches, return cached result
        if (cached && cached.content_hash === contentHash) {
          console.log('Brain Dump: Returning cached synthesis');
          return NextResponse.json({
            success: true,
            synthesis: cached.synthesis,
            scope: scopeDescription,
            noteCount: notes.length,
            cached: true,
            cachedAt: cached.updated_at
          });
        }
      } catch (cacheError) {
        // Cache miss or table doesn't exist, proceed with generation
        console.log('Brain Dump: Cache miss, generating new synthesis');
      }
    } else {
      console.log('Brain Dump: Force refresh requested');
    }

    // Build content for analysis (no cache hit, need to generate)
    const notesContent = notes.map(n => {
      const content = n.smartified_text || n.transcription || '';
      return `[Note: "${n.title}" - ${new Date(n.created_at).toLocaleDateString()}]
Summary: ${n.summary || 'No summary'}
Key Points: ${n.key_points?.join('; ') || 'None'}
Content: ${content.substring(0, 1000)}`;
    }).join('\n\n---\n\n');

    const synthesisPrompt = `You are analyzing a user's voice notes to extract their current mental state - what's on their mind, what they're thinking about, what remains unresolved.

Analyze these notes and extract mental fragments into these categories:

1. **Open Thoughts** - Incomplete ideas, things being mulled over, work in progress thinking
2. **Decisions** - Choices that were mentioned, made, or are pending
3. **Questions** - Unresolved questions, things they're wondering about
4. **Blockers** - Concerns, obstacles, things holding them back
5. **Ideas** - Creative concepts, possibilities, things worth exploring
6. **Themes** - Recurring topics or patterns across multiple notes

For each item:
- Keep it SHORT (1 sentence max, ideally a fragment)
- Use the user's own words when possible
- Include the source note title in parentheses
- Focus on what's mentally present, not tasks to do

Return JSON in this exact format:
{
  "openThoughts": [{"text": "...", "noteTitle": "...", "noteId": "..."}],
  "decisions": [{"text": "...", "noteTitle": "...", "noteId": "..."}],
  "questions": [{"text": "...", "noteTitle": "...", "noteId": "..."}],
  "blockers": [{"text": "...", "noteTitle": "...", "noteId": "..."}],
  "ideas": [{"text": "...", "noteTitle": "...", "noteId": "..."}],
  "themes": [{"text": "...", "noteCount": 2}]
}

Keep each category to 5 items max. If a category has nothing, return empty array.

NOTES TO ANALYZE:
${notesContent}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You extract mental fragments from notes. Return only valid JSON, no markdown.' },
        { role: 'user', content: synthesisPrompt }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    // Track token usage
    if (completion.usage?.total_tokens) {
      await trackTokens(supabase, user.id, completion.usage.total_tokens);
    }

    let synthesis;
    try {
      synthesis = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      synthesis = {
        openThoughts: [],
        decisions: [],
        questions: [],
        blockers: [],
        ideas: [],
        themes: []
      };
    }

    // Map note titles to actual note IDs for navigation
    const noteMap = {};
    notes.forEach(n => { noteMap[n.title] = n.id; });

    const mapNoteIds = (items) => {
      return (items || []).map(item => ({
        ...item,
        noteId: noteMap[item.noteTitle] || item.noteId || null
      }));
    };

    synthesis.openThoughts = mapNoteIds(synthesis.openThoughts);
    synthesis.decisions = mapNoteIds(synthesis.decisions);
    synthesis.questions = mapNoteIds(synthesis.questions);
    synthesis.blockers = mapNoteIds(synthesis.blockers);
    synthesis.ideas = mapNoteIds(synthesis.ideas);

    // Store in cache (upsert)
    try {
      await supabase
        .from('brain_dump_cache')
        .upsert({
          user_id: user.id,
          scope_type: scopeType,
          scope_value: scopeValue || '',
          content_hash: contentHash,
          synthesis: synthesis,
          note_count: notes.length,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,scope_type,scope_value'
        });
      console.log('Brain Dump: Cached new synthesis');
    } catch (cacheError) {
      // Cache write failed, log but don't fail the request
      console.error('Failed to cache brain dump:', cacheError);
    }

    return NextResponse.json({
      success: true,
      synthesis,
      scope: scopeDescription,
      noteCount: notes.length,
      cached: false,
      notes: notes.map(n => ({ id: n.id, title: n.title }))
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
