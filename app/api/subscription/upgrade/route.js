import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

// Map plan names to variant IDs
const PLAN_VARIANTS = {
  pro: process.env.LEMON_SQUEEZY_PRO_VARIANT_ID,
  plus: process.env.LEMON_SQUEEZY_PLUS_VARIANT_ID,
};

export async function POST(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetPlan } = await request.json();

    // Validate target plan
    if (!['pro', 'plus'].includes(targetPlan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get user's current subscription
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_id, subscription_status, plan_name')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const currentPlan = profile.plan_name || 'free';

    // Validate upgrade path
    if (currentPlan === 'plus') {
      return NextResponse.json({ error: 'Already on the highest plan' }, { status: 400 });
    }

    if (currentPlan === targetPlan) {
      return NextResponse.json({ error: 'Already on this plan' }, { status: 400 });
    }

    // For free users, redirect to checkout
    if (currentPlan === 'free' || !profile.subscription_id) {
      return NextResponse.json({
        action: 'checkout',
        checkoutUrl: `/subscribe?plan=${targetPlan}`,
      });
    }

    // For existing subscribers, update the subscription via Lemon Squeezy API
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const targetVariantId = PLAN_VARIANTS[targetPlan];

    if (!apiKey || !targetVariantId) {
      console.error('Missing Lemon Squeezy configuration');
      return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
    }

    // Update subscription variant (this handles prorating automatically)
    const updateResponse = await fetch(
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
            id: profile.subscription_id,
            attributes: {
              variant_id: parseInt(targetVariantId),
              // invoice_immediately: true, // Charge the prorated amount now
            },
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      console.error('Lemon Squeezy subscription update error:', errorData);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    const updatedSubscription = await updateResponse.json();

    // Update local database immediately (webhook will also update, but this is faster UX)
    await supabase
      .from('user_profiles')
      .update({
        plan_name: targetPlan,
        subscription_variant_id: targetVariantId,
      })
      .eq('user_id', user.id);

    return NextResponse.json({
      action: 'upgraded',
      plan: targetPlan,
      subscription: updatedSubscription.data,
    });
  } catch (error) {
    console.error('Subscription upgrade error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
