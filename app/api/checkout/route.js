import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

// Map plan types to Lemon Squeezy variant IDs
// Pro uses the existing variant ID for backwards compatibility
const PLAN_VARIANTS = {
  pro: process.env.LEMON_SQUEEZY_VARIANT_ID || process.env.LEMON_SQUEEZY_PRO_VARIANT_ID,
  plus: process.env.LEMON_SQUEEZY_PLUS_VARIANT_ID,
};

export async function POST(request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Use verified session data instead of client-sent values
    const userId = user.id;
    const email = user.email;

    // Get plan type from request body (default to 'pro' for backwards compatibility)
    const body = await request.json().catch(() => ({}));
    const planType = body.planType || 'pro';

    // Validate plan type
    if (!['pro', 'plus'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type. Must be "pro" or "plus".' }, { status: 400 });
    }

    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const variantId = PLAN_VARIANTS[planType];
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

    if (!storeId || !variantId || !apiKey) {
      const missing = [
        !storeId && 'LEMON_SQUEEZY_STORE_ID',
        !variantId && `LEMON_SQUEEZY_${planType.toUpperCase()}_VARIANT_ID`,
        !apiKey && 'LEMON_SQUEEZY_API_KEY',
      ].filter(Boolean)
      console.error('Missing Lemon Squeezy configuration:', missing.join(', '));
      return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
    }

    // Create checkout using Lemon Squeezy API
    const checkoutResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: email,
              custom: {
                user_id: userId
              }
            },
            checkout_options: {
              embed: false,
              media: false,
              button_color: '#90353D'
            },
            product_options: {
              redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?success=true`,
            }
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId
              }
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId
              }
            }
          }
        }
      })
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text();
      console.error('Lemon Squeezy checkout error:', errorData);
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    }

    const checkoutData = await checkoutResponse.json();
    const checkoutUrl = checkoutData.data?.attributes?.url;

    if (!checkoutUrl) {
      console.error('No checkout URL in response:', checkoutData);
      return NextResponse.json({ error: 'Invalid checkout response' }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error('Checkout creation error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
