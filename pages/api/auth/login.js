import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
    });
  }

  try {
    // ค้นหาผู้ใช้ในฐานข้อมูล
    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    const admin = result.rows[0];

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // สร้าง JWT token
    const token = jwt.sign(
      {
        adminId: admin.admin_id,
        username: admin.username,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // อัปเดตเวลาเข้าสู่ระบบล่าสุด
    await pool.query(
      'UPDATE admins SET updated_at = CURRENT_TIMESTAMP WHERE admin_id = $1',
      [admin.admin_id]
    );

    res.status(200).json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      admin: {
        id: admin.admin_id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullname,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในระบบ'
    });
  }
}