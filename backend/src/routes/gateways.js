import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getGatewayContractSummary, listGatewayConnectors } from '../services/missionControl/connectors.js';

const router = Router();

router.get('/', asyncHandler((req, res) => {
  res.json({ success: true, data: listGatewayConnectors() });
}));

router.get('/contract', asyncHandler((req, res) => {
  res.json({ success: true, data: getGatewayContractSummary() });
}));

export default router;
