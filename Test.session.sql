`SELECT username FROM coordinators WHERE username = $1`

-- ตรวจสอบว่ามีคอลัมน์ type_form หรือไม่
`SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'requests' AND column_name = 'type_form'`;

-- หากยังไม่มีคอลัมน์ ให้เพิ่มคอลัมน์
ALTER TABLE requests ADD COLUMN IF NOT EXISTS type_form VARCHAR(20);