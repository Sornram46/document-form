import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import Head from 'next/head';
import { useRouter } from 'next/router';
import EmployeeInfoSection from '../../../components/external-form/EmployeeExternal';
import RequestDetailsSection from '../../../components/external-form/RequestExternal';

function formatDateToISO(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ExternalRequestEdit() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    branch: '',
    coordinatorName: '',
    coordinatorPhone: '',
    coordinatorEmail: '',
    requestDate: new Date().toISOString().split('T')[0],
    visitDate: '',
    visitTimeStart: '',
    visitTimeEnd: '',
    dataCenter: false,
    supportRoom: false,
    supportRoomDetails: '',
    purpose: '',
    visitors: [{ name: '', position: '' }],
    importExportOption: 'nonImportAccess',
    equipment: [{ name: '', importQuantity: 0, exportQuantity: 0 }]
  });
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(''); // เพิ่ม state สำหรับสถานะ
  
  const router = useRouter();
  const { id } = router.query;
  
  useEffect(() => {
    if (id) {
      console.log('Fetching request details for ID:', id);
      fetchRequestDetails();
    }
  }, [id]);
  
  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/get-external-request-details?id=${id}`);
      
      if (!response.ok) {
        throw new Error(`ไม่สามารถดึงข้อมูลได้: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      if (data.success && data.request) {
        const request = data.request;
        console.log('Processing request data:', request);
        
        // แปลงข้อมูลจาก API เป็นรูปแบบที่ฟอร์มใช้
        setFormData({
          firstName: request.first_name || '',
          lastName: request.last_name || '',
          company: request.company_name || request.company || '',
          phone: request.phone_num || request.phone || '',
          
          branch: request.branch || '',
          coordinator: request.coordinator_username || '', // ใช้ username เป็น value สำหรับ dropdown
          coordinatorFullname: request.coordinator_fullname || '',
          rank: request.coordinator_dept_name_th || request.coordinator_position || '',
          requestDate: request.request_date ? formatDateToISO(request.request_date) : formatDateToISO(new Date()),
          visitDate: request.visit_date ? formatDateToISO(request.visit_date) : '',
          visitTimeStart: request.visit_time_start || '',
          visitTimeEnd: request.visit_time_end || '',
          dataCenter: Boolean(request.data_center),
          supportRoom: Boolean(request.support_room),
          supportRoomDetails: request.support_room_details || '',
          purpose: request.purpose || '',
          visitors: Array.isArray(request.visitors) && request.visitors.length > 0 
            ? request.visitors.map(v => ({ name: v.name || '', position: v.position || '' }))
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
        console.log('Form data set successfully');
        console.log('Import/Export Option:', request.import_export_option);
        console.log('Equipment data:', request.equipment);
      } else {
        console.error('API returned success=false or no request data:', data);
        setError('ไม่พบข้อมูลคำขอ');
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      setError(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    console.log('Current formData:', {
      importExportOption: formData.importExportOption,
      equipment: formData.equipment
    });
  }, [formData.importExportOption, formData.equipment]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prevState => {
      if (name === 'visitors' || name === 'equipment') {
        return { ...prevState, [name]: value };
      }
      
      return {
        ...prevState,
        [name]: type === 'checkbox' ? checked : value
      };
    });
  };
  
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
      
      console.log('Sending data to API:', dataToSend);
      
      const response = await fetch('/api/admin/update-external-request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const result = await response.json();
      console.log('API response:', result);
      
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
      setError(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">กำลังโหลดข้อมูล...</p>
      </Container>
    );
  }
  
  return (
    <>
      <Head>
        <title>แก้ไขคำขอภายนอก - {id}</title>
      </Head>
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={10}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">แก้ไขคำขอภายนอกหมายเลข: {id}</h4>
                  <Button 
                    variant="outline-light" 
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
                  <h5 className="mb-3 border-bottom pb-2">ข้อมูลผู้เยี่ยมชม</h5>
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
                      disabled={saving || status === 'pending'}
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