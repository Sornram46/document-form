import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Tabs, Table, Badge, Spinner, Modal } from 'react-bootstrap';
import Head from 'next/head';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/router';
import { 
  FaCog, 
  FaDatabase, 
  FaUser, 
  FaUserPlus, 
  FaCheck, 
  FaTimes, 
  FaSync, 
  FaExclamationTriangle,
  FaInfoCircle,
  FaServer,
  FaKey,
  FaUsers,
  FaTrash,
  FaEdit,
  FaEye,
  FaUserShield,
  FaCrown,
  FaToggleOn,
  FaToggleOff,
  FaSignOutAlt  // เพิ่มไอคอน logout
} from 'react-icons/fa';

export default function AdminSetup() {
  // เพิ่ม router
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('database');
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState({
    connected: false,
    tables: {},
    error: null
  });
  
  // Database Configuration
  const [dbConfig, setDbConfig] = useState({
    host: '172.29.10.98',
    port: '5432',
    database: 'document_form',
    username: 'postgres',
    password: 'BPK9@support'
  });

  // Admin Creation Form
  const [adminForm, setAdminForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullname: '',
    role: 'admin'
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'ระบบขออนุญาตเข้าพื้นที่',
    hospitalName: 'โรงพยาบาลบางปะกอก9 อินเตอร์เนชั่นแนล',
    jwtSecret: '',
    sessionTimeout: '24',
    allowRegistration: false,
    maintenanceMode: false
  });

  // Existing Admins
  const [existingAdmins, setExistingAdmins] = useState([]);

  // Modal and Stats
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminStats, setAdminStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  useEffect(() => {
    checkDatabaseStatus();
    fetchExistingAdmins();
  }, []);

  // ตรวจสอบสถานะฐานข้อมูล - แก้ไข error handling
  const checkDatabaseStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/check-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig)
      });
      
      // ตรวจสอบ status code ก่อน
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // ตรวจสอบ content-type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Response is not JSON:', text);
        throw new Error('Response ไม่ใช่ JSON');
      }
      
      const data = await response.json();
      setDbStatus(data);
    } catch (error) {
      console.error('Database check error:', error);
      setDbStatus({
        connected: false,
        tables: {},
        error: error.message || 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้'
      });
    } finally {
      setLoading(false);
    }
  };

  // สร้างตารางฐานข้อมูล - แก้ไข error handling
  const createTables = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/create-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Response is not JSON:', text);
        throw new Error('Response ไม่ใช่ JSON');
      }
      
      const data = await response.json();
      
      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'สำเร็จ!',
          text: 'สร้างตารางฐานข้อมูลเรียบร้อย'
        });
        checkDatabaseStatus();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Create tables error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // ดึงรายชื่อ Admin ที่มีอยู่ - ปรับปรุงใหม่
  const fetchExistingAdmins = async () => {
    try {
      console.log('📥 Fetching existing admins...');
      
      const response = await fetch('/api/admin/get-admins', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // ไม่ต้องส่ง Authorization header
        }
      });
      
      console.log('Get admins response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Admin API not found, skipping...');
          return;
        }
        const errorText = await response.text();
        console.error('Get admins response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('Response is not JSON, skipping...');
        return;
      }

      const data = await response.json();
      console.log('Get admins API Response:', data);
      
      if (data.success) {
        setExistingAdmins(data.admins);
        
        // คำนวณสถิติ
        const stats = {
          total: data.admins.length,
          active: data.admins.filter(admin => admin.is_active).length,
          inactive: data.admins.filter(admin => !admin.is_active).length
        };
        setAdminStats(stats);
        console.log('📊 Admin stats updated:', stats);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  // สร้าง Admin ผู้ใช้ - แก้ไข error handling
  const createAdmin = async (e) => {
    e.preventDefault();
    
    if (adminForm.password !== adminForm.confirmPassword) {
      await Swal.fire({
        icon: 'error',
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณาตรวจสอบรหัสผ่านและการยืนยันรหัสผ่าน'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Response is not JSON:', text);
        throw new Error('Response ไม่ใช่ JSON');
      }
      
      const data = await response.json();
      
      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'สำเร็จ!',
          text: 'สร้างบัญชี Admin เรียบร้อย'
        });
        
        setAdminForm({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          fullname: '',
          role: 'admin'
        });
        
        fetchExistingAdmins();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Create admin error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // บันทึกการตั้งค่าระบบ - แก้ไข error handling
  const saveSystemSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Response is not JSON:', text);
        throw new Error('Response ไม่ใช่ JSON');
      }
      
      const data = await response.json();
      
      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'สำเร็จ!',
          text: 'บันทึกการตั้งค่าเรียบร้อย'
        });
      }
    } catch (error) {
      console.error('Save settings error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // เปลี่ยนสถานะ Admin
  const toggleAdminStatus = async (adminId, currentStatus, username) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    
    const result = await Swal.fire({
      title: `ยืนยันการ${action}`,
      text: `คุณต้องการ${action} Admin "${username}" หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#28a745' : '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: action,
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        console.log('🔄 Updating admin status:', { adminId, newStatus });
        
        const response = await fetch(`/api/admin/update-status/${adminId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json'
            // ไม่ต้องส่ง Authorization header สำหรับ admin status
          },
          body: JSON.stringify({ is_active: newStatus })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Response is not JSON:', text);
          throw new Error('Response ไม่ใช่ JSON');
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'สำเร็จ!',
            text: data.message,
            timer: 1500,
            showConfirmButton: false
          });
          fetchExistingAdmins();
        } else {
          throw new Error(data.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Toggle admin status error:', error);
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด!',
          text: error.message || 'ไม่สามารถอัปเดตสถานะได้',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  // ดูรายละเอียด Admin
  const viewAdminDetails = (admin) => {
    setSelectedAdmin(admin);
    setShowAdminModal(true);
  };

  // ลบ Admin - ปรับปรุงใหม่
  const deleteAdmin = async (adminId, username) => {
    // ตรวจสอบว่าเป็น admin คนสุดท้ายหรือไม่
    const activeAdmins = existingAdmins.filter(admin => admin.is_active);
    if (activeAdmins.length <= 1) {
      await Swal.fire({
        icon: 'warning',
        title: 'ไม่สามารถลบได้',
        text: 'ต้องมี Admin อย่างน้อย 1 คนในระบบ'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      html: `
        <p>คุณต้องการลบ Admin "<strong>${username}</strong>" หรือไม่?</p>
        <p class="text-danger small"><i class="fas fa-exclamation-triangle"></i> การกระทำนี้ไม่สามารถย้อนกลับได้</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      focusCancel: true
    });

    if (result.isConfirmed) {
      try {
        console.log('🗑️ Deleting admin:', adminId);
        
        const response = await fetch(`/api/admin/delete-admin/${adminId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
            // ไม่ต้องส่ง Authorization header
          }
        });
        
        console.log('Delete response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Delete response error:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Response is not JSON:', text);
          throw new Error('Response ไม่ใช่ JSON');
        }

        const data = await response.json();
        console.log('Delete API Response:', data);
        
        if (data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'สำเร็จ!',
            text: 'ลบ Admin เรียบร้อย',
            timer: 1500,
            showConfirmButton: false
          });
          fetchExistingAdmins();
        } else {
          throw new Error(data.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Delete admin error:', error);
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด!',
          text: error.message || 'ไม่สามารถลบ Admin ได้',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  // แก้ไข useEffect ให้ไม่ error เมื่อ API ยังไม่พร้อม
  useEffect(() => {
    // เรียกทีละตัวและไม่ block กัน
    const initializeData = async () => {
      try {
        await checkDatabaseStatus();
      } catch (error) {
        console.error('Initial database check failed:', error);
      }
      
      try {
        await fetchExistingAdmins();
      } catch (error) {
        console.error('Initial admin fetch failed:', error);
      }
    };

    initializeData();
  }, []);

  // เพิ่มฟังก์ชัน logout
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'ยืนยันการออกจากระบบ',
      text: 'คุณต้องการออกจากระบบใช่หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        // ลบข้อมูลการเข้าสู่ระบบ
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminData');
        
        // แสดงข้อความสำเร็จ
        await Swal.fire({
          icon: 'success',
          title: 'ออกจากระบบสำเร็จ',
          text: 'คุณได้ออกจากระบบเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false
        });
        
        // ไปหน้า login
        router.push('/admin/login');
      } catch (error) {
        console.error('Logout error:', error);
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถออกจากระบบได้'
        });
      }
    }
  };

  return (
    <>
      <Head>
        <title>Admin Setup - ตั้งค่าระบบแอดมิน</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-vh-100 bg-light">
        {/* Header - อัปเดตส่วนนี้ */}
        <div className="bg-primary text-white py-4">
          <Container>
            <Row>
              <Col>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h1 className="h3 mb-0">
                      <FaCog className="me-2" />
                      Admin Setup - ตั้งค่าระบบแอดมิน
                    </h1>
                    <p className="mb-0 opacity-75">จัดการการตั้งค่าเริ่มต้นของระบบ</p>
                  </div>
                  
                  {/* ส่วนปุ่มด้านขวา */}
                  <div className="d-flex align-items-center gap-3">
                    {/* แสดงข้อมูลผู้ใช้ */}
                    <div className="d-none d-md-block text-end">
                      <div className="small opacity-75">ผู้ดูแลระบบ</div>
                      <div className="fw-bold">Admin Setup Mode</div>
                    </div>
                    
                    {/* ปุ่ม Dashboard */}
                    <Button 
                      variant="outline-light" 
                      size="sm"
                      onClick={() => router.push('/admin/dashboard')}
                      className="d-flex align-items-center"
                    >
                      <FaCog className="me-1" />
                      <span className="d-none d-sm-inline">Dashboard</span>
                    </Button>
                    
                    {/* ปุ่ม Logout */}
                    <Button 
                      variant="outline-light" 
                      size="sm"
                      onClick={handleLogout}
                      className="d-flex align-items-center"
                    >
                      <FaSignOutAlt className="me-1" />
                      <span className="d-none d-sm-inline">ออกจากระบบ</span>
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </div>

        {/* เพิ่มการแสดงสถานะการเชื่อมต่อ */}
        <div className="bg-light border-bottom py-2">
          <Container>
            <Row>
              <Col>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <span className="text-muted small me-2">สถานะฐานข้อมูล:</span>
                      {dbStatus.connected ? (
                        <Badge bg="success" className="d-flex align-items-center">
                          <FaCheck className="me-1" size={10} />
                          เชื่อมต่อแล้ว
                        </Badge>
                      ) : (
                        <Badge bg="danger" className="d-flex align-items-center">
                          <FaTimes className="me-1" size={10} />
                          ไม่เชื่อมต่อ
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <span className="text-muted small me-2">Admin ในระบบ:</span>
                      <Badge bg="info">{adminStats.total} คน</Badge>
                    </div>
                  </div>
                  
                  {/* ข้อมูลระบบ */}
                  <div className="d-none d-lg-flex align-items-center text-muted small">
                    <FaServer className="me-1" />
                    <span>Version 1.0.0 | PostgreSQL</span>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </div>

        <Container className="py-4">
          <Tabs
            activeKey={activeTab}
            onSelect={setActiveTab}
            className="mb-4"
          >
            {/* Database Setup Tab */}
            <Tab eventKey="database" title={
              <span>
                <FaDatabase className="me-1" />
                ฐานข้อมูล
              </span>
            }>
              <Row>
                <Col lg={8}>
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">การตั้งค่าฐานข้อมูล</h5>
                    </Card.Header>
                    <Card.Body>
                      <Form>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Host</Form.Label>
                              <Form.Control
                                type="text"
                                value={dbConfig.host}
                                onChange={(e) => setDbConfig({...dbConfig, host: e.target.value})}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Port</Form.Label>
                              <Form.Control
                                type="text"
                                value={dbConfig.port}
                                onChange={(e) => setDbConfig({...dbConfig, port: e.target.value})}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Database Name</Form.Label>
                              <Form.Control
                                type="text"
                                value={dbConfig.database}
                                onChange={(e) => setDbConfig({...dbConfig, database: e.target.value})}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Username</Form.Label>
                              <Form.Control
                                type="text"
                                value={dbConfig.username}
                                onChange={(e) => setDbConfig({...dbConfig, username: e.target.value})}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={dbConfig.password}
                            onChange={(e) => setDbConfig({...dbConfig, password: e.target.value})}
                          />
                        </Form.Group>

                        <div className="d-flex gap-2">
                          <Button 
                            variant="primary" 
                            onClick={checkDatabaseStatus}
                            disabled={loading}
                          >
                            <FaSync className="me-1" />
                            ทดสอบการเชื่อมต่อ
                          </Button>
                          
                          <Button 
                            variant="success" 
                            onClick={createTables}
                            disabled={loading || !dbStatus.connected}
                          >
                            <FaDatabase className="me-1" />
                            สร้างตารางฐานข้อมูล
                          </Button>
                        </div>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  <Card>
                    <Card.Header>
                      <h6 className="mb-0">สถานะฐานข้อมูล</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <div className="d-flex align-items-center">
                          {dbStatus.connected ? (
                            <>
                              <FaCheck className="text-success me-2" />
                              <span className="text-success">เชื่อมต่อสำเร็จ</span>
                            </>
                          ) : (
                            <>
                              <FaTimes className="text-danger me-2" />
                              <span className="text-danger">ไม่สามารถเชื่อมต่อได้</span>
                            </>
                          )}
                        </div>
                      </div>

                      {dbStatus.error && (
                        <Alert variant="danger" className="small">
                          <FaExclamationTriangle className="me-1" />
                          {dbStatus.error}
                        </Alert>
                      )}

                      {dbStatus.connected && (
                        <div>
                          <h6 className="small text-muted mb-2">ตารางในฐานข้อมูล:</h6>
                          {Object.entries(dbStatus.tables).map(([table, exists]) => (
                            <div key={table} className="d-flex justify-content-between align-items-center mb-1">
                              <span className="small">{table}</span>
                              {exists ? (
                                <Badge bg="success">
                                  <FaCheck size={10} />
                                </Badge>
                              ) : (
                                <Badge bg="secondary">
                                  <FaTimes size={10} />
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            {/* Admin Management Tab */}
            <Tab eventKey="admin" title={
              <span>
                <FaUsers className="me-1" />
                จัดการ Admin
              </span>
            }>
              {/* Admin Statistics Cards */}
              <Row className="mb-4">
                <Col md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <FaUsers size={30} className="text-primary mb-2" />
                      <h3 className="text-primary">{adminStats.total}</h3>
                      <p className="text-muted mb-0">Admin ทั้งหมด</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <FaUserShield size={30} className="text-success mb-2" />
                      <h3 className="text-success">{adminStats.active}</h3>
                      <p className="text-muted mb-0">ใช้งานอยู่</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <FaTimes size={30} className="text-warning mb-2" />
                      <h3 className="text-warning">{adminStats.inactive}</h3>
                      <p className="text-muted mb-0">ปิดใช้งาน</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <FaSync 
                        size={30} 
                        className={`text-info mb-2 ${loading ? 'fa-spin' : ''}`} 
                      />
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={fetchExistingAdmins}
                        disabled={loading}
                      >
                        รีเฟรช
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col lg={5}>
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">
                        <FaUserPlus className="me-2" />
                        สร้าง Admin ใหม่
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <Form onSubmit={createAdmin}>
                        <Form.Group className="mb-3">
                          <Form.Label>Username *</Form.Label>
                          <Form.Control
                            type="text"
                            value={adminForm.username}
                            onChange={(e) => setAdminForm({...adminForm, username: e.target.value})}
                            required
                            placeholder="กรอกชื่อผู้ใช้"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Email *</Form.Label>
                          <Form.Control
                            type="email"
                            value={adminForm.email}
                            onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                            required
                            placeholder="example@bpk9.com"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>ชื่อ-นามสกุล *</Form.Label>
                          <Form.Control
                            type="text"
                            value={adminForm.fullname}
                            onChange={(e) => setAdminForm({...adminForm, fullname: e.target.value})}
                            required
                            placeholder="กรอกชื่อ-นามสกุล"
                          />
                        </Form.Group>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>รหัสผ่าน *</Form.Label>
                              <Form.Control
                                type="password"
                                value={adminForm.password}
                                onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                                required
                                minLength={6}
                                placeholder="อย่างน้อย 6 ตัวอักษร"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>ยืนยันรหัสผ่าน *</Form.Label>
                              <Form.Control
                                type="password"
                                value={adminForm.confirmPassword}
                                onChange={(e) => setAdminForm({...adminForm, confirmPassword: e.target.value})}
                                required
                                minLength={6}
                                placeholder="ยืนยันรหัสผ่าน"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group className="mb-3">
                          <Form.Label>บทบาท</Form.Label>
                          <Form.Select
                            value={adminForm.role}
                            onChange={(e) => setAdminForm({...adminForm, role: e.target.value})}
                          >
                            <option value="admin">แอดมิน</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="coordinator">ผู้ประสานงาน</option>
                            <option value="approver">ผู้อนุมัติ</option>
                          </Form.Select>
                        </Form.Group>

                        <Button 
                          type="submit" 
                          variant="primary" 
                          disabled={loading}
                          className="w-100"
                        >
                          {loading ? (
                            <>
                              <Spinner size="sm" className="me-1" />
                              กำลังสร้าง...
                            </>
                          ) : (
                            <>
                              <FaUserPlus className="me-1" />
                              สร้าง Admin
                            </>
                          )}
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={7}>
                  <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        <FaUsers className="me-2" />
                        รายชื่อ Admin ({existingAdmins.length})
                      </h5>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={fetchExistingAdmins}
                        disabled={loading}
                      >
                        <FaSync className={loading ? 'fa-spin' : ''} />
                      </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {existingAdmins.length > 0 ? (
                          <Table striped hover responsive className="mb-0">
                            <thead className="table-dark sticky-top">
                              <tr>
                                <th>Username</th>
                                <th>ชื่อ-นามสกุล</th>
                                <th>บทบาท</th>
                                <th>สถานะ</th>
                                <th>วันที่สร้าง</th>
                                <th className="text-center">จัดการ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {existingAdmins.map((admin) => (
                                <tr key={admin.admin_id}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      {admin.role === 'super_admin' && (
                                        <FaCrown className="text-warning me-1" />
                                      )}
                                      <strong>{admin.username}</strong>
                                    </div>
                                    <small className="text-muted">{admin.email}</small>
                                  </td>
                                  <td>{admin.fullname}</td>
                                  <td>
                                    <Badge bg={admin.role === 'super_admin' ? 'warning' : 'info'}>
                                      {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge bg={admin.is_active ? 'success' : 'secondary'}>
                                      {admin.is_active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <small>{admin.created_at}</small>
                                  </td>
                                  <td>
                                    <div className="d-flex gap-1 justify-content-center">
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => viewAdminDetails(admin)}
                                        title="ดูรายละเอียด"
                                      >
                                        <FaEye />
                                      </Button>
                                      
                                      <Button
                                        variant={admin.is_active ? 'outline-warning' : 'outline-success'}
                                        size="sm"
                                        onClick={() => toggleAdminStatus(admin.admin_id, admin.is_active, admin.username)}
                                        title={admin.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                      >
                                        {admin.is_active ? <FaToggleOn /> : <FaToggleOff />}
                                      </Button>
                                      
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => deleteAdmin(admin.admin_id, admin.username)}
                                        title="ลบ"
                                      >
                                        <FaTrash />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : (
                          <div className="text-center text-muted py-5">
                            <FaInfoCircle size={40} className="mb-3" />
                            <h5>ยังไม่มี Admin ในระบบ</h5>
                            <p>กรุณาสร้าง Admin คนแรกเพื่อเริ่มใช้งานระบบ</p>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            {/* System Settings Tab */}
            <Tab eventKey="settings" title={
              <span>
                <FaCog className="me-1" />
                ตั้งค่าระบบ
              </span>
            }>
              <Row>
                <Col lg={8}>
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">การตั้งค่าระบบ</h5>
                    </Card.Header>
                    <Card.Body>
                      <Form>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>ชื่อระบบ</Form.Label>
                              <Form.Control
                                type="text"
                                value={systemSettings.siteName}
                                onChange={(e) => setSystemSettings({...systemSettings, siteName: e.target.value})}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>ชื่อโรงพยาบาล</Form.Label>
                              <Form.Control
                                type="text"
                                value={systemSettings.hospitalName}
                                onChange={(e) => setSystemSettings({...systemSettings, hospitalName: e.target.value})}
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                <FaKey className="me-1" />
                                JWT Secret Key
                              </Form.Label>
                              <Form.Control
                                type="password"
                                value={systemSettings.jwtSecret}
                                onChange={(e) => setSystemSettings({...systemSettings, jwtSecret: e.target.value})}
                                placeholder="กำหนดคีย์สำหรับเข้ารหัส JWT"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Session Timeout (ชั่วโมง)</Form.Label>
                              <Form.Control
                                type="number"
                                value={systemSettings.sessionTimeout}
                                onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: e.target.value})}
                                min="1"
                                max="168"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={6}>
                            <Form.Check
                              type="switch"
                              id="allowRegistration"
                              label="อนุญาตให้สมัครสมาชิกได้"
                              checked={systemSettings.allowRegistration}
                              onChange={(e) => setSystemSettings({...systemSettings, allowRegistration: e.target.checked})}
                              className="mb-3"
                            />
                          </Col>
                          <Col md={6}>
                            <Form.Check
                              type="switch"
                              id="maintenanceMode"
                              label="โหมดปิดปรับปรุงระบบ"
                              checked={systemSettings.maintenanceMode}
                              onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
                              className="mb-3"
                            />
                          </Col>
                        </Row>

                        <Button 
                          variant="success" 
                          onClick={saveSystemSettings}
                          disabled={loading}
                        >
                          <FaCheck className="me-1" />
                          บันทึกการตั้งค่า
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  <Card>
                    <Card.Header>
                      <h6 className="mb-0">
                        <FaInfoCircle className="me-1" />
                        ข้อมูลระบบ
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-2">
                        <small className="text-muted">เวอร์ชั่น:</small>
                        <div>1.0.0</div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Database:</small>
                        <div>PostgreSQL</div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Framework:</small>
                        <div>Next.js</div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">สถานะ:</small>
                        <div>
                          <Badge bg="success">Online</Badge>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Container>

        {/* Admin Details Modal */}
        <Modal show={showAdminModal} onHide={() => setShowAdminModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              <FaUser className="me-2" />
              รายละเอียด Admin
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedAdmin && (
              <Row>
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h6 className="mb-0">ข้อมูลทั่วไป</h6>
                    </Card.Header>
                    <Card.Body>
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td><strong>Username:</strong></td>
                            <td>{selectedAdmin.username}</td>
                          </tr>
                          <tr>
                            <td><strong>Email:</strong></td>
                            <td>{selectedAdmin.email}</td>
                          </tr>
                          <tr>
                            <td><strong>ชื่อ-นามสกุล:</strong></td>
                            <td>{selectedAdmin.fullname}</td>
                          </tr>
                          <tr>
                            <td><strong>บทบาท:</strong></td>
                            <td>
                              <Badge bg={selectedAdmin.role === 'super_admin' ? 'warning' : 'info'}>
                                {selectedAdmin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                              </Badge>
                            </td>
                          </tr>
                          <tr>
                            <td><strong>สถานะ:</strong></td>
                            <td>
                              <Badge bg={selectedAdmin.is_active ? 'success' : 'secondary'}>
                                {selectedAdmin.is_active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                              </Badge>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h6 className="mb-0">ข้อมูลการใช้งาน</h6>
                    </Card.Header>
                    <Card.Body>
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td><strong>วันที่สร้าง:</strong></td>
                            <td>{selectedAdmin.created_at}</td>
                          </tr>
                          <tr>
                            <td><strong>อัปเดตล่าสุด:</strong></td>
                            <td>{selectedAdmin.last_activity}</td>
                          </tr>
                          <tr>
                            <td><strong>ID:</strong></td>
                            <td>#{selectedAdmin.admin_id}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAdminModal(false)}>
              ปิด
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      <style jsx>{`
        .min-vh-100 {
          min-height: 100vh;
        }
        .sticky-top {
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        /* เพิ่มสไตล์สำหรับ responsive */
        @media (max-width: 576px) {
          .d-none.d-sm-inline {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}