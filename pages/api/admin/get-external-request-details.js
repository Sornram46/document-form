import { formDb } from '../../../db-connect';

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ success: false, message: 'ไม่ระบุรหัสคำขอ' });
  }
  
  try {
    // ใช้ formDb.query สำหรับการเข้าถึงฐานข้อมูลแบบฟอร์ม
    const requestResult = await formDb.query(`
      SELECT 
      r.*,
      r.company,  
      r.phone, 
      c.fullname AS coordinator_fullname,
      c.dept_name_th AS coordinator_dept_name_th
      FROM requests_external r
      LEFT JOIN coordinators_external c ON r.coordinator_username = c.username
      WHERE r.request_id = $1
    `, [id]);
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคำขอ' });
    }
    
    const request = requestResult.rows[0];
    
    // ดึงข้อมูลอุปกรณ์
    const equipmentResult = await formDb.query(`
      SELECT * FROM request_external_equipment
      WHERE request_id = $1
    `, [id]);
    
    // ดึงข้อมูลผู้เข้าพื้นที่
    const visitorsResult = await formDb.query(`
      SELECT * FROM request_external_visitors
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
    console.error('Error fetching external request details:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: error.message
    });
  }
}