import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Tabs, Tab, Badge, Form, InputGroup } from 'react-bootstrap';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaSearch, FaEdit, FaTrashAlt, FaPrint, FaFilter, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [externalRequests, setExternalRequests] = useState([]);
  const [internalRequests, setInternalRequests] = useState([]);
  const [filteredExternalRequests, setFilteredExternalRequests] = useState([]);
  const [filteredInternalRequests, setFilteredInternalRequests] = useState([]);
  const [key, setKey] = useState('external');
  const [searchFilters, setSearchFilters] = useState({
    documentNumber: '',
    name: '',
    dateFrom: '',
    dateTo: ''
  });
  const router = useRouter();
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  useEffect(() => {
    const filteredExternal = externalRequests.filter(request => {
      const matchDocNumber = !searchFilters.documentNumber || 
        (request.document_number && 
        request.document_number.toLowerCase().includes(searchFilters.documentNumber.toLowerCase()));
      
      const fullName = `${request.first_name || ''} ${request.last_name || ''}`.toLowerCase();
      const matchName = !searchFilters.name || fullName.includes(searchFilters.name.toLowerCase());
      
      let matchDate = true;
      if (request.visit_date) {
        const visitDate = new Date(request.visit_date);
        visitDate.setHours(0, 0, 0, 0);
        
        if (searchFilters.dateFrom) {
          const fromDate = new Date(searchFilters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (visitDate < fromDate) {
            matchDate = false;
          }
        }
        
        if (matchDate && searchFilters.dateTo) {
          const toDate = new Date(searchFilters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (visitDate > toDate) {
            matchDate = false;
          }
        }
      } else if (searchFilters.dateFrom || searchFilters.dateTo) {
        matchDate = false;
      }
      
      return matchDocNumber && matchName && matchDate;
    });
    
    setFilteredExternalRequests(filteredExternal);
    
    const filteredInternal = internalRequests.filter(request => {
      const matchDocNumber = !searchFilters.documentNumber || 
        (request.document_number && 
        request.document_number.toLowerCase().includes(searchFilters.documentNumber.toLowerCase()));
      
      const matchId = !searchFilters.name || 
        (request.employee_id && 
        request.employee_id.toString().toLowerCase().includes(searchFilters.name.toLowerCase()));
      
      let matchDate = true;
      if (request.visit_date) {
        const visitDate = new Date(request.visit_date);
        visitDate.setHours(0, 0, 0, 0);
        
        if (searchFilters.dateFrom) {
          const fromDate = new Date(searchFilters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (visitDate < fromDate) {
            matchDate = false;
          }
        }
        
        if (matchDate && searchFilters.dateTo) {
          const toDate = new Date(searchFilters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (visitDate > toDate) {
            matchDate = false;
          }
        }
      } else if (searchFilters.dateFrom || searchFilters.dateTo) {
        matchDate = false;
      }
      
      return matchDocNumber && matchId && matchDate;
    });
    
    setFilteredInternalRequests(filteredInternal);
  }, [searchFilters, externalRequests, internalRequests]);
  
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const externalRes = await fetch('/api/admin/get-external-requests');
      const externalData = await externalRes.json();
      
      if (externalData.success && externalData.requests) {
        setExternalRequests(externalData.requests);
        setFilteredExternalRequests(externalData.requests);
      } else {
        console.error('Failed to fetch external requests:', externalData.message);
      }
      
      const internalRes = await fetch('/api/admin/get-internal-requests');
      const internalData = await internalRes.json();
      
      if (internalData.success && internalData.requests) {
        setInternalRequests(internalData.requests);
        setFilteredInternalRequests(internalData.requests);
      } else {
        console.error('Failed to fetch internal requests:', internalData.message);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const clearSearch = () => {
    setSearchFilters({
      documentNumber: '',
      name: '',
      dateFrom: '',
      dateTo: ''
    });
  };
  
  const formatDate = (dateString) => {
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
  
  const handleLogout = async () => {
    router.push('/');
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning" className="w-50">รออนุมัติ</Badge>;
      case 'approved':
        return <Badge bg="success" className="w-60">อนุมัติแล้ว</Badge>;
      case 'rejected':
        return <Badge bg="danger" className="w-45">ปฏิเสธ</Badge>;
      default:
        return <Badge bg="secondary" className="w-45">{status || 'ไม่ระบุ'}</Badge>;
    }
  };

  const handleEdit = (id, type = 'internal') => {
    router.push(`/admin/${type}-edit/${id}`);
  };
  
  const handleExternalEdit = (id, type = 'external') => {
    router.push(`/admin/${type}-edit/${id}`);
  };
  
  const handleDelete = async (id, type = 'internal') => {
    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: "คุณต้องการลบคำขอนี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบคำขอ!',
      cancelButtonText: 'ยกเลิก'
    });
    
    if (result.isConfirmed) {
      try {
        const endpoint = type === 'external' 
          ? '/api/admin/delete-external-request' 
          : '/api/admin/delete-internal-request';
        
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requestId: id }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          await Swal.fire({
            title: 'สำเร็จ!',
            text: 'ลบข้อมูลเรียบร้อยแล้ว',
            icon: 'success',
            confirmButtonColor: '#28a745'
          });
          
          if (type === 'external') {
            setExternalRequests(externalRequests.filter(req => req.request_id !== id));
          } else {
            setInternalRequests(internalRequests.filter(req => req.request_id !== id));
          }
        } else {
          await Swal.fire({
            title: 'เกิดข้อผิดพลาด!',
            text: `ไม่สามารถลบข้อมูลได้: ${data.message}`,
            icon: 'error',
            confirmButtonColor: '#d33'
          });
        }
      } catch (error) {
        console.error('Error deleting request:', error);
        await Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  const handlePrint = (id, type = 'internal') => {
    window.open(`/print-form/${type}/${id}`, '_blank');
  };

  return (
    <>
      <Head>
        <title>หน้าจัดการ - ระบบ Form</title>
      </Head>
      <Container fluid>
        <Row className="bg-primary text-white py-3 mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h2>หน้าจัดการระบบ</h2>
              <Button variant="outline-light" onClick={handleLogout}>ออกจากระบบ</Button>
            </div>
          </Col>
        </Row>
        
        <Container>
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Body>
                  <h4>คำขอทั้งหมด</h4>
                  
                  <Card className="mb-3">
                    <Card.Body>
                      <h5 className="mb-3">
                        <FaFilter className="me-2" />
                        ค้นหาคำขอ
                      </h5>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>เลขที่เอกสาร</Form.Label>
                            <InputGroup>
                              <Form.Control
                                type="text"
                                name="documentNumber"
                                value={searchFilters.documentNumber}
                                onChange={handleSearchChange}
                                placeholder="ค้นหาตามเลขที่เอกสาร"
                              />
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>{key === 'external' ? 'ชื่อ-นามสกุล' : 'รหัสพนักงาน'}</Form.Label>
                            <InputGroup>
                              <Form.Control
                                type="text"
                                name="name"
                                value={searchFilters.name}
                                onChange={handleSearchChange}
                                placeholder={key === 'external' ? "ค้นหาตามชื่อ" : "ค้นหาตามรหัสพนักงาน"}
                              />
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              <FaCalendarAlt className="me-2" />
                              ช่วงวันที่ร้องขอ
                            </Form.Label>
                            <div className="d-flex align-items-center gap-2">
                              <Form.Control
                                type="date"
                                name="dateFrom"
                                value={searchFilters.dateFrom}
                                onChange={handleSearchChange}
                                placeholder="จากวันที่"
                                className="flex-grow-1"
                              />
                              <span>ถึง</span>
                              <Form.Control
                                type="date"
                                name="dateTo"
                                value={searchFilters.dateTo}
                                onChange={handleSearchChange}
                                placeholder="ถึงวันที่"
                                className="flex-grow-1"
                              />
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                      <div className="d-flex justify-content-end">
                        <Button 
                          variant="secondary" 
                          onClick={clearSearch}
                          className="d-flex align-items-center"
                        >
                          <FaTimes className="me-1" /> ล้างการค้นหา
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                  
                  <Tabs
                    activeKey={key}
                    onSelect={(k) => setKey(k)}
                    className="mb-3"
                  >
                    <Tab eventKey="external" title="คำขอจากบุคคลภายนอก">
                      {loading ? (
                        <div className="text-center py-4">กำลังโหลดข้อมูล...</div>
                      ) : (
                        <>
                          <div className="mb-2 text-end">
                            <small>พบ {filteredExternalRequests.length} รายการ</small>
                          </div>
                          <Table striped bordered hover responsive className="align-middle">
                            <thead>
                              <tr className='text-center'>
                                <th>#</th>
                                <th>เลขที่เอกสาร</th>
                                <th>ชื่อ-นามสกุล</th>
                                <th>วันที่ร้องขอ</th>
                                <th>สถานะ</th>
                                <th>ดูรายละเอียด</th>
                                <th>การจัดการ</th>
                                <th>พิมพ์</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredExternalRequests.length > 0 ? (
                                filteredExternalRequests.map((request, index) => (
                                  <tr key={request.request_id} className="text-center">
                                    <td>{index + 1}</td>
                                    <td>{request.document_number || 'ไม่ระบุ'}</td>
                                    <td>{`${request.first_name || ''} ${request.last_name || ''}`}</td>
                                    <td>{formatDate(request.visit_date)}</td>
                                    <td>{getStatusBadge(request.status)}</td>
                                    <td>
                                      <Link 
                                        href={`/admin/request-external/${request.request_id}`} 
                                        className="btn btn-sm btn-primary rounded-circle d-inline-flex align-items-center justify-content-center"
                                        style={{ width: '2rem', height: '2rem' }}
                                        title="ดูรายละเอียด"
                                      >
                                        <FaSearch />
                                      </Link>
                                    </td>
                                    <td>
                                      <div className="d-flex justify-content-center gap-2">
                                        <Button 
                                          variant="warning" 
                                          size="sm" 
                                          className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                          style={{ width: '2rem', height: '2rem' }}
                                          onClick={() => handleExternalEdit(request.request_id, 'external')}
                                          title="แก้ไข"
                                        >
                                          <FaEdit />
                                        </Button>
                                        <Button 
                                          variant="danger" 
                                          size="sm" 
                                          className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                          style={{ width: '2rem', height: '2rem' }}
                                          onClick={() => handleDelete(request.request_id, 'external')}
                                          title="ลบ"
                                        >
                                          <FaTrashAlt />
                                        </Button>
                                      </div>
                                    </td>
                                    <td>
                                      <Button 
                                        variant="info" 
                                        size="sm" 
                                        className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
                                        style={{ width: '2rem', height: '2rem' }}
                                        onClick={() => handlePrint(request.request_id, 'external')}
                                        title="พิมพ์แบบฟอร์ม"
                                      >
                                        <FaPrint />
                                      </Button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="8" className="text-center py-3">ไม่พบข้อมูลคำขอ</td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </>
                      )}
                    </Tab>
                    <Tab eventKey="internal" title="คำขอจากบุคคลภายใน">
                      {loading ? (
                        <div className="text-center py-4">กำลังโหลดข้อมูล...</div>
                      ) : (
                        <>
                          <div className="mb-2 text-end">
                            <small>พบ {filteredInternalRequests.length} รายการ</small>
                          </div>
                          <Table striped bordered hover responsive className="align-middle">
                            <thead>
                              <tr className='text-center'>
                                <th>#</th>
                                <th>เลขที่เอกสาร</th>
                                <th>รหัสพนักงาน</th>
                                <th>วันที่ร้องขอ</th>
                                <th>สถานะ</th>
                                <th>ดูรายละเอียด</th>
                                <th>การจัดการ</th>
                                <th>พิมพ์</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredInternalRequests.length > 0 ? (
                                filteredInternalRequests.map((request, index) => (
                                  <tr key={request.request_id} className="text-center">
                                    <td>{index + 1}</td>
                                    <td>{request.document_number || 'ไม่ระบุ'}</td>
                                    <td>{request.employee_id || 'ไม่ระบุ'}</td>
                                    <td>{formatDate(request.visit_date)}</td>
                                    <td>{getStatusBadge(request.status)}</td>
                                    <td>
                                      <Link 
                                        href={`/admin/request-internal/${request.request_id}`}
                                        className="btn btn-sm btn-primary rounded-circle d-inline-flex align-items-center justify-content-center"
                                        style={{ width: '2rem', height: '2rem' }}
                                        title="ดูรายละเอียด"
                                      >
                                        <FaSearch />
                                      </Link>
                                    </td>
                                    <td>
                                      <div className="d-flex justify-content-center gap-2">
                                        <Button 
                                          variant="warning" 
                                          size="sm" 
                                          className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                          style={{ width: '2rem', height: '2rem' }}
                                          onClick={() => handleEdit(request.request_id, 'internal')}
                                          title="แก้ไข"
                                        >
                                          <FaEdit />
                                        </Button>
                                        <Button 
                                          variant="danger" 
                                          size="sm" 
                                          className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                          style={{ width: '2rem', height: '2rem' }}
                                          onClick={() => handleDelete(request.request_id, 'internal')}
                                          title="ลบ"
                                        >
                                          <FaTrashAlt />
                                        </Button>
                                      </div>
                                    </td>
                                    <td>
                                      <Button 
                                        variant="info" 
                                        size="sm" 
                                        className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
                                        style={{ width: '2rem', height: '2rem' }}
                                        onClick={() => handlePrint(request.request_id, 'internal')}
                                        title="พิมพ์แบบฟอร์ม"
                                      >
                                        <FaPrint />
                                      </Button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="8" className="text-center py-3">ไม่พบข้อมูลคำขอ</td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </>
                      )}
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </Container>
    </>
  );
}