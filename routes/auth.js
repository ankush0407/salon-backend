const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSheetData, appendSheetData } = require('../utils/sheets');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    console.log('Login attempt:', { email, role });
    
    // Get users from Google Sheets
    const users = await getSheetData('Users');
    console.log('Users found:', users.length);
    console.log('Users data:', users);
    
    const user = users.find(u => u.email === email && u.role === role);
    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('User found:', user.email);
    console.log('Stored password hash:', user.password);
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name || email.split('@')[0],
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    console.log('Register attempt:', { email, role });
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };
    
    await appendSheetData('Users', [Object.values(newUser)]);
    
    console.log('User created successfully:', email);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;