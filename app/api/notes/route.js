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

    // Insert action items as todos if present
    if (actionItems && actionItems.length > 0) {
      const todosToInsert = actionItems.map(item => ({
        id: uuidv4(),
        user_id: user.id,
        note_id: noteId,
        title: typeof item === 'string' ? item : item.task || item.title || item,
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

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
