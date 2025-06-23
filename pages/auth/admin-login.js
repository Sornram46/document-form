import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validated, setValidated] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setLoading(true);
    setValidated(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // บันทึก token และข้อมูลผู้ใช้
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('adminData', JSON.stringify(data.admin));

        await Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ!',
          text: `ยินดีต้อนรับ ${data.admin.fullName}`,
          timer: 1500,
          showConfirmButton: false
        });

        // เปลี่ยนเส้นทางไปยังหน้า admin-setup
        router.push('/admin-setup');
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          text: data.message,
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>เข้าสู่ระบบ - ระบบจัดการแบบฟอร์ม</title>
      </Head>
      
      <div className="min-vh-100 d-flex align-items-center bg-light">
        <Container>
          <Row className="justify-content-center">
            <Col md={6} lg={5} xl={4}>
              <Card className="shadow-lg border-0">
                <Card.Header className="bg-primary text-white text-center py-4">
                  <h3 className="mb-0">
                    <FaUser className="me-2" />
                    เข้าสู่ระบบ
                  </h3>
                  <p className="mb-0 mt-2 small">ระบบจัดการแบบฟอร์ม BPK9</p>
                </Card.Header>
                
                <Card.Body className="p-4">
                  <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaUser className="me-2 text-muted" />
                        ชื่อผู้ใช้
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="กรอกชื่อผู้ใช้"
                        required
                        autoComplete="username"
                      />
                      <Form.Control.Feedback type="invalid">
                        กรุณากรอกชื่อผู้ใช้
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>
                        <FaLock className="me-2 text-muted" />
                        รหัสผ่าน
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="กรอกรหัสผ่าน"
                          required
                          autoComplete="current-password"
                        />
                        <Button
                          variant="link"
                          className="position-absolute top-50 end-0 translate-middle-y pe-3 text-muted"
                          style={{ background: 'none', border: 'none', zIndex: 5 }}
                          onClick={() => setShowPassword(!showPassword)}
                          type="button"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                      </div>
                      <Form.Control.Feedback type="invalid">
                        กรุณากรอกรหัสผ่าน
                      </Form.Control.Feedback>
                    </Form.Group>

                    <div className="d-grid gap-2">
                      <Button
                        variant="primary"
                        type="submit"
                        size="lg"
                        disabled={loading}
                        className="fw-bold"
                      >
                        {loading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              className="me-2"
                            />
                            กำลังเข้าสู่ระบบ...
                          </>
                        ) : (
                          'เข้าสู่ระบบ'
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
                
                <Card.Footer className="text-center py-3 bg-light">
                  
                  <small className="text-muted mt-1 d-block">
                    <Link href="/" className="text-decoration-none">
                      ← กลับหน้าหลัก
                    </Link>
                  </small>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
}