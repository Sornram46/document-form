import { usersDb } from '../../db-connect';

export default async function handler(req, res) {
  try {
    const searchTerm = req.query.search || '';
    
    // เพิ่มเงื่อนไขเพื่อลดการเรียกใช้ฐานข้อมูลโดยไม่จำเป็น
    if (!searchTerm || searchTerm.length < 2) {
      return res.status(200).json([]);
    }
    
    // ค้นหาผู้ใช้จากรหัสพนักงาน
    const query = `
      SELECT 
        u.username, 
        u.first_name, 
        u.last_name, 
        d.dept_name_th, 
        u.phone_num
      FROM 
        users u
      LEFT JOIN 
        departments d ON u.department_id = d.dept_id
      WHERE 
        u.username ILIKE $1 OR CAST(u.username AS TEXT) ILIKE $1
      LIMIT 10;

    `;
    
    // เพิ่ม logging เพื่อตรวจสอบการเรียกใช้งาน
    console.log(`Searching for user with term: ${searchTerm}`);
    
    // ใช้ usersDb.query จากไฟล์ db-connect.js
    const result = await usersDb.query(query, [`%${searchTerm}%`]);
    
    // Log ผลลัพธ์
    console.log(`Found ${result.rows.length} results`);
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล',
      details: error.message
    });
  }
}