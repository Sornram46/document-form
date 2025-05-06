import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: '172.29.10.98',
  database: 'document_form',
  password: 'BPK9@support',
  port: 5432,
});

export default async function handler(req, res) {
  try {
    // ดึงข้อมูลจากตาราง requests สำหรับบุคคลภายใน (มี employee_id)
    const result = await pool.query(`
      SELECT 
        request_id, 
        employee_id, 
        visit_date, 
        status, 
        document_number,
        created_at
      FROM 
        requests
      WHERE 
        employee_id IS NOT NULL
        AND type_form = 'internal'
      ORDER BY 
        created_at DESC
    `);
    
    res.status(200).json({ 
      success: true, 
      requests: result.rows 
    });
  } catch (error) {
    console.error('Error fetching internal requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' 
    });
  }
}