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

  const { username, email, password, fullName } = req.body;

  // Validation
  if (!username || !email || !password || !fullName) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'รูปแบบอีเมลไม่ถูกต้อง'
    });
  }

  try {
    // ตรวจสอบว่า username หรือ email มีอยู่แล้วหรือไม่
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
      [username, email, hashedPassword, fullName, 'admin', true]
    );

    const newAdmin = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      admin: {
        id: newAdmin.admin_id,
        username: newAdmin.username,
        email: newAdmin.email,
        fullName: newAdmin.fullname, // เปลี่ยนจาก full_name เป็น fullname
        role: newAdmin.role
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    
    // ตรวจสอบ unique constraint error
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'ชื่อผู้ใช้หรือ อีเมลนี้มีอยู่แล้ว'
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในระบบ'
    });
  }
}