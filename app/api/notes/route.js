import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';

// GET /api/notes - List notes for authenticated user
export async function GET(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';

    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (search) {
      // Sanitize search param: strip % and _ to prevent PostgREST filter injection
      const sanitized = search.replace(/[%_]/g, '');
      if (sanitized) {
        query = query.or(`title.ilike.%${sanitized}%,transcription.ilike.%${sanitized}%`);
      }
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Notes fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes: data || [] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notes - Create a new note
export async function POST(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, transcription, summary, keyPoints, actionItems, tags, audioUrl, smartifiedText } = await request.json();

    if (!transcription) {
      return NextResponse.json({ error: 'transcription required' }, { status: 400 });
    }

    const noteId = uuidv4();

    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        id: noteId,
        user_id: user.id,
        title: title || 'Untitled Note',
        transcription,
        smartified_text: smartifiedText || null,
        summary: summary || '',
        key_points: keyPoints || [],
        tags: tags || [],
        audio_url: audioUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (noteError) {
      console.error('Note insert error:', noteError);
      return NextResponse.json({ error: noteError.message }, { status: 500 });
    }

    // Split action items into regular todos and Remy-directed intents
    if (actionItems && actionItems.length > 0) {
      const regularTodos = [];
      const remyIntents = [];

      actionItems.forEach(item => {
        if (typeof item === 'string') {
          regularTodos.push(item);
        } else if (item.type === 'remy') {
          remyIntents.push(item);
        } else {
          regularTodos.push(item);
        }
      });

      // Insert regular todos
      if (regularTodos.length > 0) {
        const todosToInsert = regularTodos.map(item => ({
          id: uuidv4(),
          user_id: user.id,
          note_id: noteId,
          title: typeof item === 'string' ? item : item.task || item.title || String(item),
          completed: false,
          created_at: new Date().toISOString()
        }));

        const { error: todosError } = await supabase
          .from('todos')
          .insert(todosToInsert);

        if (todosError) {
          console.error('Todos insert error:', todosError);
        }
      }

      // Insert Remy-directed items as intents
      if (remyIntents.length > 0) {
        const intentsToInsert = remyIntents.map(item => ({
          id: uuidv4(),
          user_id: user.id,
          raw_text: item.task,
          normalized_intent: item.task,
          intent_type: 'remember',
          source_type: 'note',
          source_id: noteId,
          source_title: title || 'Untitled Note',
          context_scope: 'note',
          status: 'active',
          created_at: new Date().toISOString()
        }));

        const { error: intentsError } = await supabase
          .from('intents')
          .insert(intentsToInsert);

        if (intentsError) {
          console.error('Intents insert error:', intentsError);
        }
      }
    }

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
