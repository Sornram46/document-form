import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: '172.29.10.98',
  database: 'document_form',
  password: 'BPK9@support',
  port: 5432,
});

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // ตรวจสอบว่ามี admin อยู่หรือไม่
    const checkAdmin = await pool.query(
      'SELECT admin_id, username FROM admins WHERE admin_id = $1',
      [id]
    );

    if (checkAdmin.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ Admin ที่ต้องการลบ'
      });
    }

    // ลบ admin
    await pool.query('DELETE FROM admins WHERE admin_id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'ลบ Admin เรียบร้อย'
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบ Admin'
    });
  }
}