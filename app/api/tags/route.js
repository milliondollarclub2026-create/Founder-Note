import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('notes')
      .select('tags')
      .eq('user_id', user.id);

    if (error) {
      console.error('Tags fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten and dedupe tags
    const allTags = data?.flatMap(n => n.tags || []) || [];
    const uniqueTags = [...new Set(allTags)];

    return NextResponse.json({ tags: uniqueTags });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
