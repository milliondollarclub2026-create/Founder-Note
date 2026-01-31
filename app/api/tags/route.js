import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

// GET - Returns all tags for user with colors
// 1. Fetch from tags table
// 2. Auto-discover from notes.tags
// 3. Merge (discovered tags get default 'slate' color)
// 4. Return combined list
export async function GET(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Fetch stored tags with colors
    const { data: storedTags, error: tagsError } = await supabase
      .from('tags')
      .select('name, color')
      .eq('user_id', user.id);

    if (tagsError) {
      console.error('Tags fetch error:', tagsError);
      return NextResponse.json({ error: tagsError.message }, { status: 500 });
    }

    // 2. Auto-discover tags from notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('tags')
      .eq('user_id', user.id);

    if (notesError) {
      console.error('Notes fetch error:', notesError);
      return NextResponse.json({ error: notesError.message }, { status: 500 });
    }

    // Flatten and dedupe tags from notes
    const discoveredTagNames = [...new Set(notes?.flatMap(n => n.tags || []) || [])];

    // 3. Merge: stored tags + discovered tags with default color
    const storedTagMap = new Map(storedTags?.map(t => [t.name, t]) || []);
    const mergedTags = [];

    // Add all stored tags
    for (const tag of storedTags || []) {
      mergedTags.push({ name: tag.name, color: tag.color });
    }

    // Add discovered tags that aren't in stored tags (with default color)
    for (const tagName of discoveredTagNames) {
      if (!storedTagMap.has(tagName)) {
        mergedTags.push({ name: tagName, color: 'slate' });
      }
    }

    // Sort alphabetically by name
    mergedTags.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ tags: mergedTags });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create/update tag
// Body: { name, color }
// Upsert into tags table
export async function POST(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, color = 'slate' } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Upsert: insert or update if exists
    const { data, error } = await supabase
      .from('tags')
      .upsert(
        { user_id: user.id, name: trimmedName, color },
        { onConflict: 'user_id,name' }
      )
      .select()
      .single();

    if (error) {
      console.error('Tag upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tag: { name: data.name, color: data.color } });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
