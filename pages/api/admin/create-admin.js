import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  user: 'postgres',
  host: '172.29.10.98',
  database: 'document_form',
  password: 'BPK9@support',
  port: 5432,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { username, email, password, fullname, role } = req.body;

  // Validation
  if (!username || !email || !password || !fullname) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
    });
  }

  try {
    // ตรวจสอบว่ามี username หรือ email ซ้ำหรือไม่
    const existingUser = await pool.query(
      'SELECT username, email FROM admins WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      if (existing.username === username) {
        return res.status(409).json({
          success: false,
          message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว'
        });
      }
      if (existing.email === email) {
        return res.status(409).json({
          success: false,
          message: 'อีเมลนี้มีอยู่แล้ว'
        });
      }
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 12);

    // บันทึกข้อมูลผู้ใช้ใหม่
    const result = await pool.query(
      `INSERT INTO admins (username, email, password, fullname, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING admin_id, username, email, fullname, role`,
      [username, email, hashedPassword, fullname, role || 'admin', true]
    );

    res.status(201).json({
      success: true,
      message: 'สร้างบัญชี Admin เรียบร้อย',
      admin: result.rows[0]
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในระบบ'
    });
  }
}