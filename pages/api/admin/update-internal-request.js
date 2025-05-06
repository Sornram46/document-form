import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: '172.29.10.98',
  database: 'document_form',
  password: 'BPK9@support',
  port: 5432,
});

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
  
  const { 
    requestId,
    employeeId,
    firstName,
    lastName,
    department,
    phone,
    visitDate,
    visitTimeStart,
    visitTimeEnd,
    dataCenter,
    supportRoom,
    supportRoomDetails,
    purpose,
    coordinator,
    rank,
    visitors,
    importExportOption,
    equipment
  } = req.body;
  
  if (!requestId) {
    return res.status(400).json({ success: false, message: 'ไม่พบรหัสคำขอ' });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // ตรวจสอบว่าพนักงานมีอยู่หรือไม่
    const checkEmployee = await client.query(
      'SELECT employee_id FROM employees WHERE employee_id = $1',
      [employeeId]
    );
    
    if (checkEmployee.rows.length === 0) {
      // ถ้าไม่มีพนักงานในระบบ ให้เพิ่มใหม่
      await client.query(`
        INSERT INTO employees (employee_id, first_name, last_name, department, phone)
        VALUES ($1, $2, $3, $4, $5)
      `, [employeeId, firstName, lastName, department, phone]);
    } else {
      // อัปเดตข้อมูลพนักงานถ้ามีอยู่แล้ว
      await client.query(`
        UPDATE employees
        SET
          first_name = $1,
          last_name = $2,
          department = $3,
          phone = $4
        WHERE
          employee_id = $5
      `, [firstName, lastName, department, phone, employeeId]);
    }
    
    // อัปเดตข้อมูลคำขอหลังจากจัดการข้อมูลพนักงานแล้ว
    await client.query(`
      UPDATE requests
      SET
        employee_id = $1,
        visit_date = $2,
        visit_time_start = $3,
        visit_time_end = $4,
        data_center = $5,
        support_room = $6,
        support_room_details = $7,
        purpose = $8,
        coordinator_username = $9,   
        import_export_option = $10,       
        updated_at = NOW()
      WHERE
        request_id = $11
    `, [
      employeeId,      
      visitDate,
      visitTimeStart,
      visitTimeEnd,
      dataCenter,
      supportRoom,
      supportRoomDetails,
      purpose,
      coordinator,
      importExportOption,
      requestId
    ]);
    
    // ลบข้อมูลผู้เข้าพื้นที่เดิมและเพิ่มข้อมูลใหม่
    await client.query('DELETE FROM request_visitors WHERE request_id = $1', [requestId]);
    
    if (Array.isArray(visitors) && visitors.length > 0) {
      for (const visitor of visitors) {
        if (visitor && visitor.name) {
          await client.query(`
            INSERT INTO request_visitors (request_id, name, position)
            VALUES ($1, $2, $3)
          `, [requestId, visitor.name, visitor.position || '']);
        }
      }
    }
    
    // ลบข้อมูลอุปกรณ์เดิมและเพิ่มข้อมูลใหม่
    await client.query('DELETE FROM request_equipment WHERE request_id = $1', [requestId]);
    
    if (importExportOption === 'importAccess' && Array.isArray(equipment) && equipment.length > 0) {
      for (const item of equipment) {
        if (item && item.name) {
          await client.query(`
            INSERT INTO request_equipment (
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
    
    res.status(200).json({
      success: true,
      message: 'อัปเดตข้อมูลสำเร็จ'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating internal request:', error);
    res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ${error.message}`
    });
  } finally {
    client.release();
  }
}