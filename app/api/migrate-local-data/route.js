import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

// POST - One-time migration endpoint for existing users
// Body: { tags: [{name, color}], folders: string[], starredFolders: string[] }
// 1. Upsert tags into tags table (preserve colors)
// 2. Upsert folders into folders table (set starred status)
// 3. Auto-discover additional tags from notes
// 4. Auto-discover additional folders from notes
// 5. Return merged results
export async function POST(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { tags = [], folders = [], starredFolders = [] } = body;

    // Convert starredFolders to a Set for quick lookup
    const starredSet = new Set(starredFolders);

    // 1. Upsert tags into tags table
    if (tags.length > 0) {
      const tagRecords = tags.map(tag => ({
        user_id: user.id,
        name: typeof tag === 'string' ? tag : tag.name,
        color: typeof tag === 'object' && tag.color ? tag.color : 'slate'
      }));

      const { error: tagsError } = await supabase
        .from('tags')
        .upsert(tagRecords, { onConflict: 'user_id,name' });

      if (tagsError) {
        console.error('Tags migration error:', tagsError);
      }
    }

    // 2. Upsert folders into folders table
    if (folders.length > 0) {
      const folderRecords = folders.map(folderName => ({
        user_id: user.id,
        name: folderName,
        starred: starredSet.has(folderName)
      }));

      const { error: foldersError } = await supabase
        .from('folders')
        .upsert(folderRecords, { onConflict: 'user_id,name' });

      if (foldersError) {
        console.error('Folders migration error:', foldersError);
      }
    }

    // 3. Auto-discover additional tags from notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('tags, folder')
      .eq('user_id', user.id);

    if (notesError) {
      console.error('Notes fetch error:', notesError);
    }

    // Get existing tags from table
    const { data: existingTags } = await supabase
      .from('tags')
      .select('name')
      .eq('user_id', user.id);

    const existingTagNames = new Set(existingTags?.map(t => t.name) || []);

    // Find tags in notes that aren't in the tags table yet
    const discoveredTagNames = [...new Set(notes?.flatMap(n => n.tags || []) || [])];
    const newTags = discoveredTagNames.filter(name => !existingTagNames.has(name));

    if (newTags.length > 0) {
      const newTagRecords = newTags.map(name => ({
        user_id: user.id,
        name,
        color: 'slate'
      }));

      await supabase
        .from('tags')
        .upsert(newTagRecords, { onConflict: 'user_id,name' });
    }

    // 4. Auto-discover additional folders from notes
    const { data: existingFolders } = await supabase
      .from('folders')
      .select('name')
      .eq('user_id', user.id);

    const existingFolderNames = new Set(existingFolders?.map(f => f.name) || []);

    // Find folders in notes that aren't in the folders table yet
    const discoveredFolderNames = [...new Set(notes?.map(n => n.folder).filter(Boolean) || [])];
    const newFolders = discoveredFolderNames.filter(name => !existingFolderNames.has(name));

    if (newFolders.length > 0) {
      const newFolderRecords = newFolders.map(name => ({
        user_id: user.id,
        name,
        starred: false
      }));

      await supabase
        .from('folders')
        .upsert(newFolderRecords, { onConflict: 'user_id,name' });
    }

    // 5. Fetch and return merged results
    const { data: finalTags } = await supabase
      .from('tags')
      .select('name, color')
      .eq('user_id', user.id)
      .order('name');

    const { data: finalFolders } = await supabase
      .from('folders')
      .select('name, starred')
      .eq('user_id', user.id)
      .order('starred', { ascending: false })
      .order('name');

    return NextResponse.json({
      success: true,
      tags: finalTags || [],
      folders: finalFolders || []
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
