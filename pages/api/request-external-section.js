import { Pool } from 'pg';

const pool = new Pool({
  user:'postgres',
  host: '172.29.10.98',
  database: 'users_db',
  password: 'BPK9@support',
  port: '5432',
});

export default async function handler(req, res) {
  try {
    const searchTerm = req.query.search || '';
    
    // ค้นหาผู้ใช้จากรหัสพนักงาน
    const query = `
      SELECT username, first_name,last_name, department_id, phone_num 
      FROM users
      WHERE username ILIKE $1 OR CAST(username AS TEXT) ILIKE $1
      LIMIT 10
    `;
    
    const result = await pool.query(query, [`%${searchTerm}%`]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: error.message });
  }
}