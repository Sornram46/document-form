import { formDb } from '../../../db-connect';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { requestId } = req.body;

  if (!requestId) {
    return res.status(400).json({ success: false, message: 'ไม่ระบุรหัสคำขอ' });
  }

  const client = await formDb.getClient();
  
  try {
    await client.query('BEGIN');
    
    // 1. ลบข้อมูลจากตาราง request_external_visitors ก่อน (foreign key)
    await client.query('DELETE FROM request_external_visitors WHERE request_id = $1', [requestId]);
    
    // 2. ลบข้อมูลจากตาราง request_external_equipment ก่อน (foreign key)
    await client.query('DELETE FROM request_external_equipment WHERE request_id = $1', [requestId]);
    
    // 3. ลบข้อมูลจากตาราง requests_external (primary)
    const deleteResult = await client.query('DELETE FROM requests_external WHERE request_id = $1', [requestId]);
    
    await client.query('COMMIT');
    
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคำขอที่ต้องการลบ' });
    }
    
    return res.status(200).json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting external request:', error);
    return res.status(500).json({ success: false, message: `เกิดข้อผิดพลาดในการลบข้อมูล: ${error.message}` });
  } finally {
    client.release();
  }
}