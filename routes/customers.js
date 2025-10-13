const express = require('express');
const router = express.Router();
const { getSheetData, appendSheetData } = require('../utils/sheets');
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

module.exports = router;