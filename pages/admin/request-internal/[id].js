import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import Head from 'next/head';
import { useRouter } from 'next/router';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaArrowLeft, FaEdit, FaLock } from 'react-icons/fa'; // เพิ่ม FaLock

export default function InternalRequestDetail() {
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [approver, setApprover] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // เพิ่ม state สำหรับ user role
  const [userRole, setUserRole] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  
  const router = useRouter();
  const { id } = router.query;
  
  // เพิ่มฟังก์ชันตรวจสอบสิทธิ์
  const canEditDelete = () => {
    return userRole === 'admin' || userRole === 'super_admin';
  };
  
  useEffect(() => {
    // ดึงข้อมูลผู้ใช้จาก localStorage
    const adminData = localStorage.getItem('adminData');
    if (adminData) {
      const parsedData = JSON.parse(adminData);
      setUserRole(parsedData.role || '');
      setUserInfo(parsedData);
    }

    if (id) {
      fetchRequestDetails();
    }
  }, [id]);
  
  const fetchRequestDetails = async () => {
    try {
      const response = await fetch(`/api/admin/get-internal-request-details?id=${id}`);
      const data = await response.json();
      
      if (data.success && data.request) {
        setRequest(data.request);
        setStatus(data.request.status || 'pending');
        setComment(data.request.status_comment || '');
        setApprover(data.request.approver || ''); // ตั้งค่า approver ตามข้อมูลที่ดึงมา
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
  
  const updateRequestStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    // ตรวจสอบว่าได้เลือกผู้อนุมัติหรือไม่เมื่อสถานะเป็นอนุมัติหรือปฏิเสธ
    if ((status === 'approved' || status === 'rejected') && !approver) {
      setError('กรุณาเลือกผู้อนุมัติเมื่อต้องการอนุมัติหรือปฏิเสธคำขอ');
      setUpdating(false);
      return;
    }
    
    try {
      const res = await fetch('/api/admin/update-request-status', {
        method: 'PUT', // หรือ 'POST' ขึ้นอยู่กับการตั้งค่า API ของคุณ
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: id,
          status,
          comment,
          approver, // เพิ่มค่าผู้อนุมัติ
          type: 'internal' // ระบุประเภทเป็น internal
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setUpdateSuccess(true);
        fetchRequestDetails(); // ดึงข้อมูลใหม่หลังอัปเดต
        
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      } else {
        setError(data.message || 'ไม่สามารถอัปเดตสถานะได้');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setUpdating(false);
    }
  };
  
  // แปลงรูปแบบวันที่
  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุวันที่';
    
    try {
      return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date format error:', error);
      return 'ไม่ระบุวันที่';
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">รออนุมัติ</Badge>;
      case 'approved':
        return <Badge bg="success">อนุมัติแล้ว</Badge>;
      case 'rejected':
        return <Badge bg="danger">ปฏิเสธ</Badge>;
      default:
        return <Badge bg="secondary">{status || 'ไม่ระบุ'}</Badge>;
    }
  };
  
  const handleEdit = () => {
    if (!canEditDelete()) {
      // แสดงข้อความเตือนถ้าไม่มีสิทธิ์
      Alert.warning('ไม่มีสิทธิ์แก้ไข', 'เฉพาะ Admin เท่านั้นที่สามารถแก้ไขข้อมูลได้');
      return;
    }
    router.push(`/admin/internal-edit/${id}`);
  };
  
  const handleBack = () => {
    router.back();
  };
  
  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">กำลังโหลดข้อมูล...</p>
      </Container>
    );
  }
  
  if (error || !request) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error || 'ไม่พบข้อมูลคำขอ'}</Alert>
        <Button variant="secondary" onClick={handleBack}>
          <FaArrowLeft className="me-2" /> ย้อนกลับ
        </Button>
      </Container>
    );
  }
  
  return (
    <>
      <Head>
        <title>รายละเอียดคำขอภายใน - {id}</title>
      </Head>
      <Container className="py-4">
        {updateSuccess && (
          <Alert variant="success" className="mb-3">
            อัปเดตสถานะเรียบร้อยแล้ว
          </Alert>
        )}

        {/* แสดงข้อความแจ้งเตือนสำหรับ approver */}
        {userRole === 'approver' && (
          <Alert variant="info" className="mb-3 d-flex align-items-center">
            <FaLock className="me-2" />
            <div>
              <strong>สิทธิ์ Approver:</strong> คุณสามารถดูรายละเอียดได้ แต่ไม่สามารถแก้ไขข้อมูลได้ (เฉพาะ Admin เท่านั้น)
            </div>
          </Alert>
        )}

        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">รายละเอียดคำขอภายใน: {id}</h4>
                  <div>
                    <Button 
                      variant="outline-light" 
                      className="me-2"
                      onClick={handleBack}
                    >
                      <FaArrowLeft className="me-1" /> ย้อนกลับ
                    </Button>
                    
                    {/* ปุ่มแก้ไขที่ตรวจสอบสิทธิ์ */}
                    {canEditDelete() ? (
                      <Button 
                        variant="warning"
                        onClick={handleEdit}
                        title="แก้ไขข้อมูล"
                      >
                        <FaEdit className="me-1" /> แก้ไข
                      </Button>
                    ) : (
                      <Button 
                        variant="secondary"
                        disabled
                        title="ไม่มีสิทธิ์แก้ไข (เฉพาะ Admin เท่านั้น)"
                      >
                        <FaLock className="me-1" /> ล็อค
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Header>
              
              {/* แสดงข้อมูลผู้ใช้ปัจจุบัน */}
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                  <div className="small text-muted">
                    <strong>ผู้ดู:</strong> {userInfo?.fullName || userInfo?.username || 'ไม่ระบุ'} 
                    ({userRole === 'admin' ? 'ผู้ดูแลระบบ' : userRole === 'approver' ? 'ผู้อนุมัติ' : 'ผู้ใช้'})
                  </div>
                  <div className="small text-muted">
                    <strong>สิทธิ์:</strong> 
                    {canEditDelete() ? (
                      <span className="text-success">แก้ไขได้</span>
                    ) : (
                      <span className="text-warning">ดูอย่างเดียว</span>
                    )}
                  </div>
                </div>

                <Row className="mb-4">
                  <Col md={6}>
                    <h5 className="border-bottom pb-2 mb-3">ข้อมูลพนักงาน</h5>
                    <Table bordered>
                      <tbody>
                        <tr>
                          <th style={{width: '35%'}}>รหัสพนักงาน</th>
                          <td>{request.employee_id || 'ไม่ระบุ'}</td>
                        </tr>
                        <tr>
                          <th>ชื่อ-นามสกุล</th>
                          <td>{`${request.first_name || ''} ${request.last_name || ''}`}</td>
                        </tr>
                        <tr>
                          <th>แผนก</th>
                          <td>{request.dept_name_th || 'ไม่ระบุ'}</td>
                        </tr>
                        <tr>
                          <th>เบอร์โทรศัพท์</th>
                          <td>{request.phone || 'ไม่ระบุ'}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                  <Col md={6}>
                    <h5 className="border-bottom pb-2 mb-3">รายละเอียดคำขอ</h5>
                    <Table bordered>
                      <tbody>
                        <tr>
                          <th style={{width: '35%'}}>วันที่ร้องขอ</th>
                          <td>{formatDate(request.request_date)}</td>
                        </tr>
                        <tr>
                          <th>วันที่ต้องการเข้าพื้นที่</th>
                          <td>{formatDate(request.visit_date)}</td>
                        </tr>
                        <tr>
                          <th>เวลา</th>
                          <td>{`${request.visit_time_start || '00:00'} - ${request.visit_time_end || '00:00'}`}</td>
                        </tr>
                        <tr>
                          <th>สถานะ</th>
                          <td>{getStatusBadge(request.status)}</td>
                        </tr>
                        {/* แสดงข้อมูลผู้อนุมัติถ้ามี */}
                        {request.approver && (
                          <tr>
                            <th>ผู้อนุมัติ</th>
                            <td>{request.approver}</td>
                          </tr>
                        )}
                        {request.approve_date && (
                          <tr>
                            <th>วันที่อนุมัติ</th>
                            <td>{formatDate(request.approve_date)}</td>
                          </tr>
                        )}
                        {request.reject_reason && (
                          <tr>
                            <th>เหตุผลการปฏิเสธ</th>
                            <td className="text-danger">{request.reject_reason}</td>
                          </tr>
                        )}
                        <tr>
                          <th>พื้นที่ควบคุม</th>
                          <td>
                            {request.data_center && <div>ศูนย์ข้อมูล (Data Center)</div>}
                            {request.support_room && (
                              <div>
                                ห้องระบบสนับสนุน
                                {request.support_room_details && <div><small>({request.support_room_details})</small></div>}
                              </div>
                            )}
                            {!request.data_center && !request.support_room && 'ไม่ระบุ'}
                          </td>
                        </tr>
                        <tr>
                          <th>วัตถุประสงค์</th>
                          <td>{request.purpose || 'ไม่ระบุ'}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>
                <h5 className="border-bottom pb-2 mb-3">รายชื่อผู้เข้าพื้นที่</h5>
                <Table bordered>
                  <thead>
                    <tr className="bg-light text-center">
                      <th style={{width: '10%'}}>#</th>
                      <th>ชื่อ-นามสกุล</th>
                      <th>ตำแหน่ง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.visitors && request.visitors.length > 0 ? (
                      request.visitors.map((visitor, index) => (
                        <tr key={index}>
                          <td className="text-center">{index + 1}</td>
                          <td>{visitor.name}</td>
                          <td>{visitor.position}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">ไม่พบข้อมูลผู้เข้าพื้นที่</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                {request.import_export_option === 'importAccess' && (
                  <>
                    <h5 className="border-bottom pb-2 mb-3">อุปกรณ์เข้าพื้นที่</h5>
                    <Table bordered>
                      <thead>
                        <tr className="bg-light text-center">
                          <th style={{width: '10%'}}>#</th>
                          <th>รายการ</th>
                          <th style={{width: '15%'}}>จำนวนนำเข้า</th>
                          <th style={{width: '15%'}}>จำนวนนำออก</th>
                        </tr>
                      </thead>
                      <tbody>
                        {request.equipment && request.equipment.length > 0 ? (
                          request.equipment.map((item, index) => (
                            <tr key={index}>
                              <td className="text-center">{index + 1}</td>
                              <td>{item.name}</td>
                              <td className="text-center">{item.import_quantity}</td>
                              <td className="text-center">{item.export_quantity}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">ไม่พบข้อมูลอุปกรณ์</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}