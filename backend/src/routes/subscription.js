/**
 * Subscription API — Constructor de Mundos.
 * Supports both local (coupon) and Stripe (checkout) flows.
 */
import { Router } from 'express';
import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  getTiers,
  getSubscription,
  getLimits,
  validateCoupon,
  subscribe,
  cancelSubscription,
} from '../subscription/store.js';
import {
  isStripeEnabled,
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  handleWebhookEvent,
} from '../services/stripeService.js';

const router = Router();

router.get('/tiers', asyncHandler((req, res) => {
  res.json({ success: true, data: getTiers() });
}));

router.get('/me', asyncHandler((req, res) => {
  const playerId = req.playerId;
  if (!playerId) throw new ApiError('VALIDATION_ERROR', 'playerId required', 422);
  const sub = getSubscription(playerId);
  const limits = getLimits(playerId);
  res.json({ success: true, data: { ...sub, limits, stripeEnabled: isStripeEnabled() } });
}));

router.post('/coupon/validate', requireBody, asyncHandler((req, res) => {
  const { code } = req.body ?? {};
  if (typeof code !== 'string') throw new ApiError('VALIDATION_ERROR', 'code must be a string', 422);
  res.json({ success: true, data: validateCoupon(code) });
}));

router.post('/subscribe', requireBody, asyncHandler((req, res) => {
  const playerId = req.playerId;
  const { tier, coupon } = req.body ?? {};
  if (!playerId || !tier) throw new ApiError('VALIDATION_ERROR', 'playerId and tier required', 422);
  const result = subscribe(playerId, tier, coupon);
  if (!result.success) throw new ApiError('VALIDATION_ERROR', result.message, 422);
  res.status(201).json({ success: true, data: result });
}));

router.post('/cancel', requireBody, asyncHandler((req, res) => {
  const playerId = req.playerId;
  if (!playerId) throw new ApiError('VALIDATION_ERROR', 'playerId required', 422);
  const result = cancelSubscription(playerId);
  if (!result.success) throw new ApiError('VALIDATION_ERROR', result.message, 422);
  res.json({ success: true, data: result });
}));

// --- Stripe Checkout ---

router.post('/checkout', requireBody, asyncHandler(async (req, res) => {
  const playerId = req.playerId;
  const { tier } = req.body ?? {};
  if (!playerId) throw new ApiError('VALIDATION_ERROR', 'playerId required', 422);
  if (!tier || tier === 'free') throw new ApiError('VALIDATION_ERROR', 'tier must be constructor or fundador', 422);
  if (!isStripeEnabled()) throw new ApiError('SERVICE_UNAVAILABLE', 'Stripe no configurado. Usa cupón.', 503);

  const origin = req.headers.origin ?? `${req.protocol}://${req.get('host')}`;
  const successUrl = `${origin}/#hub?checkout=success&tier=${tier}`;
  const cancelUrl = `${origin}/#hub?checkout=cancelled`;

  const session = await createCheckoutSession(playerId, tier, successUrl, cancelUrl);
  res.json({ success: true, data: session });
}));

// --- Stripe Customer Portal ---

router.post('/portal', requireBody, asyncHandler(async (req, res) => {
  const playerId = req.playerId;
  if (!playerId) throw new ApiError('VALIDATION_ERROR', 'playerId required', 422);
  if (!isStripeEnabled()) throw new ApiError('SERVICE_UNAVAILABLE', 'Stripe no configurado', 503);

  const origin = req.headers.origin ?? `${req.protocol}://${req.get('host')}`;
  const returnUrl = `${origin}/#hub`;

  const session = await createPortalSession(playerId, returnUrl);
  res.json({ success: true, data: session });
}));

// --- Stripe Webhook (raw body required) ---

router.post('/webhook',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) throw new ApiError('VALIDATION_ERROR', 'Missing stripe-signature header', 400);

    let event;
    try {
      event = constructWebhookEvent(req.body, sig);
    } catch (err) {
      throw new ApiError('VALIDATION_ERROR', `Webhook signature verification failed: ${err.message}`, 400);
    }

    await handleWebhookEvent(event);
    res.json({ received: true });
  })
);

// --- Stripe status ---

router.get('/stripe-status', (req, res) => {
  res.json({ success: true, data: { enabled: isStripeEnabled() } });
});

export default router;
