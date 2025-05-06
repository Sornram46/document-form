import pg from 'pg';
const { Pool } = pg;

// กำหนดค่าส่วนกลาง
const poolConfig = {
  max: 20,                       // จำนวนการเชื่อมต่อสูงสุด
  idleTimeoutMillis: 30000,      // timeout สำหรับการเชื่อมต่อที่ไม่ได้ใช้งาน
  connectionTimeoutMillis: 2000, // timeout สำหรับการเชื่อมต่อใหม่
  allowExitOnIdle: true         // อนุญาตให้ปิดการเชื่อมต่อเมื่อไม่ได้ใช้งาน
};

// ตั้งค่าการเชื่อมต่อฐานข้อมูลชุดที่ 1 (users_db)
export const pool1 = new Pool({
  user: process.env.USERS_DB_USER || 'postgres',
  host: process.env.USERS_DB_HOST || '172.29.10.98',
  database: process.env.USERS_DB_NAME || 'users_db',
  password: process.env.USERS_DB_PASS || 'BPK9@support',
  port: parseInt(process.env.USERS_DB_PORT || '5432'),
  ...poolConfig
});

// ตั้งค่าการเชื่อมต่อฐานข้อมูลชุดที่ 2 (document_form)
export const pool2 = new Pool({
  user: process.env.FORM_DB_USER || 'postgres',
  host: process.env.FORM_DB_HOST || '172.29.10.98',
  database: process.env.FORM_DB_NAME || 'document_form',
  password: process.env.FORM_DB_PASS || 'BPK9@support',
  port: parseInt(process.env.FORM_DB_PORT || '5432'),
  ...poolConfig
});

// เพิ่ม event listeners สำหรับการตรวจจับข้อผิดพลาด
pool1.on('error', (err) => {
  console.error('Users database pool error:', err);
});

pool2.on('error', (err) => {
  console.error('Form database pool error:', err);
});

// เพิ่ม helpers สำหรับการทำงานกับฐานข้อมูล
export const usersDb = {
  query: async (text, params) => {
    let client;
    try {
      client = await pool1.connect();
      const result = await client.query(text, params);
      return result;
    } finally {
      if (client) client.release(true); // true จะบังคับให้ปิดการเชื่อมต่อทันทีแทนที่จะคืนกลับ pool
    }
  },
  getClient: async () => {
    const client = await pool1.connect();
    const originalRelease = client.release;
    // เปลี่ยนแปลง client.release ให้ใช้ (true) เพื่อให้แน่ใจว่าจะคืนการเชื่อมต่อ
    client.release = () => {
      client.release = originalRelease;
      return client.release(true);
    };
    return client;
  }
};

export const formDb = {
  query: async (text, params) => {
    let client;
    try {
      client = await pool2.connect();
      const result = await client.query(text, params);
      return result;
    } finally {
      if (client) client.release(true);
    }
  },
  getClient: async () => {
    const client = await pool2.connect();
    const originalRelease = client.release;
    client.release = () => {
      client.release = originalRelease;
      return client.release(true);
    };
    return client;
  }
};

// เพิ่มฟังก์ชันสำหรับล้าง connections ทั้งหมด
export const cleanupConnections = async () => {
  console.log('Cleaning up database connections...');
  await pool1.end();
  await pool2.end();
  console.log('All database connections have been closed.');
};

// ทำความสะอาด pools เมื่อปิดเซิร์ฟเวอร์
process.on('SIGINT', async () => {
  await cleanupConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanupConnections();
  process.exit(0);
});
