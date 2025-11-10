const express = require('express');
const router = express.Router();
const { getSheetData, appendSheetData, updateSheetRow } = require('../utils/sheets');
const { authenticateToken } = require('../middleware/auth');

// Get subscriptions for a customer
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const subscriptions = await getSheetData('Subscriptions');
    const customerSubs = subscriptions.filter(s => s.customerId === req.params.customerId);
    res.json(customerSubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add subscription
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customerId, name, totalVisits } = req.body;
    
    const newSubscription = {
      id: Date.now().toString(),
      customerId,
      name,
      totalVisits: totalVisits.toString(),
      usedVisits: '0',
      visitDates: '',
      visitNotes: '',
      createdAt: new Date().toISOString()
    };
    
    await appendSheetData('Subscriptions', [Object.values(newSubscription)]);
    
    res.status(201).json(newSubscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Redeem visit with optional note
router.post('/:id/redeem', authenticateToken, async (req, res) => {
  try {
    const { note } = req.body; // Get note from request body
    const subscriptions = await getSheetData('Subscriptions');
    const subIndex = subscriptions.findIndex(s => s.id === req.params.id);
    
    if (subIndex === -1) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    const subscription = subscriptions[subIndex];
    const usedVisits = parseInt(subscription.usedVisits) + 1;
    const totalVisits = parseInt(subscription.totalVisits);
    
    if (usedVisits > totalVisits) {
      return res.status(400).json({ message: 'No visits remaining' });
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    const visitDates = subscription.visitDates 
      ? `${subscription.visitDates},${currentDate}`
      : currentDate;
    
    // Add note with date prefix for easy parsing
    const noteWithDate = note ? `${currentDate}:${note}` : '';
    const visitNotes = subscription.visitNotes 
      ? `${subscription.visitNotes}||${noteWithDate}`
      : noteWithDate;
    
    await updateSheetRow('Subscriptions', subIndex + 2, {
      ...subscription,
      usedVisits: usedVisits.toString(),
      visitDates,
      visitNotes
    });
    
    res.json({ message: 'Visit redeemed successfully' });
  } catch (error) {
    console.error('Error redeeming visit:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;