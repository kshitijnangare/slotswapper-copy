const { pool } = require('../config/database');

exports.getMyEvents = async (req, res) => {
  try {
    const [events] = await pool.query(
      'SELECT * FROM events WHERE user_id = ? ORDER BY start_time ASC',
      [req.userId]
    );

    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, startTime, endTime, status = 'BUSY' } = req.body;

    // Validation
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Title, start time, and end time are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    if (!['BUSY', 'SWAPPABLE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [result] = await pool.query(
      'INSERT INTO events (user_id, title, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
      [req.userId, title, start, end, status]
    );

    const [newEvent] = await pool.query(
      'SELECT * FROM events WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Event created successfully',
      event: newEvent[0]
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, startTime, endTime, status } = req.body;

    // Check if event exists and belongs to user
    const [events] = await pool.query(
      'SELECT * FROM events WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = events[0];

    // Prevent updating SWAP_PENDING events
    if (event.status === 'SWAP_PENDING') {
      return res.status(400).json({ error: 'Cannot update event with pending swap' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (startTime !== undefined) {
      updates.push('start_time = ?');
      values.push(new Date(startTime));
    }

    if (endTime !== undefined) {
      updates.push('end_time = ?');
      values.push(new Date(endTime));
    }

    if (status !== undefined) {
      if (!['BUSY', 'SWAPPABLE'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id, req.userId);

    await pool.query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    const [updatedEvent] = await pool.query(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent[0]
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists and belongs to user
    const [events] = await pool.query(
      'SELECT status FROM events WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Prevent deleting SWAP_PENDING events
    if (events[0].status === 'SWAP_PENDING') {
      return res.status(400).json({ error: 'Cannot delete event with pending swap' });
    }

    await pool.query('DELETE FROM events WHERE id = ? AND user_id = ?', [id, req.userId]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};