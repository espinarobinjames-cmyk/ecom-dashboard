const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const axios = require('axios');

// Get all shops ng user
router.get('/', auth, async (req, res) => {
  try {
    const shops = await pool.query(
      'SELECT * FROM shops WHERE owner_id = $1',
      [req.user.id]
    );
    res.json(shops.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new shop
router.post('/', auth, async (req, res) => {
  try {
    const { name, api_key, shop_id } = req.body;

    // Test connection sa Pancake
    const test = await axios.get(
      `https://pos.pages.fm/api/v1/shops/${shop_id}/orders?api_key=${api_key}&page_size=1`
    );

    if (!test.data.success) {
      return res.status(400).json({ message: 'Invalid API Key or Shop ID' });
    }

    const newShop = await pool.query(
      'INSERT INTO shops (name, api_key, shop_id, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, api_key, shop_id, req.user.id]
    );

    res.json(newShop.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Connection failed. Check API Key and Shop ID.' });
  }
});

// Delete shop
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM shops WHERE id = $1 AND owner_id = $2', 
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Shop removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
