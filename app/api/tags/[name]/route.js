import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

// PUT /api/tags/[name] - Rename tag or change color with cascading updates
// Body: { newName?, color? }
// Cascades to: notes.tags, intents.tags, brain_dump_cache
export async function PUT(request, { params }) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const oldName = decodeURIComponent(params.name);
    const body = await request.json();
    const { newName, color } = body;

    if (!newName && !color) {
      return NextResponse.json({ error: 'newName or color is required' }, { status: 400 });
    }

    const trimmedNewName = newName?.trim();

    // Check if renaming to an existing tag name
    if (trimmedNewName && trimmedNewName !== oldName) {
      const { data: existing } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', trimmedNewName)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'A tag with that name already exists' }, { status: 409 });
      }
    }

    // 1. Update or create the tag in tags table
    const updateData = {};
    if (trimmedNewName) updateData.name = trimmedNewName;
    if (color) updateData.color = color;

    // First try to update existing tag
    const { data: updatedTag, error: updateError } = await supabase
      .from('tags')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('name', oldName)
      .select()
      .single();

    // If tag doesn't exist in table, create it (for auto-discovered tags)
    if (updateError?.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('tags')
        .insert({
          user_id: user.id,
          name: trimmedNewName || oldName,
          color: color || 'slate'
        });

      if (insertError) {
        console.error('Tag insert error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    } else if (updateError) {
      console.error('Tag update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If renaming, cascade updates
    if (trimmedNewName && trimmedNewName !== oldName) {
      // 2. Update ALL notes where tags contains old_name
      // Supabase doesn't support array element updates directly, so we need to:
      // a) Fetch notes with the old tag
      // b) Update each one with the new tag array
      const { data: notesWithTag, error: notesError } = await supabase
        .from('notes')
        .select('id, tags')
        .eq('user_id', user.id)
        .contains('tags', [oldName]);

      if (notesError) {
        console.error('Notes fetch error:', notesError);
      } else if (notesWithTag?.length > 0) {
        // Update each note's tags array
        for (const note of notesWithTag) {
          const updatedTags = (note.tags || []).map(t => t === oldName ? trimmedNewName : t);
          await supabase
            .from('notes')
            .update({ tags: updatedTags })
            .eq('id', note.id)
            .eq('user_id', user.id);
        }
      }

      // 3. Update ALL intents where tags contains old_name
      const { data: intentsWithTag, error: intentsError } = await supabase
        .from('intents')
        .select('id, tags')
        .eq('user_id', user.id)
        .contains('tags', [oldName]);

      if (intentsError) {
        console.error('Intents fetch error:', intentsError);
      } else if (intentsWithTag?.length > 0) {
        for (const intent of intentsWithTag) {
          const updatedTags = (intent.tags || []).map(t => t === oldName ? trimmedNewName : t);
          await supabase
            .from('intents')
            .update({ tags: updatedTags })
            .eq('id', intent.id)
            .eq('user_id', user.id);
        }
      }

      // 4. Delete brain_dump_cache where scope_type='tag' AND scope_value=old_name
      await supabase
        .from('brain_dump_cache')
        .delete()
        .eq('user_id', user.id)
        .eq('scope_type', 'tag')
        .eq('scope_value', oldName);
    }

    return NextResponse.json({
      success: true,
      tag: { name: trimmedNewName || oldName, color: color || updatedTag?.color || 'slate' }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tags/[name] - Delete tag with cascading updates
// Cascades to: notes.tags, intents.tags, brain_dump_cache
export async function DELETE(request, { params }) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tagName = decodeURIComponent(params.name);

    // 1. Delete from tags table
    await supabase
      .from('tags')
      .delete()
      .eq('user_id', user.id)
      .eq('name', tagName);

    // 2. Remove tag from ALL notes.tags arrays
    const { data: notesWithTag, error: notesError } = await supabase
      .from('notes')
      .select('id, tags')
      .eq('user_id', user.id)
      .contains('tags', [tagName]);

    if (notesError) {
      console.error('Notes fetch error:', notesError);
    } else if (notesWithTag?.length > 0) {
      for (const note of notesWithTag) {
        const updatedTags = (note.tags || []).filter(t => t !== tagName);
        await supabase
          .from('notes')
          .update({ tags: updatedTags })
          .eq('id', note.id)
          .eq('user_id', user.id);
      }
    }

    // 3. Remove tag from ALL intents.tags arrays
    const { data: intentsWithTag, error: intentsError } = await supabase
      .from('intents')
      .select('id, tags')
      .eq('user_id', user.id)
      .contains('tags', [tagName]);

    if (intentsError) {
      console.error('Intents fetch error:', intentsError);
    } else if (intentsWithTag?.length > 0) {
      for (const intent of intentsWithTag) {
        const updatedTags = (intent.tags || []).filter(t => t !== tagName);
        await supabase
          .from('intents')
          .update({ tags: updatedTags })
          .eq('id', intent.id)
          .eq('user_id', user.id);
      }
    }

    // 4. Delete brain_dump_cache where scope_type='tag' AND scope_value=tag_name
    await supabase
      .from('brain_dump_cache')
      .delete()
      .eq('user_id', user.id)
      .eq('scope_type', 'tag')
      .eq('scope_value', tagName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
