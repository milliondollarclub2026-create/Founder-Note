import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase';

export async function POST() {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    if (!apiKey) {
      console.error('Missing LEMON_SQUEEZY_API_KEY');
      return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
    }

    // Read subscription info from user_profiles using admin client
    const supabase = createAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_id, subscription_status')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Failed to read profile:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    if (profile.subscription_status === 'cancelled') {
      return NextResponse.json({ error: 'Subscription is already cancelled' }, { status: 400 });
    }

    // Cancel subscription via Lemon Squeezy API (PATCH with cancelled: true)
    const cancelResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${profile.subscription_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json',
        },
        body: JSON.stringify({
          data: {
            type: 'subscriptions',
            id: String(profile.subscription_id),
            attributes: {
              cancelled: true,
            },
          },
        }),
      }
    );

    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.text();
      console.error('Lemon Squeezy cancel error:', errorData);
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    // Update subscription_status immediately (webhook is a backup)
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ subscription_status: 'cancelled' })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update subscription status:', updateError);
      // Don't fail the request — Lemon Squeezy already cancelled, webhook will fix it
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription cancel error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
