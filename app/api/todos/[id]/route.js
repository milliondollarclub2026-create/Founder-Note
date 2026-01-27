import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function PUT(request, { params }) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const todoId = params.id;
    const { completed } = await request.json();

    const { data, error } = await supabase
      .from('todos')
      .update({ completed })
      .eq('id', todoId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Todo update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, todo: data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
