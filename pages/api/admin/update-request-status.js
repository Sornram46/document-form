import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: '172.29.10.98',
  database: 'document_form',
  password: 'BPK9@support',
  port: 5432,
});

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // ดึงค่า approver จาก req.body
  const { requestId, status, comment, approver, type } = req.body;
  
  console.log('Request body:', req.body); // เพิ่ม log เพื่อตรวจสอบข้อมูลที่ส่งมา
  
  if (!requestId || !status) {
    return res.status(400).json({ success: false, message: 'รหัสคำขอและสถานะเป็นข้อมูลที่จำเป็น' });
  }

  // ตรวจสอบว่าต้องระบุผู้อนุมัติหรือไม่
  if ((status === 'approved' || status === 'rejected') && !approver) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุผู้อนุมัติ' });
  }

  try {
    const tableName = type === 'external' ? 'requests_external' : 'requests';
    
    console.log(`Updating ${tableName} with ID ${requestId}, status: ${status}, approver: ${approver}`);
    
    const result = await pool.query(`
      UPDATE ${tableName}
      SET
        status = $1,
        status_comment = $2,
        approver = $3,
        approve_date = NOW(),
        updated_at = NOW()
      WHERE
        request_id = $4
      RETURNING *
    `, [status, comment || null, approver || null, requestId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคำขอ' });
    }
    
    res.status(200).json({
      success: true,
      message: 'อัปเดตสถานะสำเร็จ',
      request: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการอัปเดตสถานะ: ${error.message}`
    });
  }
}