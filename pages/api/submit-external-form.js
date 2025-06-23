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
    // ตรวจสอบผู้ประสานงานในตาราง coordinators (ไม่ใช่ coordinators_external)
    const coordinatorExists = await query(
      `SELECT username FROM coordinators_external WHERE username = $1`,
      [formData.coordinator]
    );

    if (coordinatorExists.length === 0) {
      // สร้างข้อมูลผู้ประสานงานใหม่ในตาราง coordinators
      await query(
        `INSERT INTO coordinators_external (username, fullname, dept_name_th)
          VALUES ($1, $2, $3)`,
        [
          formData.coordinator,
           formData.coordinatorFullName || 'ไม่ระบุชื่อ', // ใช้ชื่อเต็มจาก dropdown
          formData.coordinatorDept || 'ไม่ระบุแผนก'
        ]
      );
    } else {
      // อัปเดตข้อมูลผู้ประสานงานที่มีอยู่แล้ว
      await query(
        `UPDATE coordinators_external
         SET fullname = $1, dept_name_th = $2
         WHERE username = $3`,
        [
          formData.coordinatorFullName || 'ไม่ระบุชื่อ',
          formData.coordinatorDept || 'ไม่ระบุแผนก',
          formData.coordinator
        ]
      );
    }

    // สร้างเลขที่เอกสาร
    const currentDate = new Date();
    const thaiYear = (currentDate.getFullYear() + 543) % 100;
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');

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
      const lastNumber = lastNumberResult[0].document_number;
      const lastSequence = parseInt(lastNumber.slice(-4));
      sequenceNumber = lastSequence + 1;
    }

    const documentNumber = `FM9${thaiYear}${month}${String(sequenceNumber).padStart(4, '0')}`;

    // 1. บันทึกข้อมูลคำขอหลักในตาราง requests_external
    const result = await query(
      `INSERT INTO requests_external (
        document_number,
        first_name, last_name, phone, company,
        request_date,
        visit_date, visit_time_start, visit_time_end,
        data_center, support_room, support_room_details, purpose,
        coordinator_username, import_export_option, status, type_form
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
      RETURNING request_id`,
      [
        documentNumber,
        formData.firstName,
        formData.lastName,
        formData.phone || '',
        formData.company || '',
        formData.requestDate ,
        formData.visitDate,
        formData.visitTimeStart,
        formData.visitTimeEnd,
        !!formData.dataCenter,
        !!formData.supportRoom,
        formData.supportRoomDetails || '',
        formData.purpose,
        formData.coordinator,
        formData.importExportOption,
        'pending',
        'external' // ตรวจสอบให้แน่ใจว่าส่งค่า type_form เป็น 'external'
      ]
    );

    const requestId = result[0].request_id;

    // 2. บันทึกข้อมูลผู้เข้าพื้นที่ พร้อมตำแหน่ง
    if (formData.visitors && formData.visitors.length > 0) {
      for (const visitor of formData.visitors) {
        await query(
          `INSERT INTO request_external_visitors (request_id, name,lastname, position) 
           VALUES ($1, $2, $3 , $4)`,
          [requestId, visitor.name,visitor.lastname, visitor.position || null]
        );
      }
    }

    // 3. บันทึกข้อมูลอุปกรณ์
    if (formData.importExportOption === 'importAccess' && formData.equipment && formData.equipment.length > 0) {
      for (const item of formData.equipment) {
        if (item.name && item.name.trim() !== '') {
          await query(
            `INSERT INTO request_external_equipment (
               request_id, name, import_quantity, export_quantity
             ) VALUES ($1, $2, $3, $4)`,
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
      documentNumber,
      message: 'บันทึกข้อมูลสำเร็จ',
      formType: 'external'
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ 
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 
      error: error.message 
    });
  }
}
// ในไฟล์ที่ส่งข้อมูล (ส่วนของการ submit ฟอร์ม)
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // ตรวจสอบและแก้ไขข้อมูลก่อนส่ง
  const formDataToSubmit = {
    ...formData,
    // แก้ไขข้อมูลโทรศัพท์
    phone: formData.phone || '', // ใช้ string ว่างแทน null
    
    // แก้ไขข้อมูลผู้ประสานงาน
    coordinator: formData.coordinator,
    coordinatorFirstName: formData.coordinatorInfo?.first_name || '',
    coordinatorLastName: formData.coordinatorInfo?.last_name || '',
    coordinatorDept: formData.coordinatorInfo?.dept_name_th || 'ไม่ระบุแผนก',
    coordinatorPhone: formData.coordinatorInfo?.phone_num || '',
  };
  
  // ส่งข้อมูลไปยัง API
  try {
    const response = await fetch('/api/submit-external-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formDataToSubmit)
    });
    
    // ตรวจสอบ response
  } catch (error) {
    // จัดการข้อผิดพลาด
  }
};