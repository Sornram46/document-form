import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import bcrypt from 'bcryptjs'; // เพิ่มไลบรารี bcrypt สำหรับเปรียบเทียบรหัสผ่าน (ติดตั้งด้วย npm install bcryptjs)

const pool = new Pool({
  user: 'postgres',
  host: '172.29.10.98',
  database: 'document_form',
  password: 'BPK9@support',
  port: 5432,
});

// ฟังก์ชันสำหรับ query database
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  try {
    // ดึงข้อมูลผู้ใช้จากตาราง admins
    const result = await query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );

    // ตรวจสอบว่ามีผู้ใช้ในระบบหรือไม่
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    const admin = result.rows[0];

    // ตรวจสอบรหัสผ่าน
    // หากใช้ bcrypt ในการเข้ารหัส
    // const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    // หากเก็บรหัสผ่านเป็น plaintext (ไม่แนะนำในระบบจริง)
    const isPasswordValid = (password === admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // สร้าง token
    const token = jwt.sign(
      { 
        username: admin.username, 
        role: admin.role || 'admin',
        id: admin.id 
      },
      'your_jwt_secret', // ควรเก็บใน environment variable
      { expiresIn: '8h' }
    );
    
    // ตั้งค่า cookie
    res.setHeader('Set-Cookie', cookie.serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 ชั่วโมง
      path: '/',
    }));
    
    return res.status(200).json({ 
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: { 
        username: admin.username, 
        role: admin.role || 'admin',
        id: admin.id
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' 
    });
  }
}