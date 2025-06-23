import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import Head from 'next/head';
import EmployeeInfoSection from '../../../components/internal-form/EmployeeInfoSection';
import RequestDetailsSection from '../../../components/internal-form/RequestDetailsSection';
import 'bootstrap/dist/css/bootstrap.min.css';

function formatDateToISO(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function InternalRequestEdit() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validated, setValidated] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    department: '',
    phone: '',
    requestDate: new Date().toISOString().split('T')[0],
    visitDate: '',
    visitTimeStart: '',
    visitTimeEnd: '',
    dataCenter: false,
    supportRoom: false,
    supportRoomDetails: '',
    purpose: '',
    coordinator: '',
    coordinatorFullname: '',
    rank: '',
    visitors: [{ name: '', position: '' }],
    importExportOption: 'nonImportAccess',
    equipment: [{ name: '', importQuantity: 0, exportQuantity: 0 }]
  });
  
  // ดึงข้อมูลคำขอเมื่อโหลดหน้า
  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
  }, [id]);
  
  // ฟังก์ชันสำหรับดึงข้อมูลคำขอ
  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/get-internal-request-details?id=${id}`);
      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลได้');
      }
      
      const data = await response.json();
      
      if (data.success && data.request) {
        const request = data.request;
        
        console.log("Original values from API:", {
          dataCenter: request.data_center,
          supportRoom: request.support_room,
          type: {
            dataCenter: typeof request.data_center,
            supportRoom: typeof request.support_room
          }
        });
        
        // แปลงข้อมูลจาก API เป็นรูปแบบที่ฟอร์มใช้
        setFormData({
          employeeId: request.employee_id || '',
          firstName: request.first_name || '',
          lastName: request.last_name || '',
          department: request.dept_name_th || '',
          phone: request.phone || '',
          requestDate: request.request_date ? formatDateToISO(request.request_date) : formatDateToISO(new Date()),
          visitDate: request.visit_date ? formatDateToISO(request.visit_date) : '',
          visitTimeStart: request.visit_time_start || '',
          visitTimeEnd: request.visit_time_end || '',
          dataCenter: Boolean(request.data_center),
          supportRoom: Boolean(request.support_room),
          supportRoomDetails: request.support_room_details || '',
          purpose: request.purpose || '',
          coordinator: request.coordinator_username || '', // ใช้ username เป็น value สำหรับ dropdown
          coordinatorFullname: request.coordinator_fullname || '', // เก็บ fullname แยกต่างหาก
          rank: request.coordinator_dept_name_th || request.coordinator_position || '',
          visitors: Array.isArray(request.visitors) && request.visitors.length > 0 
            ? request.visitors.map(v => ({ name: v.name || '',lastname:v.lastname || '', position: v.position || '' }))
            : [{ name: '', position: '' }],
          importExportOption: request.import_export_option || 'nonImportAccess',
          equipment: Array.isArray(request.equipment) && request.equipment.length > 0
            ? request.equipment.map(e => ({ 
                name: e.name || '', 
                importQuantity: e.import_quantity || 0,
                exportQuantity: e.export_quantity || 0
              }))
            : [{ name: '', importQuantity: 0, exportQuantity: 0 }]
        });
      } else {
        setError('ไม่พบข้อมูลคำขอ');
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };
  
  // จัดการการเปลี่ยนแปลงค่าในฟอร์ม
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prevState => {
      // ถ้าเป็นข้อมูล array เช่น visitors หรือ equipment
      if (name === 'visitors' || name === 'equipment') {
        // ตรวจสอบว่า value เป็น array หรือไม่
        if (Array.isArray(value)) {
          return { ...prevState, [name]: value };
        } else {
          console.error(`Value for ${name} is not an array:`, value);
          // ถ้าไม่ใช่ array ให้เก็บค่าเดิมไว้
          return prevState;
        }
      }
      
      // สำหรับค่าปกติ
      return {
        ...prevState,
        [name]: type === 'checkbox' ? checked : value
      };
    });
  };
  
  // ฟังก์ชันบันทึกข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // ตรวจสอบข้อมูลก่อนส่ง
      const dataToSend = {
        requestId: id,
        ...formData,
        // ป้องกันกรณี array เป็น undefined
        visitors: Array.isArray(formData.visitors) ? formData.visitors : [],
        equipment: Array.isArray(formData.equipment) ? formData.equipment : []
      };
      
      console.log('Sending data:', dataToSend);
      
      const response = await fetch('/api/admin/update-internal-request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        
        // แสดงข้อความสำเร็จก่อนกลับไปยังหน้า dashboard
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000);
      } else {
        setError(result.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </Spinner>
        <p className="mt-2">กำลังโหลดข้อมูล...</p>
      </Container>
    );
  }
  
  return (
    <>
      <Head>
        <title>แก้ไขคำขอภายใน - {id}</title>
      </Head>
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={10}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-warning text-dark">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">แก้ไขคำขอภายในหมายเลข: {id}</h4>
                  <Button 
                    variant="outline-dark" 
                    size="sm"
                    onClick={() => router.back()}
                  >
                    &larr; ย้อนกลับ
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}
                
                {success && (
                  <Alert variant="success" className="mb-4">
                    บันทึกข้อมูลเรียบร้อยแล้ว กำลังกลับไปยังหน้าจัดการ...
                  </Alert>
                )}
                
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                  <h5 className="mb-3 border-bottom pb-2">ข้อมูลพนักงาน</h5>
                  <EmployeeInfoSection 
                    formData={formData}
                    handleInputChange={handleInputChange}
                    validated={validated}
                  />
                  
                  <h5 className="mb-3 mt-4 border-bottom pb-2">รายละเอียดคำขอ</h5>
                  <RequestDetailsSection 
                    formData={formData}
                    handleInputChange={handleInputChange}
                    validated={validated}
                  />
                  
                  <div className="d-flex justify-content-between mt-4">
                    <Button 
                      variant="outline-secondary"
                      onClick={() => router.back()}
                    >
                      ยกเลิก
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="w-50"
                      disabled={saving || formData.status === 'pending'}
                    >
                      {saving ? 'กำลังอัปเดต...' : 'บันทึกการเปลี่ยนแปลง'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}