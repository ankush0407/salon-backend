const express = require('express');
const router = express.Router();
const { getSheetData, appendSheetData, updateSheetRow, deleteSheetRow } = require('../utils/sheets');
const { authenticateToken } = require('../middleware/auth');

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const customers = await getSheetData('Customers');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add customer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    const newCustomer = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      createdAt: new Date().toISOString()
    };
    
    await appendSheetData('Customers', [Object.values(newCustomer)]);
    
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const customerId = req.params.id;
    console.log('Update customer request:', { customerId, name, email, phone });
    const customers = await getSheetData('Customers');
    const customerIndex = customers.findIndex(c => c.id === customerId);
    
    if (customerIndex === -1) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const updatedCustomer = {
      ...customers[customerIndex],
      name,
      email,
      phone
    };
    console.log('Updating customer at index:', customerIndex + 2);
    await updateSheetRow('Customers', customerIndex + 2, updatedCustomer);
    
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete customer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.id;
    
    const customers = await getSheetData('Customers');
    const customerIndex = customers.findIndex(c => c.id === customerId);
    
    if (customerIndex === -1) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    await deleteSheetRow('Customers', customerIndex + 2);
    
    // Also delete all subscriptions for this customer
    const subscriptions = await getSheetData('Subscriptions');
    const customerSubscriptions = subscriptions
      .map((sub, idx) => ({ sub, idx }))
      .filter(({ sub }) => sub.customerId === customerId)
      .reverse(); // Delete from bottom to top to maintain indices
    
    for (const { idx } of customerSubscriptions) {
      await deleteSheetRow('Subscriptions', idx + 2);
    }
    
    res.json({ message: 'Customer and associated subscriptions deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;