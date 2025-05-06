import { formDb } from '../../../db-connect';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { 
    requestId,
    firstName,
    lastName,
    requestDate,
    visitDate,
    visitTimeStart,
    visitTimeEnd,
    dataCenter,
    supportRoom,
    supportRoomDetails,
    purpose,
    importExportOption,
    visitors,
    equipment,
    phone,
    // ข้อมูลเฉพาะของบุคคลภายนอก
    companyName,
    coordinator
    
  } = req.body;

  console.log('Received request data:', req.body);

  // รับ client สำหรับ transaction
  const client = await formDb.getClient();

  try {
    await client.query('BEGIN');

    console.log('Updating main request data...');
    // 1. อัปเดตตาราง requests
    await client.query(`
      UPDATE requests_external
      SET
        first_name = $1,
        last_name = $2,
        request_date = $3,
        visit_date = $4,
        visit_time_start = $5,
        visit_time_end = $6,
        data_center = $7,
        support_room = $8,
        support_room_details = $9,
        purpose = $10,
        coordinator_username = $11,
        import_export_option = $12,
        phone = $13,
        updated_at = NOW()
      WHERE
        request_id = $14
    `, [
      firstName,
      lastName,
      requestDate,
      visitDate,
      visitTimeStart,
      visitTimeEnd,
      dataCenter,
      supportRoom,
      supportRoomDetails,
      purpose,
      coordinator,

      //rank
      importExportOption,
      phone,

      requestId
    ]);

    console.log('Updating external visitor data...');
 
    console.log('Updating visitors...');
    // 3. ลบข้อมูลผู้เข้าพื้นที่เดิมและเพิ่มข้อมูลใหม่
    await client.query('DELETE FROM request_external_visitors WHERE request_id = $1', [requestId]);
    
    if (Array.isArray(visitors) && visitors.length > 0) {
      for (const visitor of visitors) {
        if (visitor && visitor.name) {
          await client.query(`
            INSERT INTO request_external_visitors (request_id, name, position)
            VALUES ($1, $2, $3)
          `, [requestId, visitor.name, visitor.position || '']);
        }
      }
    }
    
    console.log('Updating equipment...');
    // 4. ลบข้อมูลอุปกรณ์เดิมและเพิ่มข้อมูลใหม่
    await client.query('DELETE FROM request_external_equipment WHERE request_id = $1', [requestId]);
    
    if (importExportOption === 'importAccess' && Array.isArray(equipment) && equipment.length > 0) {
      for (const item of equipment) {
        if (item && item.name) {
          await client.query(`
            INSERT INTO request_external_equipment (
              request_id, 
              name, 
              import_quantity,
              export_quantity
            )
            VALUES ($1, $2, $3, $4)
          `, [
            requestId, 
            item.name, 
            parseInt(item.importQuantity) || 0,
            parseInt(item.exportQuantity) || 0
          ]);
        }
      }
    }
    
    await client.query('COMMIT');
    console.log('Transaction committed successfully');
    
    res.status(200).json({
      success: true,
      message: 'อัปเดตข้อมูลสำเร็จ'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating external request:', error);
    res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ${error.message}`
    });
  } finally {
    // สำคัญมาก: ปล่อย client คืนสู่ pool เสมอ
    client.release();
  }
}