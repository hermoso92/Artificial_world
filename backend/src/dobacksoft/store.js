/**
 * DobackSoft — store for early-adopter citizens (first 1000 at €9.99/mo).
 * In-memory for MVP; can be replaced with SQLite for persistence.
 */

const MAX_CITIZENS = 1000;
const PRICE_EARLY = 9.99;
const PRICE_REGULAR = 29;
const COUPON_CODE = process.env.DOBACKSOFT_COUPON_CODE || 'FUNDADOR1000';

/** Genera código de acceso único para el juego (formato DOBACK-XXXX). */
function generateAccessCode() {
  const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DOBACK-${segment()}-${segment()}`;
}

let citizensCount = 0;

export function getStats() {
  return {
    citizensCount,
    maxCitizens: MAX_CITIZENS,
    slotsRemaining: Math.max(0, MAX_CITIZENS - citizensCount),
    priceEarly: PRICE_EARLY,
    priceRegular: PRICE_REGULAR,
  };
}

const DEMO_COUPON = 'DEMO';

export function validateCoupon(code) {
  const trimmed = (code || '').trim().toUpperCase();
  const stats = getStats();
  const isDemo = trimmed === DEMO_COUPON;
  const isFundador = trimmed === COUPON_CODE;

  if ((isDemo || (isFundador && stats.slotsRemaining > 0))) {
    return {
      valid: true,
      price: PRICE_EARLY,
      isEarlyAdopter: true,
      slotsRemaining: stats.slotsRemaining,
      message: `Cupón válido. Tu precio: €${PRICE_EARLY}/mes (en lugar de €${PRICE_REGULAR}).`,
      accessCode: generateAccessCode(),
    };
  }

  if (isFundador && stats.slotsRemaining <= 0) {
    return {
      valid: false,
      price: PRICE_REGULAR,
      isEarlyAdopter: false,
      slotsRemaining: 0,
      message: 'Las 1000 plazas de fundadores están agotadas. Precio estándar: €29/mes.',
    };
  }

  return {
    valid: false,
    price: PRICE_REGULAR,
    isEarlyAdopter: false,
    slotsRemaining: stats.slotsRemaining,
    message: 'Cupón no válido. Precio estándar: €29/mes.',
  };
}

export function resetCitizens() {
  citizensCount = 0;
}

export function registerCitizen() {
  const stats = getStats();
  if (stats.slotsRemaining <= 0) {
    return { success: false, message: 'No quedan plazas de fundador.' };
  }
  citizensCount += 1;
  return {
    success: true,
    citizensCount,
    slotsRemaining: MAX_CITIZENS - citizensCount,
    message: `¡Bienvenido, ciudadano #${citizensCount}!`,
  };
}
