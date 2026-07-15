const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db');
const axios = require('axios');

// Get orders from Pancake
router.get('/:shopDbId', auth, async (req, res) => {
  try {
    const shop = await pool.query(
      'SELECT * FROM shops WHERE id = $1 AND owner_id = $2',
      [req.params.shopDbId, req.user.id]
    );

    if (shop.rows.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const { api_key, shop_id } = shop.rows[0];
    const { page = 1, status } = req.query;

    let url = `https://pos.pages.fm/api/v1/shops/${shop_id}/orders?api_key=${api_key}&page_size=20&page_number=${page}`;

    if (status !== undefined && status !== '') {
      url += `&status=${status}`;
    }

    const response = await axios.get(url);

    res.json({
      orders: response.data.data,
      total_entries: response.data.total_entries,
      total_pages: response.data.total_pages,
      page_number: response.data.page_number,
      aggs: response.data.aggs
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
