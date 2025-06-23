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
  console.log('🔍 Reject External Request API called');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // ตรวจสอบ Authorization token
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
    
    // ตรวจสอบ role
    if (decoded.role !== 'admin' && decoded.role !== 'approver') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์ในการปฏิเสธ เฉพาะ Admin และ Approver เท่านั้น'
      });
    }

    const { requestId, status, rejectReason } = req.body;
    console.log('📝 Request data:', { requestId, status, rejectReason });

    if (!requestId || !status) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ ID และสถานะที่ต้องการอัปเดต'
      });
    }

    console.log('🔄 Updating database...');
    
    // ตรวจสอบว่าคำขอมีอยู่จริงหรือไม่
    const checkResult = await pool.query(
      'SELECT request_id, status FROM requests_external WHERE request_id = $1',
      [requestId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำขอที่ต้องการอัปเดต'
      });
    }

    console.log('✅ Request found:', checkResult.rows[0]);

    // อัปเดตข้อมูลพร้อมบันทึกผู้ปฏิเสธและเหตุผล
    const result = await pool.query(`
      UPDATE requests_external 
      SET 
        status = $1, 
        approver = $2,
        approve_date = CURRENT_TIMESTAMP,
        reject_reason = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE request_id = $4 
      RETURNING *
    `, [status, decoded.username, rejectReason || null, requestId]);

    console.log('✅ Update successful:', result.rows[0]);

    res.status(200).json({
      success: true,
      message: 'ปฏิเสธคำขอเรียบร้อย',
      request: result.rows[0],
      rejectedBy: {
        name: decoded.username,
        role: decoded.role,
        rejectDate: new Date().toISOString(),
        reason: rejectReason
      }
    });

  } catch (jwtError) {
    console.error('❌ JWT verification error:', jwtError);
    return res.status(401).json({
      success: false,
      message: 'Token ไม่ถูกต้องหรือหมดอายุ'
    });
  } 
}