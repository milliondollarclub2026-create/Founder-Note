import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function POST() {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get user's Lemon Squeezy customer ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('lemon_squeezy_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.lemon_squeezy_customer_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
    }

    // Get customer portal URL from Lemon Squeezy
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/customers/${profile.lemon_squeezy_customer_id}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/vnd.api+json',
        },
      }
    );

    if (!response.ok) {
      console.error('Lemon Squeezy customer fetch error:', await response.text());
      return NextResponse.json({ error: 'Failed to fetch subscription details' }, { status: 500 });
    }

    const data = await response.json();
    const portalUrl = data.data?.attributes?.urls?.customer_portal;

    if (!portalUrl) {
      return NextResponse.json({ error: 'Customer portal not available' }, { status: 404 });
    }

    return NextResponse.json({ portalUrl });
  } catch (error) {
    console.error('Subscription portal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
