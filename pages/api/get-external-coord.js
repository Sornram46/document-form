import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: '172.29.10.98',
  database: 'users_db',
  password: 'BPK9@support',
  port: '5432',
});

export default async function handler(req, res) {
  try {
    // แก้ไข query ให้ถูกต้อง
    const query = `
      SELECT u.username, u.first_name, u.last_name, u.department_id, d.dept_name_th
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.dept_id
      
      ORDER BY u.first_name ASC
    `;
    // WHERE d.dept_name_th = 'เทคโนโลยีสารสนเทศ'
    
    const result = await pool.query(query);
    
    // ถ้าไม่พบข้อมูล ส่ง mock data กลับไป
    if (result.rows.length === 0) {
      const mockData = [
        { 
          username: '96706811', 
          first_name: 'ศรราม', 
          last_name: 'เหมือนเพชร', 
          department_id: '101',
          dept_name_th: 'เทคโนโลยีสารสนเทศ',
          position: 'ผู้ประสานงานระบบ'
        },
        { 
          username: '1002', 
          first_name: 'วิภา', 
          last_name: 'รักดี', 
          department_id: '101',
          dept_name_th: 'เทคโนโลยีสารสนเทศ',
          position: 'ผู้ดูแลระบบ'
        },
        { 
          username: '1003', 
          first_name: 'สมหญิง', 
          last_name: 'สมใจ', 
          department_id: '101',
          dept_name_th: 'เทคโนโลยีสารสนเทศ',
          position: 'เจ้าหน้าที่ไอที'
        }
      ];
      return res.status(200).json(mockData);
    }
    
    // เพิ่มค่า position เพื่อให้ใช้ในการแสดงตำแหน่ง
    const formattedResults = result.rows.map(row => ({
      ...row,
      position:  row.dept_name_th || 'ไม่ระบุแผนก'  // ค่าเริ่มต้น
    }));
    
    res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Database query error:', error);
    
    // ถ้าเกิดข้อผิดพลาด ส่ง mock data กลับไป
    const mockData = [
      { 
        username: '1001', 
        first_name: 'สมชาย', 
        last_name: 'ใจดี', 
        department_id: '101',
        dept_name_th: 'เทคโนโลยีสารสนเทศ',
        position: 'ผู้ประสานงานระบบ'
      },
      { 
        username: '1002', 
        first_name: 'วิภา', 
        last_name: 'รักดี', 
        department_id: '101',
        dept_name_th: 'เทคโนโลยีสารสนเทศ',
        position: 'ผู้ดูแลระบบ'
      },
      { 
        username: '1003', 
        first_name: 'สมหญิง', 
        last_name: 'สมใจ', 
        department_id: '101',
        dept_name_th: 'เทคโนโลยีสารสนเทศ',
        position: 'เจ้าหน้าที่ไอที'
      }
    ];
    res.status(200).json(mockData);
  }
}
