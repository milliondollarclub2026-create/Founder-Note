import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

// GET - Returns all folders for user with starred status
// 1. Fetch from folders table
// 2. Auto-discover from notes.folder
// 3. Merge (discovered folders get starred=false)
// 4. Return combined list
export async function GET(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Fetch stored folders with starred status
    const { data: storedFolders, error: foldersError } = await supabase
      .from('folders')
      .select('name, starred')
      .eq('user_id', user.id);

    if (foldersError) {
      console.error('Folders fetch error:', foldersError);
      return NextResponse.json({ error: foldersError.message }, { status: 500 });
    }

    // 2. Auto-discover folders from notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('folder')
      .eq('user_id', user.id)
      .not('folder', 'is', null);

    if (notesError) {
      console.error('Notes fetch error:', notesError);
      return NextResponse.json({ error: notesError.message }, { status: 500 });
    }

    // Dedupe folders from notes
    const discoveredFolderNames = [...new Set(notes?.map(n => n.folder).filter(Boolean) || [])];

    // 3. Merge: stored folders + discovered folders with default starred=false
    const storedFolderMap = new Map(storedFolders?.map(f => [f.name, f]) || []);
    const mergedFolders = [];

    // Add all stored folders
    for (const folder of storedFolders || []) {
      mergedFolders.push({ name: folder.name, starred: folder.starred });
    }

    // Add discovered folders that aren't in stored folders (with starred=false)
    for (const folderName of discoveredFolderNames) {
      if (!storedFolderMap.has(folderName)) {
        mergedFolders.push({ name: folderName, starred: false });
      }
    }

    // Sort: starred first, then alphabetically
    mergedFolders.sort((a, b) => {
      if (a.starred && !b.starred) return -1;
      if (!a.starred && b.starred) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ folders: mergedFolders });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create folder
// Body: { name, starred? }
// Upsert into folders table
export async function POST(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, starred = false } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Upsert: insert or update if exists
    const { data, error } = await supabase
      .from('folders')
      .upsert(
        { user_id: user.id, name: trimmedName, starred },
        { onConflict: 'user_id,name' }
      )
      .select()
      .single();

    if (error) {
      console.error('Folder upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ folder: { name: data.name, starred: data.starred } });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
