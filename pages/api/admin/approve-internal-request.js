// pages/api/admin/approve-internal-request.js
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
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // ตรวจสอบ Authorization token
  const authHeader = req.headers.authorization;
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
    
    // ตรวจสอบ role
    if (decoded.role !== 'admin' && decoded.role !== 'approver') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์ในการอนุมัติ เฉพาะ Admin และ Approver เท่านั้น'
      });
    }

    const { requestId, status } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ ID และสถานะที่ต้องการอัปเดต'
      });
    }

    // อัปเดตข้อมูลพร้อมบันทึกผู้อนุมัติและวันที่
    const result = await pool.query(`
      UPDATE requests 
      SET 
        status = $1, 
        approver = $2,
        approve_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP 
      WHERE request_id = $3 
      RETURNING *
    `, [status, decoded.username, requestId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำขอที่ต้องการอัปเดต'
      });
    }

    res.status(200).json({
      success: true,
      message: 'อนุมัติคำขอเรียบร้อย',
      request: result.rows[0],
      approver: {
        name: decoded.username,
        role: decoded.role,
        approveDate: new Date().toISOString()
      }
    });

  } catch (jwtError) {
    console.error('JWT verification error:', jwtError);
    return res.status(401).json({
      success: false,
      message: 'Token ไม่ถูกต้องหรือหมดอายุ'
    });
  }
  //  catch (error) {
  //   console.error('Error updating internal request status:', error);
  //   res.status(500).json({
  //     success: false,
  //     message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ'
  //   });
  // }
}