import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const completed = searchParams.get('completed');

    let query = supabase
      .from('todos')
      .select('*, notes(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (completed !== null && completed !== undefined) {
      query = query.eq('completed', completed === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Todos fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ todos: data || [] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
