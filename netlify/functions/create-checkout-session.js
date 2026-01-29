import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey || secretKey.startsWith('pk_')) {
  console.error('STRIPE_SECRET_KEY must be set to your Stripe SECRET key (sk_...), not the publishable key (pk_...). Get it at https://dashboard.stripe.com/account/apikeys');
}
const stripe = new Stripe(secretKey || 'sk_missing');

// Pricing calculation
function calculatePrice(questionLot, frequency) {
  const frequencyMultiplier = { monthly: 1, biweekly: 2, weekly: 4 };
  const units = questionLot * frequencyMultiplier[frequency];

  let pricePerUnit;
  if (units <= 20) pricePerUnit = 50;
  else if (units <= 50) pricePerUnit = 45;
  else if (units <= 100) pricePerUnit = 40;
  else pricePerUnit = 37.50;

  return {
    units,
    pricePerUnit,
    totalPrice: units * pricePerUnit * 100 // cents for Stripe
  };
}

// Get frequency display name
function getFrequencyLabel(frequency) {
  const labels = {
    monthly: 'Monthly',
    biweekly: 'Bi-weekly',
    weekly: 'Weekly'
  };
  return labels[frequency] || frequency;
}

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  if (!secretKey || secretKey.startsWith('pk_')) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Stripe is misconfigured: use your SECRET key (sk_...) for STRIPE_SECRET_KEY, not the publishable key. Get it at https://dashboard.stripe.com/account/apikeys'
      })
    };
  }

  try {
    const { questionLot, frequency, userId, userEmail } = JSON.parse(event.body);

    // Validate inputs
    if (![10, 25, 50].includes(questionLot)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid question lot. Must be 10, 25, or 50.' })
      };
    }

    if (!['monthly', 'biweekly', 'weekly'].includes(frequency)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid frequency. Must be monthly, biweekly, or weekly.' })
      };
    }

    if (!userId || !userEmail) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing userId or userEmail.' })
      };
    }

    const { units, pricePerUnit, totalPrice } = calculatePrice(questionLot, frequency);

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      // Update metadata if needed
      if (customer.metadata.clerkUserId !== userId) {
        customer = await stripe.customers.update(customer.id, {
          metadata: { clerkUserId: userId }
        });
      }
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { clerkUserId: userId }
      });
    }

    // Optional: 100% off coupon for testing (set STRIPE_TEST_COUPON_ID in Netlify).
    // When set, discount is pre-applied and Stripe hides the "Add promotion code" link (one discount per session).
    const testCouponId = process.env.STRIPE_TEST_COUPON_ID?.trim() || null;

    // Create the checkout session with a dynamic price
    const sessionConfig = {
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      // Show "Add promotion code" only when no discount is pre-applied (no STRIPE_TEST_COUPON_ID)
      allow_promotion_codes: !testCouponId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AI Visibility Tracker - ${questionLot} Questions ${getFrequencyLabel(frequency)}`,
              description: `${units} tracking units at $${pricePerUnit}/unit. Track ${questionLot} questions ${frequency === 'monthly' ? 'once a month' : frequency === 'biweekly' ? 'twice a month' : 'every week'}.`
            },
            unit_amount: totalPrice,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      subscription_data: {
        metadata: {
          clerkUserId: userId,
          questionLot: questionLot.toString(),
          frequency,
          units: units.toString()
        }
      },
      success_url: `${process.env.URL || 'https://ai.futureproof.work'}/dashboard?checkout=success`,
      cancel_url: `${process.env.URL || 'https://ai.futureproof.work'}/pricing?checkout=cancelled`,
      metadata: {
        clerkUserId: userId,
        questionLot: questionLot.toString(),
        frequency,
        units: units.toString()
      }
    };

    if (testCouponId) {
      // Stripe accepts either coupon ID or promotion code ID (promo_xxx)
      sessionConfig.discounts = testCouponId.startsWith('promo_')
        ? [{ promotion_code: testCouponId }]
        : [{ coupon: testCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: session.url,
        sessionId: session.id
      })
    };

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
