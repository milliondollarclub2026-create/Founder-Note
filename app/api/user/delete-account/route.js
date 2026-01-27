import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase';

export async function DELETE(request) {
  try {
    // Verify the user is authenticated
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;

    // Admin client needed for cross-table deletes and auth.admin.deleteUser()
    const supabase = createAdminClient();

    // 1. Delete todos linked to user's notes (FK dependency)
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
    await supabase
      .from('notes')
      .delete()
      .eq('user_id', userId);

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

    // 6. Delete user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      // Continue anyway - the auth deletion is most important
    }

    // 7. Delete auth user using admin API (requires service role)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json({
        error: 'Failed to delete authentication record. Please contact support.',
        details: authError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to delete account',
      details: 'If the problem persists, please contact support.'
    }, { status: 500 });
  }
}
