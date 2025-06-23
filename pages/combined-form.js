import { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Accordion, Alert, ButtonGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';
import Link from 'next/link';

// Import components for internal form
import EmployeeInfoInternal from '../components/internal-form/EmployeeInfoSection';
import RequestDetailsInternal from '../components/internal-form/RequestDetailsSection';

// Import components for external form
import EmployeeInfoExternal from '../components/external-form/EmployeeExternal';
import RequestDetailsExternal from '../components/external-form/RequestExternal';

export default function CombinedForm() {
  // สร้างวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // State สำหรับเลือกประเภทฟอร์ม (internal หรือ external)
  const [formType, setFormType] = useState('internal');

  const [formData, setFormData] = useState({
    // ข้อมูลทั่วไป
    employeeId: '',
    firstName: '',
    lastName: '',
    fullName: '',
    position: '',
    department: '',
    dept_name_th: '',
    phone: '',
    company: '',
    email: '',
    
    // รายละเอียดคำขอ
    requestType: '',
    details: '',
    requestDate: today,
    visitDate: today,
    visitTimeStart: '',
    visitTimeEnd: '',
    dataCenter: false,
    supportRoom: false,
    supportRoomDetails: '',
    purpose: '',
    coordinator: '', 
    coordinatorFullName: '',
    coordinatorDept: '',
    importExportOption: 'nonImportAccess',
    
    // arrays - ต้องรีเซ็ตเป็น array ว่างหรือมีค่าเริ่มต้น
    visitors: [{ name: '', position: '' }],
    equipment: [{ name: '', importQuantity: 0, exportQuantity: 0 }]
  });

  const [activeKey, setActiveKey] = useState('0');
  const [validated, setValidated] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [formErrors, setFormErrors] = useState([]);

  // รีเซ็ตฟอร์มเมื่อเปลี่ยนประเภทฟอร์ม
  useEffect(() => {
    // รีเซ็ตค่าฟอร์มเมื่อมีการเปลี่ยนประเภทฟอร์ม
    setFormData({
      // ข้อมูลทั่วไป
      employeeId: '',
      firstName: '',
      lastName: '',
      fullName: '',
      position: '',
      department: '',
      dept_name_th: '',
      phone: '',
      company: '',
      email: '',
      
      // รายละเอียดคำขอ
      requestType: '',
      details: '',
      requestDate: today,
      visitDate: today,
      visitTimeStart: '',
      visitTimeEnd: '',
      dataCenter: false,
      supportRoom: false,
      supportRoomDetails: '',
      purpose: '',
      coordinator: '', 
      coordinatorFullName: '',
      coordinatorDept: '',
      importExportOption: 'nonImportAccess',
      
      // arrays 
      visitors: [{ name: '', position: '' }],
      equipment: [{ name: '', importQuantity: 0, exportQuantity: 0 }]
    });
    setValidated(false);
    setActiveKey('0');
    setShowErrorAlert(false);
    setFormErrors([]);
  }, [formType, today]);

  // Modified handleInputChange with debugging
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Setting ${name} to:`, value);
    
    setFormData(prevData => {
      const newData = {
        ...prevData,
        [name]: value
      };
      console.log('Updated formData:', newData);
      return newData;
    });
  };

  // Function to check if a specific section has errors
  const sectionHasErrors = (sectionNumber) => {
    const form = document.querySelector('form');
    if (!form) return false;
    
    let invalidInputs;
    
    if (sectionNumber === 1) {
      invalidInputs = form.querySelectorAll('[data-section="1"] .form-control:invalid, [data-section="1"] .form-select:invalid, [data-section="1"] .form-check-input:required:invalid');
    } else if (sectionNumber === 2) {
      invalidInputs = form.querySelectorAll('[data-section="2"] .form-control:invalid, [data-section="2"] .form-select:invalid, [data-section="2"] .form-check-input:required:invalid');
    }
    
    return invalidInputs && invalidInputs.length > 0;
  };

  // Collect error messages from invalid fields
  const collectFormErrors = () => {
    const form = document.querySelector('form');
    if (!form) return [];
    
    const invalidInputs = form.querySelectorAll('.form-control:invalid, .form-select:invalid, .form-check-input:required:invalid');
    const errors = [];
    
    invalidInputs.forEach(input => {
      const label = input.closest('.form-group')?.querySelector('.form-label')?.textContent;
      if (label) {
        errors.push(`กรุณากรอก${label.replace(':', '')}`);
      }
    });
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบว่าทุกรายการอุปกรณ์มีจำนวนนำเข้ามากกว่า 0 หรือไม่
    const hasInvalidImport = formData.importExportOption === 'importAccess' && 
      formData.equipment.some(item => item.importQuantity <= 0);
    
    if (hasInvalidImport) {
      setValidated(true); // ทำให้แสดง validation message
      return; // ไม่ส่งแบบฟอร์มถ้าไม่ผ่านการตรวจสอบ
    }
    
    const form = e.currentTarget;
    setValidated(true);
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      
      // Collect error messages
      const errors = collectFormErrors();
      setFormErrors(errors);
      setShowErrorAlert(true);
      
      // Open the first section with errors
      if (sectionHasErrors(1)) {
        setActiveKey('0');
      } else if (sectionHasErrors(2)) {
        setActiveKey('1');
      }
      
      // Scroll to the first error
      const firstInvalid = form.querySelector('.form-control:invalid, .form-select:invalid, .form-check-input:required:invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus({ preventScroll: true });
      }
      
      return;
    }
    
    console.log('Form submitted successfully:', formData);
    
    try {
      // เลือก API endpoint ตามประเภทฟอร์ม
      const apiEndpoint = formType === 'internal' ? '/api/submit-form' : '/api/submit-external-form';
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({...formData, type_form: formType}),
      });
      
      if (response.ok) {
        // แสดง SweetAlert2 เมื่อบันทึกสำเร็จ
        Swal.fire({
          icon: 'success',
          title: 'บันทึกข้อมูลสำเร็จ!',
          text: 'แบบฟอร์มของคุณถูกส่งเรียบร้อยแล้ว',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#28a745',
        }).then((result) => {
          if (result.isConfirmed) {
            // สร้างวันที่ปัจจุบันอีกครั้ง
            const today = new Date().toISOString().split('T')[0];
            
            // reset form
            setFormData({
              // ข้อมูลทั่วไป
              employeeId: '',
              firstName: '',
              lastName: '',
              fullName: '',
              position: '',
              department: '',
              dept_name_th: '',
              phone: '',
              company: '',
              email: '',
              
              // รายละเอียดคำขอ
              requestType: '',
              details: '',
              requestDate: today,
              visitDate: today,
              visitTimeStart: '',
              visitTimeEnd: '',
              dataCenter: false,
              supportRoom: false,
              supportRoomDetails: '',
              purpose: '',
              coordinator: '',
              coordinatorFullName: '',
              coordinatorDept: '',
              importExportOption: 'nonImportAccess',
              
              // arrays
              visitors: [{ name: '', position: '' }],
              equipment: [{ name: '', importQuantity: 0, exportQuantity: 0 }]
            });
            
            // รีเซ็ต state อื่นๆ
            setValidated(false);
            setActiveKey('0');
            window.scrollTo(0, 0);
            setShowErrorAlert(false);
            setFormErrors([]);
          }
        });
      } else {
        // ดึงข้อมูล error
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด!',
          text: errorData.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดการเชื่อมต่อ!',
        text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  // Function to handle accordion selection
  const handleAccordionSelect = (eventKey) => {
    setActiveKey(eventKey);
  };

  return (
    <Container className="py-4">
      {/* ปุ่มย้อนกลับ */}
      <div className="mb-3">
        <Link href="/" passHref>
          <Button variant="outline-primary">
            &larr; กลับไปหน้าหลัก
          </Button>
        </Link>
      </div>
      
      {/* ส่วนเลือกประเภทฟอร์ม */}
      <Card className="shadow mb-4">
        <Card.Header className="bg-secondary text-white">
          <h4 className="mb-0">เลือกประเภทแบบฟอร์ม</h4>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-center">
            <ButtonGroup className="mb-3">
              <Button 
                variant={formType === 'internal' ? 'primary' : 'outline-primary'} 
                onClick={() => setFormType('internal')}
                className="px-4"
              >
                <i className="fas fa-user-tie me-2"></i>
                สำหรับบุคลากรภายใน
              </Button>
              <Button 
                variant={formType === 'external' ? 'danger' : 'outline-danger'} 
                onClick={() => setFormType('external')}
                className="px-4"
              >
                <i className="fas fa-user me-2"></i>
                สำหรับบุคคลภายนอก
              </Button>
            </ButtonGroup>
          </div>
        </Card.Body>
      </Card>
      
      {/* ส่วนแบบฟอร์มหลัก */}
      <Card className="shadow">
        <Card.Header className={`${formType === 'internal' ? 'bg-primary' : 'bg-danger'} text-white`}>
          <h4 className="mb-0">
            {formType === 'internal' ? 'แบบฟอร์มสำหรับบุคลากรภายใน' : 'แบบฟอร์มสำหรับบุคคลภายนอก'}
          </h4>
        </Card.Header>
        <Card.Body>
          {showErrorAlert && (
            <Alert variant="danger" onClose={() => setShowErrorAlert(false)} dismissible>
              <Alert.Heading>กรุณาตรวจสอบข้อมูล</Alert.Heading>
              <ul>
                {formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Accordion activeKey={activeKey} onSelect={handleAccordionSelect}>
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <span className="text-primary" style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    <i className="fas fa-user-circle me-2"></i>
                    ส่วนที่ 1: ข้อมูล{formType === 'internal' ? 'พนักงาน' : 'บุคคลภายนอก'}
                  </span>
                </Accordion.Header>
                <Accordion.Body data-section="1">
                  {formType === 'internal' ? (
                    <EmployeeInfoInternal
                      formData={formData}
                      handleInputChange={handleInputChange}
                      validated={validated}
                    />
                  ) : (
                    <EmployeeInfoExternal
                      formData={formData}
                      handleInputChange={handleInputChange}
                      validated={validated}
                    />
                  )}
                  <div className="text-end mt-3">
                    <Button variant="primary" onClick={() => setActiveKey('1')}>
                      ถัดไป
                    </Button>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
              
              <Accordion.Item eventKey="1">
                <Accordion.Header>
                  <span className="text-success" style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    <i className="fas fa-file-alt me-2"></i>
                    ส่วนที่ 2: รายละเอียดคำขอ
                  </span>
                </Accordion.Header>
                <Accordion.Body data-section="2">
                  {formType === 'internal' ? (
                    <RequestDetailsInternal
                      formData={formData}
                      handleInputChange={handleInputChange}
                      validated={validated}
                    />
                  ) : (
                    <RequestDetailsExternal
                      formData={formData}
                      handleInputChange={handleInputChange}
                      validated={validated}
                    />
                  )}
                  <div className="d-flex justify-content-between mt-3">
                    <Button variant="secondary" onClick={() => setActiveKey('0')}>
                      ย้อนกลับ
                    </Button>
                    <Button variant={formType === 'internal' ? 'success' : 'danger'} type="submit">
                      ส่งแบบฟอร์ม
                    </Button>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}