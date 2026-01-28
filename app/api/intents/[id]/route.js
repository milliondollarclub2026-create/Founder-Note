import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function PUT(request, { params }) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const intentId = params.id;
    const { status } = await request.json();

    if (!['active', 'completed', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData = {
      status,
      completed_at: (status === 'completed' || status === 'archived') ? new Date().toISOString() : null
    };

    const { data, error } = await supabase
      .from('intents')
      .update(updateData)
      .eq('id', intentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Intent update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, intent: data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
