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
    // ดึงข้อมูลจากตาราง requests_external สำหรับบุคคลภายนอก
    const result = await pool.query(`
      SELECT 
       r.request_id,
        r.first_name,
        r.last_name,
        r.visit_date,
        r.company,
        r.phone,
        r.status,
        r.document_number,
        r.created_at
      FROM 
        requests_external r
      WHERE
        request_id IS NOT NULL
        
      ORDER BY 
        created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      requests: result.rows
    });
  } catch (error) {
    console.error('Error fetching external requests:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
}