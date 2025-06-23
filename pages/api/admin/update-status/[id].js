import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  user: process.env.FORM_DB_USER || 'postgres',
  host: process.env.FORM_DB_HOST || '172.29.10.98',
  database: process.env.FORM_DB_NAME || 'document_form',
  password: process.env.FORM_DB_PASS || 'BPK9@support',
  port: parseInt(process.env.FORM_DB_PORT) || 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export default async function handler(req, res) {
  console.log('🔍 Update Status API called');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Body:', req.body);

  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use PATCH or PUT.' 
    });
  }

  const { id } = req.query;
  const { is_active } = req.body; // สำหรับ admin status

  // ถ้าเป็นการอัปเดตสถานะ admin (ไม่ต้องมี auth token)
  if (is_active !== undefined) {
    try {
      console.log('🔄 Updating admin status...');
      
      const result = await pool.query(
        'UPDATE admins SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE admin_id = $2 RETURNING *',
        [is_active, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบ Admin ที่ต้องการอัปเดต'
        });
      }

      console.log('✅ Admin status updated:', result.rows[0]);

      return res.status(200).json({
        success: true,
        message: `${is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} Admin เรียบร้อย`,
        admin: result.rows[0]
      });

    } catch (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ',
        error: error.message
      });
    }
  }

  // สำหรับการอัปเดตสถานะ request (ต้องมี auth token)
  const authHeader = req.headers.authorization;
  console.log('Auth header:', authHeader ? 'Present' : 'Missing');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'ไม่พบ token หรือ token ไม่ถูกต้อง'
    });
  }

  const token = authHeader.substring(7);
  
  try {
    // ตรวจสอบ JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT decoded:', { username: decoded.username, role: decoded.role });
    
    // ตรวจสอบ role - เฉพาะ admin และ approver เท่านั้น
    if (decoded.role !== 'admin' && decoded.role !== 'approver') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์ในการอัปเดตสถานะ เฉพาะ Admin และ Approver เท่านั้น'
      });
    }

    const { status, type, reason } = req.body;

    console.log('📝 Request data:', { id, status, type, reason });

    if (!id || !status || !type) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ ID, สถานะ และประเภทคำขอ (type: external หรือ internal)'
      });
    }

    // ตรวจสอบว่า status ถูกต้องหรือไม่
    const validStatuses = ['pending', 'submitted', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'สถานะไม่ถูกต้อง ต้องเป็น: pending, submitted, approved, rejected'
      });
    }

    // ตรวจสอบว่า type ถูกต้องหรือไม่
    const validTypes = ['external', 'internal'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'ประเภทไม่ถูกต้อง ต้องเป็น: external หรือ internal'
      });
    }

    // เลือกตารางที่ถูกต้อง
    const tableName = type === 'external' ? 'requests_external' : 'requests';
    
    console.log('🔄 Updating database...');
    console.log('Table:', tableName);
    
    // ตรวจสอบว่าคำขอมีอยู่จริงหรือไม่
    const checkResult = await pool.query(
      `SELECT request_id, status FROM ${tableName} WHERE request_id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบคำขอในตาราง ${tableName}`
      });
    }

    console.log('✅ Request found:', checkResult.rows[0]);

    let updateQuery;
    let queryParams;

    // สร้าง query ตามสถานะ
    if (status === 'approved') {
      updateQuery = `
        UPDATE ${tableName} 
        SET 
          status = $1, 
          approver = $2,
          approve_date = CURRENT_TIMESTAMP,
          reject_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE request_id = $3 
        RETURNING *
      `;
      queryParams = [status, decoded.username, id];
    } else if (status === 'rejected') {
      updateQuery = `
        UPDATE ${tableName} 
        SET 
          status = $1, 
          approver = $2,
          approve_date = CURRENT_TIMESTAMP,
          reject_reason = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE request_id = $4 
        RETURNING *
      `;
      queryParams = [status, decoded.username, reason || null, id];
    } else {
      // สำหรับ pending, submitted
      updateQuery = `
        UPDATE ${tableName} 
        SET 
          status = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE request_id = $2 
        RETURNING *
      `;
      queryParams = [status, id];
    }

    // อัปเดตข้อมูล
    const result = await pool.query(updateQuery, queryParams);

    console.log('✅ Update successful:', result.rows[0]);

    // ส่งผลลัพธ์
    res.status(200).json({
      success: true,
      message: `อัปเดตสถานะเป็น ${status} เรียบร้อย`,
      request: result.rows[0],
      updatedBy: {
        name: decoded.username,
        role: decoded.role,
        updateDate: new Date().toISOString()
      },
      changes: {
        previousStatus: checkResult.rows[0].status,
        newStatus: status,
        reason: reason || null
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      console.error('❌ JWT verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้องหรือหมดอายุ'
      });
    }

    console.error('❌ Database error:', error);
    
    // ตรวจสอบว่าเป็น error จากคอลัมน์ที่ไม่มีหรือไม่
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      return res.status(500).json({
        success: false,
        message: 'โครงสร้างตารางไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ',
        error: error.message
      });
    }

    // ตรวจสอบว่าเป็น error จากตารางที่ไม่มีหรือไม่
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      return res.status(500).json({
        success: false,
        message: `ตาราง ${type === 'external' ? 'requests_external' : 'requests'} ไม่มีในฐานข้อมูล`,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ',
      error: error.message
    });
  }
}