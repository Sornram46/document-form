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
        r.request_id, 
        r.employee_id, 
        r.visit_date, 
        r.status, 
        r.document_number,
        r.created_at,
        r.purpose,
        e.first_name,
        e.last_name
      FROM 
        requests r
      LEFT JOIN 
        employees e ON r.employee_id = e.employee_id
      WHERE 
        r.employee_id IS NOT NULL
        AND r.type_form = 'internal'
      ORDER BY 
        r.created_at DESC
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