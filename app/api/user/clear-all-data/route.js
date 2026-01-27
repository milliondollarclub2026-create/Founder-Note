import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase';

export async function DELETE(request) {
  try {
    // Verify the user is authenticated
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;

    // Admin client needed for bulk cross-table deletes
    const supabase = createAdminClient();

    // 1. Delete all todos for user's notes first (foreign key constraint)
    const { data: userNotes } = await supabase
      .from('notes')
      .select('id')
      .eq('user_id', userId);

    if (userNotes && userNotes.length > 0) {
      const noteIds = userNotes.map(n => n.id);
      await supabase
        .from('todos')
        .delete()
        .in('note_id', noteIds);
    }

    // 2. Delete all notes
    const { error: notesError } = await supabase
      .from('notes')
      .delete()
      .eq('user_id', userId);

    if (notesError) {
      console.error('Error deleting notes:', notesError);
      throw notesError;
    }

    // 3. Delete any orphan todos directly associated with user
    await supabase
      .from('todos')
      .delete()
      .eq('user_id', userId);

    // 4. Delete intents
    await supabase
      .from('intents')
      .delete()
      .eq('user_id', userId);

    // 5. Delete brain dump cache
    await supabase
      .from('brain_dump_cache')
      .delete()
      .eq('user_id', userId);

    // 6. Reset onboarding preferences in user_profiles (keep account, clear preferences)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        usage_preferences: [],
        ai_style_preferences: [],
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Non-fatal, continue
    }

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully',
      cleared: {
        notes: userNotes?.length || 0,
        todos: true,
        intents: true,
        brainDumpCache: true,
        preferences: true
      }
    });
  } catch (error) {
    console.error('Clear all data error:', error);
    return NextResponse.json({ error: error.message || 'Failed to clear data' }, { status: 500 });
  }
}
