import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getPlanNameByVariantId } from '@/lib/plan-tiers';

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature');
  const eventName = request.headers.get('x-event-name');

  // Verify webhook signature (mandatory)
  const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('LEMON_SQUEEZY_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  if (!signature) {
    console.error('Missing webhook signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const crypto = await import('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('Invalid webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);
    console.log('Lemon Squeezy webhook received:', eventName);

    // Handle subscription events
    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      const subscriptionData = body.data;
      const customData = body.meta?.custom_data;

      if (!customData?.user_id) {
        console.error('No user_id in webhook custom data');
        return NextResponse.json({ error: 'No user_id in custom data' }, { status: 400 });
      }

      const supabase = createAdminClient();

      // Get plan name from variant ID
      const variantId = subscriptionData.attributes?.variant_id?.toString();
      const planName = await getPlanNameByVariantId(supabase, variantId);

      // Update user subscription status
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          subscription_status: (subscriptionData.attributes?.status === 'active' || subscriptionData.attributes?.status === 'on_trial') ? 'active' : subscriptionData.attributes?.status,
          subscription_id: subscriptionData.id,
          lemon_squeezy_customer_id: subscriptionData.attributes?.customer_id?.toString(),
          subscription_created_at: subscriptionData.attributes?.created_at,
          subscription_renews_at: subscriptionData.attributes?.renews_at,
          subscription_ends_at: subscriptionData.attributes?.ends_at,
          subscription_variant_id: variantId,
          plan_name: planName,
        })
        .eq('user_id', customData.user_id);

      if (updateError) {
        console.error('Failed to update subscription status:', updateError);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log('Subscription activated for user:', customData.user_id);
    }

    // Handle subscription cancellation/expiration
    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      const subscriptionData = body.data;
      const customData = body.meta?.custom_data;

      if (customData?.user_id) {
        const supabase = createAdminClient();

        await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'cancelled',
            subscription_ends_at: subscriptionData.attributes?.ends_at,
            plan_name: 'free', // Revert to free tier on cancellation
          })
          .eq('user_id', customData.user_id);

        console.log('Subscription cancelled for user:', customData.user_id);
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent retries
    return NextResponse.json({ received: true, error: error.message });
  }
}
