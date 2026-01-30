import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

// Update Clerk user metadata
async function updateClerkUserMetadata(userId, subscriptionData) {
  const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${clerkSecretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      public_metadata: {
        subscription: subscriptionData
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Clerk API error:', response.status, errorText);
    throw new Error(`Failed to update Clerk user: ${response.status}`);
  }

  return response.json();
}

// Clear Clerk user subscription metadata
async function clearClerkUserSubscription(userId) {
  const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${clerkSecretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      public_metadata: {
        subscription: null
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Clerk API error:', response.status, errorText);
    throw new Error(`Failed to clear Clerk user subscription: ${response.status}`);
  }

  return response.json();
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  console.log('Received Stripe event:', stripeEvent.type);

  const needsClerk = ['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(stripeEvent.type);
  if (needsClerk && !clerkSecretKey) {
    console.error('CLERK_SECRET_KEY is not set; cannot update user metadata');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        console.log('Checkout session completed:', session.id);

        // Get subscription details
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const clerkUserId = session.metadata?.clerkUserId || subscription.metadata?.clerkUserId;

          if (clerkUserId) {
            const subscriptionData = {
              questionLot: parseInt(session.metadata?.questionLot || subscription.metadata?.questionLot),
              frequency: session.metadata?.frequency || subscription.metadata?.frequency,
              units: parseInt(session.metadata?.units || subscription.metadata?.units),
              status: 'active',
              stripeCustomerId: session.customer,
              stripeSubscriptionId: subscription.id,
              currentPeriodEnd: subscription.current_period_end
            };
            console.log('[stripe-webhook] checkout.session.completed – updating Clerk metadata', { clerkUserId, subscriptionData });
            await updateClerkUserMetadata(clerkUserId, subscriptionData);
            console.log('[stripe-webhook] Clerk user metadata updated successfully for', clerkUserId);
          } else {
            console.error('[stripe-webhook] No clerkUserId found in session or subscription metadata');
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object;
        console.log('Subscription updated:', subscription.id);

        const clerkUserId = subscription.metadata?.clerkUserId;
        if (clerkUserId) {
          const subscriptionData = {
            questionLot: parseInt(subscription.metadata?.questionLot),
            frequency: subscription.metadata?.frequency,
            units: parseInt(subscription.metadata?.units),
            status: subscription.status,
            stripeCustomerId: subscription.customer,
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd: subscription.current_period_end
          };
          console.log('[stripe-webhook] customer.subscription.updated – updating Clerk', { clerkUserId, status: subscription.status, subscriptionData });
          if (['active', 'trialing'].includes(subscription.status)) {
            await updateClerkUserMetadata(clerkUserId, subscriptionData);
          } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
            await updateClerkUserMetadata(clerkUserId, subscriptionData);
          }
          console.log('[stripe-webhook] Clerk subscription metadata updated for', clerkUserId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object;
        console.log('Subscription deleted:', subscription.id);

        const clerkUserId = subscription.metadata?.clerkUserId;
        if (clerkUserId) {
          console.log('[stripe-webhook] customer.subscription.deleted – clearing Clerk subscription for', clerkUserId);
          await clearClerkUserSubscription(clerkUserId);
          console.log('[stripe-webhook] Clerk subscription cleared for', clerkUserId);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', stripeEvent.type);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
