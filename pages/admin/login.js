import { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useRouter } from 'next/router';
import Head from 'next/head';
import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('🔄 Attempting login...', { username, passwordLength: password.length });
      
      // เปลี่ยนจาก /api/admin/login เป็น /api/auth/login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (response.ok && data.success) {
        console.log('✅ Login successful!');
        
        // บันทึก token และข้อมูลผู้ใช้
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('adminData', JSON.stringify(data.admin));
        
        // ไปยังหน้า admin-setup
        router.push('/admin/dashboard');
      } else {
        console.log('❌ Login failed:', data.message);
        setError(data.message || 'ไม่สามารถเข้าสู่ระบบได้');
      }
    } catch (err) {
      console.error('🚨 Login error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>เข้าสู่ระบบผู้ดูแล - ระบบ Form</title>
      </Head>
      <Container className="py-5 d-flex align-items-center justify-content-center" style={{minHeight: '100vh'}}>
        <div className="w-100" style={{maxWidth: '400px'}}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white text-center py-3">
              <h4 className="mb-0">เข้าสู่ระบบผู้ดูแล</h4>
            </Card.Header>
            <Card.Body className="p-4">
              {error && (
                <Alert variant="danger">
                  {error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>ชื่อผู้ใช้</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="กรอกชื่อผู้ใช้"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>รหัสผ่าน</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    required
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                  </Button>
                </div>
              
                <div className="text-center mt-3">
                  <Link href="/" className="text-decoration-none">กลับไปหน้าหลัก</Link>
                </div>
              
              </Form>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </>
  );
}