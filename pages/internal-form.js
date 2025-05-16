import { useState } from 'react';
import { Form, Button, Card, Container, Accordion, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2'; // Import SweetAlert2
import Link from 'next/link';
import EmployeeInfoSection from '../components/internal-form/EmployeeInfoSection';
import RequestDetailsSection from '../components/internal-form/RequestDetailsSection';


export default function InternalForm() {
  // สร้างวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    // Employee Info
    employeeId: '',
    fullName: '',
    position: '',
    department: '',
    dept_name_th: '',
    // Request Details
    requestType: '',
    details: '',
    requestDate: today, // ตั้งค่าเริ่มต้นของ requestDate เป็นวันที่ปัจจุบัน
    visitDate: today,   // ตั้งค่าเริ่มต้นของ visitDate เป็นวันที่ปัจจุบัน
    importExportOption: ''
    // Removed Approval Info
  });

  const [activeKey, setActiveKey] = useState('0'); 
  const [validated, setValidated] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [formErrors, setFormErrors] = useState([]);

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
    
    // Get all invalid inputs in the form
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
      // ส่งข้อมูลไปยัง API
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
            // สร้างวันที่ปัจจุบันอีกครั้ง เพื่อให้แน่ใจว่าเป็นวันที่ปัจจุบันจริงๆ
            const today = new Date().toISOString().split('T')[0];
            
            // reset form ให้ถูกต้องและครบถ้วน
            setFormData({
              // ข้อมูลพนักงาน
              employeeId: '',
              firstName: '',
              lastName: '', // แก้ไขจาก lastNmae เป็น lastName
              fullName: '',
              position: '',
              department: '',
              dept_name_th: '',
              phone: '',
              
              // รายละเอียดคำขอ
              requestDate: today,
              visitDate: today,
              visitTimeStart: '',
              visitTimeEnd: '',
              dataCenter: false,
              supportRoom: false,
              supportRoomDetails: '',
              purpose: '',
              coordinator: '',
              coordinatorFullname: '',
              coordinatorDept: '',
              rank: '',
              
              // รายการอื่นๆ
              requestType: '',
              details: '',
              importExportOption: false, // กำหนดเพียงครั้งเดียว
              
              // arrays
              visitors: [{ name: '', position: '' }],
              equipment: [{ name: '', importQuantity: 0, exportQuantity: 0 }]
            });
            
            // รีเซ็ตการตรวจสอบและกลับไปยังส่วนแรกของฟอร์ม
            setValidated(false);
            setActiveKey('0');
            
            // เลื่อนไปด้านบนของหน้า
            window.scrollTo(0, 0);
            
            // เคลียร์ข้อความแจ้งเตือนต่างๆ
            setShowErrorAlert(false);
            setFormErrors([]);
          }
        });
      } else {
        // ดึงข้อมูล error และแสดงผ่าน SweetAlert2
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
      // แสดง SweetAlert2 สำหรับ network error
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
      {/* เพิ่มปุ่มย้อนกลับที่ด้านบนของฟอร์ม */}
      <div className="mb-3">
        <Link href="/general-page/request-permission" passHref>
          <Button variant="outline-primary">
            &larr; กลับไปหน้าหลัก
          </Button>
        </Link>
      </div>
      
      <Card className="shadow">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">แบบฟอร์มสำหรับบุคลากรภายใน</h4>
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
                    ส่วนที่ 1: ข้อมูลพนักงาน
                  </span>
                </Accordion.Header>
                <Accordion.Body data-section="1">
                  <EmployeeInfoSection
                    formData={formData}
                    handleInputChange={handleInputChange}
                    validated={validated}
                  />
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
                  <RequestDetailsSection
                    formData={formData}
                    handleInputChange={handleInputChange}
                    validated={validated}
                  />
                  <div className="d-flex justify-content-between mt-3">
                    <Button variant="secondary" onClick={() => setActiveKey('0')}>
                      ย้อนกลับ
                    </Button>
                    <Button variant="success" type="submit">
                      ส่งแบบฟอร์ม
                    </Button>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
              
              {/* Removed Approval Section */}
            </Accordion>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
