const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/swappable-slots', swapController.getSwappableSlots);
router.post('/swap-request', swapController.createSwapRequest);
router.post('/swap-response/:requestId', swapController.respondToSwapRequest);
router.get('/my-requests', swapController.getMySwapRequests);

module.exports = router;