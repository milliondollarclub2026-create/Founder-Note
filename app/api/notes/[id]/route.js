import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

// GET /api/notes/[id] - Get a single note (ownership enforced)
export async function GET(request, { params }) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const noteId = params.id;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Note fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note: data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notes/[id] - Update a note (ownership enforced)
export async function PUT(request, { params }) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const noteId = params.id;
    const body = await request.json();
    const { transcription, smartified_text, folder, starred, tags } = body;

    // Build update object with only provided fields
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (transcription !== undefined) updateData.transcription = transcription;
    if (smartified_text !== undefined) updateData.smartified_text = smartified_text;
    if (folder !== undefined) updateData.folder = folder;
    if (starred !== undefined) updateData.starred = starred;
    if (tags !== undefined) updateData.tags = tags;

    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Note update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, note: data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notes/[id] - Delete a note (ownership enforced)
export async function DELETE(request, { params }) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const noteId = params.id;

    // Delete associated todos first
    await supabase
      .from('todos')
      .delete()
      .eq('note_id', noteId);

    // Delete the note (user_id check for defense-in-depth)
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Note delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
