const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM notes ORDER BY updated_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '조회 실패' });
  }
});

router.post('/', async (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: '제목을 입력해주세요' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *',
      [title, content || '']
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: '추가 실패' });
  }
});

router.put('/:id', async (req, res) => {
  const { title, content } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE notes SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [title, content || '', req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: '수정 실패' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '삭제 실패' });
  }
});

module.exports = router;
