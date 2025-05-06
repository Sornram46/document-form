import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: '172.29.10.98',
  database: 'document_form',
  password: 'BPK9@support',
  port: 5432,
});

// ฟังก์ชัน query เพื่อรองรับ PostgreSQL
async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const formData = req.body;

    // 0. ตรวจสอบและเพิ่มผู้ประสานงานหากยังไม่มีในระบบ หรืออัปเดตข้อมูลหากมีแล้ว
    const coordinatorExists = await query(
      `SELECT username FROM coordinators WHERE username = $1`,
      [formData.coordinator]
    );

    if (coordinatorExists.length === 0) {
      // สร้างข้อมูลผู้ประสานงานใหม่
      await query(
        `INSERT INTO coordinators (username, fullname, dept_name_th)
         VALUES ($1, $2, $3)`,
        [
          formData.coordinator,
          formData.coordinatorFullName || 'ไม่ระบุชื่อ', // ใช้ชื่อเต็มจาก dropdown
          formData.coordinatorDept || 'ไม่ระบุแผนก'     // ใช้แผนกจาก dropdown
        ]
      );
    } else {
      // อัปเดตข้อมูลผู้ประสานงานที่มีอยู่แล้ว
      await query(
        `UPDATE coordinators 
         SET fullname = $1, dept_name_th = $2 
         WHERE username = $3`,
        [
          formData.coordinatorFullName || 'ไม่ระบุชื่อ',
          formData.coordinatorDept || 'ไม่ระบุแผนก',
          formData.coordinator
        ]
      );
    }

    // Generate เลขที่เอกสาร (document_number) ในรูปแบบ FM9YYMM####
    const currentDate = new Date();
    const thaiYear = (currentDate.getFullYear() + 543) % 100; // ใช้ปี พ.ศ. 2 ตัวท้าย
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // เดือน 2 หลัก
    
    // ค้นหาเลขลำดับล่าสุดของเดือนนี้
    const lastNumberResult = await query(
      `SELECT document_number 
       FROM (
         SELECT document_number FROM requests_external
         WHERE document_number LIKE $1
         UNION
         SELECT document_number FROM requests
         WHERE document_number LIKE $1
       ) AS combined_results
       ORDER BY document_number DESC
       LIMIT 1`,
      [`FM9${thaiYear}${month}%`]
    );
    
    let sequenceNumber = 1;
    if (lastNumberResult.length > 0) {
      // ถ้ามีเลขที่เอกสารแล้ว ดึงเลข sequence 4 หลักสุดท้ายและเพิ่มอีก 1
      const lastNumber = lastNumberResult[0].document_number;
      const lastSequence = parseInt(lastNumber.slice(-4));
      sequenceNumber = lastSequence + 1;
    }
    
    // สร้างเลขที่เอกสารใหม่
    const documentNumber = `FM9${thaiYear}${month}${String(sequenceNumber).padStart(4, '0')}`;

    // 1. บันทึกหรือแทนที่ข้อมูลพนักงาน (ใช้ ON CONFLICT DO UPDATE เพื่อ upsert)
    await query(
      `INSERT INTO employees (employee_id, first_name, last_name, department, phone) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (employee_id) 
       DO UPDATE SET first_name = $2, last_name = $3, department = $4, phone = $5`,
      [formData.employeeId, formData.firstName, formData.lastName, formData.department, formData.phone]
    );

    // 2. บันทึกข้อมูลคำขอหลัก (เพิ่ม document_number)
    const result = await query(
      `INSERT INTO requests (
        employee_id, request_date, visit_date, visit_time_start, visit_time_end,
        data_center, support_room, support_room_details, purpose,
        coordinator_username, import_export_option, type_form, document_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING request_id`,
      [
        formData.employeeId,
        formData.requestDate,
        formData.visitDate,
        formData.visitTimeStart,
        formData.visitTimeEnd,
        !!formData.dataCenter, // Convert undefined/null to false
        !!formData.supportRoom,
        formData.supportRoomDetails || null,
        formData.purpose,
        formData.coordinator,
        formData.importExportOption,
        'internal',
        documentNumber // เพิ่มเลขที่เอกสาร
      ]
    );

    const requestId = result[0].request_id;

    // 3. บันทึกข้อมูลผู้เข้าพื้นที่ พร้อมตำแหน่ง
    if (formData.visitors && formData.visitors.length > 0) {
      for (const visitor of formData.visitors) {
        await query(
          `INSERT INTO request_visitors (request_id, name, position) VALUES ($1, $2, $3)`,
          [requestId, visitor.name, visitor.position || null]
        );
      }
    }

    // 4. บันทึกข้อมูลอุปกรณ์
    if (formData.importExportOption === 'importAccess' && formData.equipment && formData.equipment.length > 0) {
      for (const item of formData.equipment) {
        if (item.name && item.name.trim() !== '') {
          await query(
            `INSERT INTO request_equipment (request_id, name, import_quantity, export_quantity) VALUES ($1, $2, $3, $4)`,
            [
              requestId,
              item.name,
              parseInt(item.importQuantity) || 0,
              parseInt(item.exportQuantity) || 0
            ]
          );
        }
      }
    }

    // ส่งเลขที่เอกสารกลับไปด้วย
    res.status(200).json({ 
      success: true, 
      requestId, 
      documentNumber 
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', error: error.message });
  }
}

// ในไฟล์ที่มีการส่งข้อมูลฟอร์ม เช่น InternalForm.js
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // แสดงข้อมูลก่อนส่ง
  console.log('Form data before submission:', formData);
  console.log('Equipment data before submission:', formData.equipment);
  
  try {
    const response = await fetch('/api/submit-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    // แสดงการตอบกลับ
    const result = await response.json();
    console.log('Response from API:', result);
    
    // จัดการการตอบกลับต่อไป
  } catch (error) {
    console.error('Error submitting form:', error);
  }
};