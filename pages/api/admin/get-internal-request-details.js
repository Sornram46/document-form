import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: '172.29.10.98',
  database: 'document_form',
  password: 'BPK9@support',
  port: 5432,
});

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ success: false, message: 'ไม่ระบุรหัสคำขอ' });
  }
  
  try {
    // ดึงข้อมูลคำขอหลัก
    const requestResult = await pool.query(`
      SELECT 
        r.*,
        e.first_name, 
        e.last_name, 
        e.department,
        c.dept_name_th, 
        e.phone,
        c.fullname AS coordinator_fullname,
        c.dept_name_th AS coordinator_dept_name_th
      FROM requests r
      LEFT JOIN employees e ON r.employee_id = e.employee_id
      LEFT JOIN coordinators c ON r.coordinator_username = c.username
      WHERE r.request_id = $1
    `, [id]);

    console.log('Raw SQL result:', requestResult.rows[0]);
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคำขอ' });
    }
    
    const request = requestResult.rows[0];
    
    // ดึงข้อมูลอุปกรณ์ (ถ้ามี)
    const equipmentResult = await pool.query(`
      SELECT * FROM request_equipment
      WHERE request_id = $1
    `, [id]);
    
    console.log('Equipment data:', equipmentResult.rows);
    // ดึงข้อมูลผู้เข้าพื้นที่ (ถ้ามี)
    const visitorsResult = await pool.query(`
      SELECT * FROM request_visitors
      WHERE request_id = $1
    `, [id]);
    
    // รวมข้อมูลทั้งหมด
    const requestData = {
      ...request,
      equipment: equipmentResult.rows,
      visitors: visitorsResult.rows
    };
    
    res.status(200).json({ success: true, request: requestData });
    
  } catch (error) {
    console.error('Error fetching request details:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
}