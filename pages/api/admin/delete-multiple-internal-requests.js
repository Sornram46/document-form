import { pool2 } from '../../../db-connect';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { requestIds } = req.body;

  if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'กรุณาระบุรายการที่ต้องการลบ'
    });
  }

  const client = await pool2.connect();
  
  try {
    await client.query('BEGIN');
    
    // ลบข้อมูลจากตารางย่อยก่อน (เพื่อหลีกเลี่ยง foreign key constraint)
    for (const requestId of requestIds) {
      // 1. ลบข้อมูลจากตาราง request_visitors ก่อน (foreign key)
      await client.query('DELETE FROM request_visitors WHERE request_id = $1', [requestId]);
      
      // 2. ลบข้อมูลจากตาราง request_equipment ก่อน (foreign key)
      await client.query('DELETE FROM request_equipment WHERE request_id = $1', [requestId]);
    }

    // 3. ลบข้อมูลจากตาราง requests (primary)
    const placeholders = requestIds.map((_, index) => `$${index + 1}`).join(',');
    const deleteResult = await client.query(
      `DELETE FROM requests WHERE request_id IN (${placeholders})`,
      requestIds
    );

    await client.query('COMMIT');
    
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'ไม่พบข้อมูลคำขอที่ต้องการลบ' 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `ลบข้อมูล ${deleteResult.rowCount} รายการเรียบร้อยแล้ว`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting multiple internal requests:', error);
    return res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการลบข้อมูล: ${error.message}`
    });
  } finally {
    client.release();
  }
}