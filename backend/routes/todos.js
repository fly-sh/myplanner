const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '조회 실패' });
  }
});

router.post('/', async (req, res) => {
  const { title, due_date } = req.body;
  if (!title) return res.status(400).json({ error: '제목을 입력해주세요' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO todos (title, due_date) VALUES ($1, $2) RETURNING *',
      [title, due_date || null]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: '추가 실패' });
  }
});

router.patch('/:id/toggle', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM todos WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: '할일을 찾을 수 없습니다' });
    const { rows: updated } = await pool.query(
      'UPDATE todos SET is_completed = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [rows[0].is_completed ? 0 : 1, req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: '업데이트 실패' });
  }
});

router.put('/:id', async (req, res) => {
  const { title, due_date } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE todos SET title = $1, due_date = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [title, due_date || null, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: '수정 실패' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM todos WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '삭제 실패' });
  }
});

module.exports = router;
