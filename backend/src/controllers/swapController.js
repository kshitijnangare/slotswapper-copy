const { pool } = require('../config/database');

exports.getSwappableSlots = async (req, res) => {
  try {
    const [slots] = await pool.query(`
      SELECT 
        e.*,
        u.name as owner_name,
        u.email as owner_email
      FROM events e
      JOIN users u ON e.user_id = u.id
      WHERE e.status = 'SWAPPABLE' AND e.user_id != ?
      ORDER BY e.start_time ASC
    `, [req.userId]);

    res.json({ slots });
  } catch (error) {
    console.error('Get swappable slots error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createSwapRequest = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { mySlotId, theirSlotId } = req.body;

    // Validation
    if (!mySlotId || !theirSlotId) {
      await connection.rollback();
      return res.status(400).json({ error: 'Both slot IDs are required' });
    }

    // Verify my slot exists and belongs to me
    const [mySlots] = await connection.query(
      'SELECT * FROM events WHERE id = ? AND user_id = ?',
      [mySlotId, req.userId]
    );

    if (mySlots.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Your slot not found' });
    }

    const mySlot = mySlots[0];

    if (mySlot.status !== 'SWAPPABLE') {
      await connection.rollback();
      return res.status(400).json({ error: 'Your slot is not swappable' });
    }

    // Verify their slot exists and is swappable
    const [theirSlots] = await connection.query(
      'SELECT * FROM events WHERE id = ?',
      [theirSlotId]
    );

    if (theirSlots.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Requested slot not found' });
    }

    const theirSlot = theirSlots[0];

    if (theirSlot.user_id === req.userId) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cannot swap with your own slot' });
    }

    if (theirSlot.status !== 'SWAPPABLE') {
      await connection.rollback();
      return res.status(400).json({ error: 'Requested slot is not available' });
    }

    // Create swap request
    const [result] = await connection.query(`
      INSERT INTO swap_requests 
      (requester_id, requester_slot_id, owner_id, owner_slot_id, status)
      VALUES (?, ?, ?, ?, 'PENDING')
    `, [req.userId, mySlotId, theirSlot.user_id, theirSlotId]);

    // Update both slots to SWAP_PENDING
    await connection.query(
      'UPDATE events SET status = "SWAP_PENDING" WHERE id IN (?, ?)',
      [mySlotId, theirSlotId]
    );

    await connection.commit();

    const [swapRequest] = await pool.query(`
      SELECT 
        sr.*,
        u1.name as requester_name,
        u2.name as owner_name,
        e1.title as requester_slot_title,
        e1.start_time as requester_slot_start,
        e1.end_time as requester_slot_end,
        e2.title as owner_slot_title,
        e2.start_time as owner_slot_start,
        e2.end_time as owner_slot_end
      FROM swap_requests sr
      JOIN users u1 ON sr.requester_id = u1.id
      JOIN users u2 ON sr.owner_id = u2.id
      JOIN events e1 ON sr.requester_slot_id = e1.id
      JOIN events e2 ON sr.owner_slot_id = e2.id
      WHERE sr.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Swap request created successfully',
      swapRequest: swapRequest[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create swap request error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.respondToSwapRequest = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { requestId } = req.params;
    const { accept } = req.body;

    if (typeof accept !== 'boolean') {
      await connection.rollback();
      return res.status(400).json({ error: 'Accept field must be a boolean' });
    }

    // Get swap request
    const [requests] = await connection.query(
      'SELECT * FROM swap_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Swap request not found' });
    }

    const swapRequest = requests[0];

    // Verify user is the owner of the requested slot
    if (swapRequest.owner_id !== req.userId) {
      await connection.rollback();
      return res.status(403).json({ error: 'Not authorized to respond to this request' });
    }

    // Check if already responded
    if (swapRequest.status !== 'PENDING') {
      await connection.rollback();
      return res.status(400).json({ error: 'Request already processed' });
    }

    if (accept) {
      // ACCEPT: Exchange ownership of slots
      await connection.query(
        'UPDATE events SET user_id = ?, status = "BUSY" WHERE id = ?',
        [swapRequest.requester_id, swapRequest.owner_slot_id]
      );

      await connection.query(
        'UPDATE events SET user_id = ?, status = "BUSY" WHERE id = ?',
        [swapRequest.owner_id, swapRequest.requester_slot_id]
      );

      await connection.query(
        'UPDATE swap_requests SET status = "ACCEPTED" WHERE id = ?',
        [requestId]
      );

      await connection.commit();

      res.json({
        message: 'Swap accepted successfully',
        swapRequest: { ...swapRequest, status: 'ACCEPTED' }
      });
    } else {
      // REJECT: Reset slots to SWAPPABLE
      await connection.query(
        'UPDATE events SET status = "SWAPPABLE" WHERE id IN (?, ?)',
        [swapRequest.requester_slot_id, swapRequest.owner_slot_id]
      );

      await connection.query(
        'UPDATE swap_requests SET status = "REJECTED" WHERE id = ?',
        [requestId]
      );

      await connection.commit();

      res.json({
        message: 'Swap rejected',
        swapRequest: { ...swapRequest, status: 'REJECTED' }
      });
    }
  } catch (error) {
    await connection.rollback();
    console.error('Respond to swap error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.getMySwapRequests = async (req, res) => {
  try {
    // Incoming requests (where I'm the owner)
    const [incoming] = await pool.query(`
      SELECT 
        sr.*,
        u.name as requester_name,
        u.email as requester_email,
        e1.title as their_slot_title,
        e1.start_time as their_slot_start,
        e1.end_time as their_slot_end,
        e2.title as my_slot_title,
        e2.start_time as my_slot_start,
        e2.end_time as my_slot_end
      FROM swap_requests sr
      JOIN users u ON sr.requester_id = u.id
      JOIN events e1 ON sr.requester_slot_id = e1.id
      JOIN events e2 ON sr.owner_slot_id = e2.id
      WHERE sr.owner_id = ?
      ORDER BY sr.created_at DESC
    `, [req.userId]);

    // Outgoing requests (where I'm the requester)
    const [outgoing] = await pool.query(`
      SELECT 
        sr.*,
        u.name as owner_name,
        u.email as owner_email,
        e1.title as my_slot_title,
        e1.start_time as my_slot_start,
        e1.end_time as my_slot_end,
        e2.title as their_slot_title,
        e2.start_time as their_slot_start,
        e2.end_time as their_slot_end
      FROM swap_requests sr
      JOIN users u ON sr.owner_id = u.id
      JOIN events e1 ON sr.requester_slot_id = e1.id
      JOIN events e2 ON sr.owner_slot_id = e2.id
      WHERE sr.requester_id = ?
      ORDER BY sr.created_at DESC
    `, [req.userId]);

    res.json({
      incoming,
      outgoing
    });
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};