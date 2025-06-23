import { Pool } from 'pg';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { host, port, database, username, password } = req.body;

  const pool = new Pool({
    user: username,
    host: host,
    database: database,
    password: password,
    port: parseInt(port),
  });

  try {
    // ทดสอบการเชื่อมต่อ
    await pool.query('SELECT NOW()');

    // ตรวจสอบตารางที่มีอยู่
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    const requiredTables = ['admins', 'employees', 'requests', 'requests_external'];
    const tableStatus = {};
    
    requiredTables.forEach(table => {
      tableStatus[table] = existingTables.includes(table);
    });

    res.status(200).json({
      success: true,
      connected: true,
      tables: tableStatus,
      error: null
    });

  } catch (error) {
    console.error('Database connection error:', error);
    res.status(200).json({
      success: false,
      connected: false,
      tables: {},
      error: error.message
    });
  } finally {
    await pool.end();
  }
}