import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import {
    getSettings,
    updateSettings,
    getPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod,
    getBillingHistory
} from '../controllers/settings-new.controller';

const router = Router();

// Protected routes
router.use(authenticate);

// Settings routes
router.get('/', getSettings);
router.put('/', updateSettings);

// Payment methods routes
router.get('/payment-methods', getPaymentMethods);
router.post('/payment-methods', addPaymentMethod);
router.delete('/payment-methods/:id', deletePaymentMethod);

// Billing history routes
router.get('/billing-history', getBillingHistory);

export default router;
