/**
 * Stripe integration — Constructor de Mundos.
 *
 * Handles:
 *   - Product/price auto-creation (idempotent)
 *   - Checkout session creation
 *   - Customer portal session
 *   - Webhook event processing
 */
import Stripe from 'stripe';
import logger from '../utils/logger.js';
import { subscribe, cancelSubscription } from '../subscription/store.js';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET || STRIPE_SECRET.includes('REEMPLAZA')) {
  logger.warn('[stripe] STRIPE_SECRET_KEY not configured — Stripe disabled');
}

const stripe = STRIPE_SECRET && !STRIPE_SECRET.includes('REEMPLAZA')
  ? new Stripe(STRIPE_SECRET, { apiVersion: '2024-12-18.acacia' })
  : null;

const PLANS = {
  constructor: {
    name: 'Constructor',
    description: 'Mundos ilimitados, habitantes ilimitados, compañero IA avanzado.',
    priceAmount: 499,
    currency: 'eur',
    interval: 'month',
  },
  fundador: {
    name: 'Fundador',
    description: 'Todo lo de Constructor + badge permanente, acceso anticipado, nombre en créditos.',
    priceAmount: 299,
    currency: 'eur',
    interval: 'month',
  },
};

let _priceCache = {};

async function ensureProducts() {
  if (!stripe) return;
  if (Object.keys(_priceCache).length === Object.keys(PLANS).length) return;

  for (const [tierId, plan] of Object.entries(PLANS)) {
    const products = await stripe.products.search({
      query: `metadata["tier"]:"${tierId}"`,
    });

    let product;
    if (products.data.length > 0) {
      product = products.data[0];
    } else {
      product = await stripe.products.create({
        name: `Constructor de Mundos — ${plan.name}`,
        description: plan.description,
        metadata: { tier: tierId },
      });
      logger.info(`[stripe] Product created: ${product.id} (${tierId})`);
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 1,
    });

    let price;
    if (prices.data.length > 0) {
      price = prices.data[0];
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.priceAmount,
        currency: plan.currency,
        recurring: { interval: plan.interval },
        metadata: { tier: tierId },
      });
      logger.info(`[stripe] Price created: ${price.id} (${plan.priceAmount / 100}€/${plan.interval})`);
    }

    _priceCache[tierId] = price.id;
  }

  logger.info('[stripe] Products ready', _priceCache);
}

export function isStripeEnabled() {
  return stripe !== null;
}

export async function createCheckoutSession(playerId, tierId, successUrl, cancelUrl) {
  if (!stripe) throw new Error('Stripe no configurado');
  await ensureProducts();

  const priceId = _priceCache[tierId];
  if (!priceId) throw new Error(`Plan "${tierId}" no encontrado`);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: playerId,
    metadata: { playerId, tier: tierId },
  });

  logger.info('[stripe] Checkout session created', { sessionId: session.id, playerId, tierId });
  return { sessionId: session.id, url: session.url };
}

export async function createPortalSession(playerId, returnUrl) {
  if (!stripe) throw new Error('Stripe no configurado');

  const customers = await stripe.customers.search({
    query: `metadata["playerId"]:"${playerId}"`,
  });

  if (customers.data.length === 0) {
    throw new Error('No se encontró tu cuenta de pago. Suscríbete primero.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customers.data[0].id,
    return_url: returnUrl,
  });

  return { url: session.url };
}

export function constructWebhookEvent(rawBody, signature) {
  if (!stripe) throw new Error('Stripe no configurado');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.includes('REEMPLAZA')) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

export async function handleWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const playerId = session.client_reference_id ?? session.metadata?.playerId;
      const tierId = session.metadata?.tier;
      if (playerId && tierId) {
        subscribe(playerId, tierId);
        logger.info('[stripe] Subscription activated via checkout', { playerId, tierId });

        if (stripe && session.customer) {
          await stripe.customers.update(session.customer, {
            metadata: { playerId },
          });
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const customer = await stripe.customers.retrieve(sub.customer);
      const playerId = customer?.metadata?.playerId;
      if (playerId) {
        cancelSubscription(playerId);
        logger.info('[stripe] Subscription cancelled via webhook', { playerId });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      if (sub.cancel_at_period_end) {
        const customer = await stripe.customers.retrieve(sub.customer);
        const playerId = customer?.metadata?.playerId;
        if (playerId) {
          logger.info('[stripe] Subscription set to cancel at period end', { playerId });
        }
      }
      break;
    }

    default:
      logger.info(`[stripe] Unhandled event type: ${event.type}`);
  }
}

export async function initStripe() {
  if (!stripe) {
    logger.info('[stripe] Stripe disabled (no key configured)');
    return;
  }
  try {
    await ensureProducts();
  } catch (err) {
    logger.warn('[stripe] Failed to initialize products', err.message);
  }
}
