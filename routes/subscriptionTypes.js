const express = require('express');
const router = express.Router();
const { getSheetData, appendSheetData, deleteSheetRow } = require('../utils/sheets');
const { authenticateToken, requireOwner } = require('../middleware/auth');

// Get all subscription types
router.get('/', authenticateToken, async (req, res) => {
  try {
    const types = await getSheetData('SubscriptionTypes');
    res.json(types);
  } catch (error) {
    console.error('Error getting subscription types:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add new subscription type (Owner only)
router.post('/', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { name, visits } = req.body;
    
    if (!name || !visits) {
      return res.status(400).json({ message: 'Name and visits are required' });
    }
    
    const newType = {
      id: Date.now().toString(),
      name,
      visits: visits.toString(),
      createdAt: new Date().toISOString()
    };
    
    await appendSheetData('SubscriptionTypes', [Object.values(newType)]);
    
    res.status(201).json(newType);
  } catch (error) {
    console.error('Error adding subscription type:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete subscription type (Owner only)
router.delete('/:id', authenticateToken, requireOwner, async (req, res) => {
  try {
    const typeId = req.params.id;
    
    const types = await getSheetData('SubscriptionTypes');
    const typeIndex = types.findIndex(t => t.id === typeId);
    
    if (typeIndex === -1) {
      return res.status(404).json({ message: 'Subscription type not found' });
    }
    
    // Row number in sheet (add 2: 1 for header, 1 for 0-based index)
    await deleteSheetRow('SubscriptionTypes', typeIndex + 2);
    
    res.json({ message: 'Subscription type deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription type:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;