# Configurar Webhook de Stripe

Sin el webhook, los pagos se procesan en Stripe pero **la suscripción no se activa automáticamente** en la app. El usuario pagaría pero seguiría con plan gratuito.

## Pasos

### 1. Crear el endpoint en Stripe

1. Entra en [Stripe Dashboard](https://dashboard.stripe.com) → **Desarrolladores** → **Webhooks**
2. Clic en **Añadir endpoint**
3. **URL del endpoint:** `https://TU-DOMINIO/api/subscription/webhook`  
   - Si usas IP: `http://187.77.94.167:3001/api/subscription/webhook`
   - En local (Stripe CLI): `http://localhost:3001/api/subscription/webhook`
4. **Eventos a escuchar:**
   - `checkout.session.completed` — activa la suscripción tras el pago
   - `customer.subscription.deleted` — cancela la suscripción
   - `customer.subscription.updated` — cambios de plan
5. Clic en **Añadir endpoint**

### 2. Obtener el secreto de firma

1. En el webhook recién creado, abre **Revelar** en "Clave de firma"
2. Copia el valor que empieza por `whsec_...`

### 3. Añadirlo al .env

En tu `.env` (local y VPS):

```
STRIPE_WEBHOOK_SECRET=whsec_TU_SECRET_AQUI
```

### 4. Reiniciar el contenedor (VPS)

```bash
cd /opt/constructor-de-mundos && docker compose -f docker-compose.prod.yml restart
```

---

## Probar en local con Stripe CLI

```bash
stripe listen --forward-to localhost:3001/api/subscription/webhook
```

Stripe CLI mostrará un `whsec_...` temporal para usar en ese terminal.

---

## Verificar que funciona

1. Haz un pago de prueba (tarjeta `4242 4242 4242 4242`)
2. Revisa los logs: `docker logs constructor-de-mundos 2>&1 | tail -30`
3. Deberías ver `[stripe] Subscription activated via checkout`
