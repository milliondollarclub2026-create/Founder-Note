import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

// PUT /api/folders/[name] - Rename folder or toggle starred with cascading updates
// Body: { newName?, starred? }
// Cascades to: notes.folder, intents.folder, brain_dump_cache (if renaming)
export async function PUT(request, { params }) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const oldName = decodeURIComponent(params.name);
    const body = await request.json();
    const { newName, starred } = body;

    if (newName === undefined && starred === undefined) {
      return NextResponse.json({ error: 'newName or starred is required' }, { status: 400 });
    }

    const trimmedNewName = newName?.trim();

    // Check if renaming to an existing folder name
    if (trimmedNewName && trimmedNewName !== oldName) {
      const { data: existing } = await supabase
        .from('folders')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', trimmedNewName)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'A folder with that name already exists' }, { status: 409 });
      }
    }

    // 1. Update or create the folder in folders table
    const updateData = {};
    if (trimmedNewName !== undefined) updateData.name = trimmedNewName;
    if (starred !== undefined) updateData.starred = starred;

    // First try to update existing folder
    const { data: updatedFolder, error: updateError } = await supabase
      .from('folders')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('name', oldName)
      .select()
      .single();

    // If folder doesn't exist in table, create it (for auto-discovered folders)
    if (updateError?.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          name: trimmedNewName || oldName,
          starred: starred !== undefined ? starred : false
        });

      if (insertError) {
        console.error('Folder insert error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    } else if (updateError) {
      console.error('Folder update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If renaming, cascade updates
    if (trimmedNewName && trimmedNewName !== oldName) {
      // 2. Update ALL notes where folder = old_name
      const { error: notesUpdateError } = await supabase
        .from('notes')
        .update({ folder: trimmedNewName })
        .eq('user_id', user.id)
        .eq('folder', oldName);

      if (notesUpdateError) {
        console.error('Notes update error:', notesUpdateError);
      }

      // 3. Update ALL intents where folder = old_name
      const { error: intentsUpdateError } = await supabase
        .from('intents')
        .update({ folder: trimmedNewName })
        .eq('user_id', user.id)
        .eq('folder', oldName);

      if (intentsUpdateError) {
        console.error('Intents update error:', intentsUpdateError);
      }

      // 4. Delete brain_dump_cache where scope_type='folder' AND scope_value=old_name
      await supabase
        .from('brain_dump_cache')
        .delete()
        .eq('user_id', user.id)
        .eq('scope_type', 'folder')
        .eq('scope_value', oldName);
    }

    return NextResponse.json({
      success: true,
      folder: {
        name: trimmedNewName || oldName,
        starred: starred !== undefined ? starred : (updatedFolder?.starred || false)
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/folders/[name] - Delete folder with cascading updates
// Cascades to: notes.folder (set null), intents.folder (set null), brain_dump_cache
export async function DELETE(request, { params }) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const folderName = decodeURIComponent(params.name);

    // 1. Delete from folders table
    await supabase
      .from('folders')
      .delete()
      .eq('user_id', user.id)
      .eq('name', folderName);

    // 2. Set folder=null on ALL notes where folder = folder_name
    const { error: notesUpdateError } = await supabase
      .from('notes')
      .update({ folder: null })
      .eq('user_id', user.id)
      .eq('folder', folderName);

    if (notesUpdateError) {
      console.error('Notes update error:', notesUpdateError);
    }

    // 3. Set folder=null on ALL intents where folder = folder_name
    const { error: intentsUpdateError } = await supabase
      .from('intents')
      .update({ folder: null })
      .eq('user_id', user.id)
      .eq('folder', folderName);

    if (intentsUpdateError) {
      console.error('Intents update error:', intentsUpdateError);
    }

    // 4. Delete brain_dump_cache where scope_type='folder' AND scope_value=folder_name
    await supabase
      .from('brain_dump_cache')
      .delete()
      .eq('user_id', user.id)
      .eq('scope_type', 'folder')
      .eq('scope_value', folderName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
