import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: '172.29.10.98',
  database: 'document_form',
  password: 'BPK9@support',
  port: 5432,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        admin_id, 
        username, 
        email, 
        fullname, 
        role, 
        is_active, 
        created_at,
        updated_at,
        CASE 
          WHEN updated_at > created_at THEN updated_at
          ELSE created_at
        END as last_activity
      FROM admins 
      ORDER BY created_at DESC
    `);

    const admins = result.rows.map(admin => ({
      ...admin,
      created_at: new Date(admin.created_at).toLocaleString('th-TH'),
      last_activity: new Date(admin.last_activity).toLocaleString('th-TH')
    }));

    res.status(200).json({
      success: true,
      admins: admins,
      total: admins.length
    });

  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Admin',
      error: error.message
    });
  }
}