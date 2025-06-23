import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Tabs, Tab, Badge, Form, InputGroup, Pagination } from 'react-bootstrap';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaSearch, FaEdit, FaTrashAlt, FaPrint, FaFilter, FaTimes, FaCalendarAlt, FaCheck, FaCheckCircle, FaLock, FaTimesCircle } from 'react-icons/fa';
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
  
  // เพิ่ม state สำหรับการเลือกรายการ
  const [selectedExternalItems, setSelectedExternalItems] = useState([]);
  const [selectedInternalItems, setSelectedInternalItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // เพิ่ม state สำหรับ pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [userRole, setUserRole] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  const router = useRouter();
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [searchFilters, externalRequests, internalRequests, currentPage, itemsPerPage, key]);
  
  // ดึงข้อมูลผู้ใช้จาก localStorage
  useEffect(() => {
    const adminData = localStorage.getItem('adminData');
    if (adminData) {
      const parsedData = JSON.parse(adminData);
      setUserRole(parsedData.role || '');
      setUserInfo(parsedData);
    }
  }, []);
  
  // ฟังก์ชันสำหรับกรองข้อมูล
  const applyFilters = () => {
    // กรองข้อมูล External
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
    
    // กรองข้อมูล Internal
    const filteredInternal = internalRequests.filter(request => {
      const matchDocNumber = !searchFilters.documentNumber || 
        (request.document_number && 
        request.document_number.toLowerCase().includes(searchFilters.documentNumber.toLowerCase()));
      
      const fullName = `${request.first_name || ''} ${request.last_name || ''}`.toLowerCase();
      const matchEmployeeId = !searchFilters.name || 
        (request.employee_id && 
        request.employee_id.toString().toLowerCase().includes(searchFilters.name.toLowerCase()));
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
      
      return matchDocNumber && (matchEmployeeId || matchName) && matchDate;
    });
    
    // ตั้งค่าข้อมูลที่กรองแล้ว (pagination จะทำในตัว)
    if (key === 'external') {
      setFilteredExternalRequests(filteredExternal);
    } else {
      setFilteredInternalRequests(filteredInternal);
    }
    
    // รีเซ็ตการเลือกเมื่อกรองข้อมูลใหม่
    setSelectedExternalItems([]);
    setSelectedInternalItems([]);
    setSelectAll(false);
  };
  
  // ฟังก์ชันสำหรับคำนวณข้อมูลที่จะแสดงในหน้าปัจจุบัน
  const getCurrentPageData = () => {
    const currentData = key === 'external' ? filteredExternalRequests : filteredInternalRequests;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return currentData.slice(startIndex, endIndex);
  };
  
  // ฟังก์ชันสำหรับคำนวณจำนวนหน้าทั้งหมด
  const getTotalPages = () => {
    const currentData = key === 'external' ? filteredExternalRequests : filteredInternalRequests;
    return Math.ceil(currentData.length / itemsPerPage);
  };
  
  // ฟังก์ชันสำหรับเปลี่ยนหน้า
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedExternalItems([]);
    setSelectedInternalItems([]);
    setSelectAll(false);
  };
  
  // ฟังก์ชันสำหรับเปลี่ยนจำนวนรายการต่อหน้า
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(parseInt(newItemsPerPage));
    setCurrentPage(1);
    setSelectedExternalItems([]);
    setSelectedInternalItems([]);
    setSelectAll(false);
  };
  
  // ฟังก์ชันสำหรับสร้าง Pagination Component
  const renderPagination = () => {
    const totalPages = getTotalPages();
    const currentData = key === 'external' ? filteredExternalRequests : filteredInternalRequests;
    const totalItems = currentData.length;
    const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    let paginationItems = [];
    
    // แสดง pagination เสมอ แม้มีหน้าเดียว
    if (totalPages > 1) {
      const maxVisiblePages = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      // ปุ่มแรก
      if (startPage > 1) {
        paginationItems.push(
          <Pagination.First key="first" onClick={() => handlePageChange(1)} />
        );
        if (startPage > 2) {
          paginationItems.push(
            <Pagination.Ellipsis key="ellipsis-start" />
          );
        }
      }

      // ปุ่มก่อนหน้า
      if (currentPage > 1) {
        paginationItems.push(
          <Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} />
        );
      }

      // หมายเลขหน้า
      for (let i = startPage; i <= endPage; i++) {
        paginationItems.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }

      // ปุ่มถัดไป
      if (currentPage < totalPages) {
        paginationItems.push(
          <Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} />
        );
      }

      // ปุ่มสุดท้าย
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          paginationItems.push(
            <Pagination.Ellipsis key="ellipsis-end" />
          );
        }
        paginationItems.push(
          <Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} />
        );
      }
    }

    return (
      <>
        {/* ส่วนแสดงข้อมูลสถิติและ Pagination ด้านบน */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted">
              แสดง {totalItems > 0 ? startItem : 0}-{endItem} จาก {totalItems} รายการ
            </span>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">แสดง:</span>
              <Form.Select
                size="sm"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                style={{ width: '80px' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Form.Select>
              <span className="text-muted small">รายการ</span>
            </div>
          </div>
          
          {/* Pagination ด้านขวาบน - แสดงตลอด */}
          <div className="d-flex justify-content-end">
            <Pagination className="mb-0" size="sm">
              {paginationItems.length > 0 ? paginationItems : (
                <Pagination.Item active>1</Pagination.Item>
              )}
            </Pagination>
          </div>
        </div>
      </>
    );
  };
  
  // ฟังก์ชันสำหรับจัดการการเลือกรายการ
  const handleSelectItem = (id, type) => {
    if (type === 'external') {
      setSelectedExternalItems(prev => 
        prev.includes(id) 
          ? prev.filter(item => item !== id)
          : [...prev, id]
      );
    } else {
      setSelectedInternalItems(prev => 
        prev.includes(id) 
          ? prev.filter(item => item !== id)
          : [...prev, id]
      );
    }
  };
  
  // ฟังก์ชันสำหรับเลือกทั้งหมด (เฉพาะในหน้าปัจจุบัน)
  const handleSelectAll = () => {
    const currentPageData = getCurrentPageData();
    
    if (key === 'external') {
      const currentPageIds = currentPageData.map(req => req.request_id);
      const allSelected = currentPageIds.every(id => selectedExternalItems.includes(id));
      
      if (allSelected) {
        setSelectedExternalItems(prev => prev.filter(id => !currentPageIds.includes(id)));
      } else {
        setSelectedExternalItems(prev => [...new Set([...prev, ...currentPageIds])]);
      }
    } else {
      const currentPageIds = currentPageData.map(req => req.request_id);
      const allSelected = currentPageIds.every(id => selectedInternalItems.includes(id));
      
      if (allSelected) {
        setSelectedInternalItems(prev => prev.filter(id => !currentPageIds.includes(id)));
      } else {
        setSelectedInternalItems(prev => [...new Set([...prev, ...currentPageIds])]);
      }
    }
  };
  
  // ฟังก์ชันลบรายการที่เลือก
  const handleDeleteSelected = async () => {
    const selectedItems = key === 'external' ? selectedExternalItems : selectedInternalItems;
    
    if (selectedItems.length === 0) {
      Swal.fire({
        title: 'ไม่มีรายการที่เลือก',
        text: 'กรุณาเลือกรายการที่ต้องการลบก่อน',
        icon: 'warning',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    
    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: `คุณต้องการลบคำขอที่เลือก ${selectedItems.length} รายการ ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบรายการที่เลือก!',
      cancelButtonText: 'ยกเลิก'
    });
    
    if (result.isConfirmed) {
      try {
        // แสดง Loading
        Swal.fire({
          title: 'กำลังลบข้อมูล...',
          text: `กำลังลบ ${selectedItems.length} รายการ`,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        const endpoint = key === 'external' 
          ? '/api/admin/delete-multiple-external-requests' 
          : '/api/admin/delete-multiple-internal-requests';
        
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requestIds: selectedItems }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          await Swal.fire({
            title: 'สำเร็จ!',
            text: `ลบข้อมูล ${selectedItems.length} รายการเรียบร้อยแล้ว`,
            icon: 'success',
            confirmButtonColor: '#28a745'
          });
          
          // อัพเดตรายการ
          if (key === 'external') {
            setExternalRequests(externalRequests.filter(req => !selectedItems.includes(req.request_id)));
            setSelectedExternalItems([]);
          } else {
            setInternalRequests(internalRequests.filter(req => !selectedItems.includes(req.request_id)));
            setSelectedInternalItems([]);
          }
          setSelectAll(false);
        } else {
          await Swal.fire({
            title: 'เกิดข้อผิดพลาด!',
            text: `ไม่สามารถลบข้อมูลได้: ${data.message}`,
            icon: 'error',
            confirmButtonColor: '#d33'
          });
        }
      } catch (error) {
        console.error('Error deleting multiple requests:', error);
        await Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    }
  };
  
  // ตรวจสอบว่า tab ปัจจุบันมีรายการที่เลือกหรือไม่
  const getCurrentSelectedItems = () => {
    return key === 'external' ? selectedExternalItems : selectedInternalItems;
  };

  // ตรวจสอบว่าเลือกทั้งหมด (ในหน้าปัจจุบัน) หรือไม่
  const isAllSelected = () => {
    const currentPageData = getCurrentPageData();
    const currentPageIds = currentPageData.map(req => req.request_id);
    
    if (currentPageIds.length === 0) return false;
    
    if (key === 'external') {
      return currentPageIds.every(id => selectedExternalItems.includes(id));
    } else {
      return currentPageIds.every(id => selectedInternalItems.includes(id));
    }
  };

  // ฟังก์ชันเดิมที่ไม่เปลี่ยน
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const externalRes = await fetch('/api/admin/get-external-requests');
      const externalData = await externalRes.json();
      
      if (externalData.success && externalData.requests) {
        setExternalRequests(externalData.requests);
      } else {
        console.error('Failed to fetch external requests:', externalData.message);
      }
      
      const internalRes = await fetch('/api/admin/get-internal-requests');
      const internalData = await internalRes.json();
      
      if (internalData.success && internalData.requests) {
        setInternalRequests(internalData.requests);
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
    setCurrentPage(1); // รีเซ็ตไปหน้าแรกเมื่อค้นหา
  };
  
  const clearSearch = () => {
    setSearchFilters({
      documentNumber: '',
      name: '',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
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
        return <Badge bg="warning" className="w-80">รออนุมัติ</Badge>;
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
            setInternalRequests(internalRequests.filter (req => req.request_id !== id));
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

  // เพิ่มฟังก์ชันสำหรับตัดข้อความวัตถุประสงค์
  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'ไม่ระบุ';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // ตรวจสอบว่าผู้ใช้มีสิทธิ์อนุมัติหรือไม่
  const canApprove = () => {
    return userRole === 'admin' || userRole ==='super_admin'|| userRole === 'approver';
  };

  // ฟังก์ชันสำหรับ Approve - ลดข้อมูลที่ส่ง
  const handleApprove = async (id, type) => {
    // ตรวจสอบสิทธิ์ก่อน
    if (!canApprove()) {
      await Swal.fire({
        title: 'ไม่มีสิทธิ์!',
        text: 'เฉพาะ Admin และ Approver เท่านั้นที่สามารถอนุมัติคำขอได้',
        icon: 'warning',
        confirmButtonColor: '#f0ad4e'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'ยืนยันการอนุมัติ',
      html: `
        <p>คุณต้องการอนุมัติคำขอนี้ใช่หรือไม่?</p>
        <div class="mt-2">
          <small class="text-muted">
            <i class="fas fa-user-check"></i> ผู้อนุมัติ: ${userInfo?.fullName || userInfo?.username || 'ไม่ระบุ'}
          </small>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'ใช่, อนุมัติ!',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        const endpoint = type === 'external' 
          ? '/api/admin/approve-external-request' 
          : '/api/admin/approve-internal-request';
        
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({ 
            requestId: id,
            status: 'approved'
            // ลบ approvedBy และ approverName ออก เพราะ API จะใช้ข้อมูลจาก JWT token
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          await Swal.fire({
            title: 'อนุมัติสำเร็จ!',
            html: `
              <p>อนุมัติคำขอเรียบร้อยแล้ว</p>
              <div class="mt-2">
                <small class="text-muted">
                  <i class="fas fa-clock"></i> เวลา: ${new Date().toLocaleString('th-TH')}
                </small>
              </div>
            `,
            icon: 'success',
            confirmButtonColor: '#28a745'
          });
          
          // อัพเดตสถานะในรายการ
          if (type === 'external') {
            setExternalRequests(prev => 
              prev.map(req => 
                req.request_id === id 
                  ? { 
                      ...req, 
                      status: 'approved',
                      approver: data.approver?.name,
                      approve_date: data.approver?.approveDate
                    }
                  : req
              )
            );
          } else {
            setInternalRequests(prev => 
              prev.map(req => 
                req.request_id === id 
                  ? { 
                      ...req, 
                      status: 'approved',
                      approver: data.approver?.name,
                      approve_date: data.approver?.approveDate
                    }
                  : req
              )
            );
          }
          
          // รีเฟรชข้อมูลหลังจากอนุมัติ
          fetchRequests();
        } else {
          await Swal.fire({
            title: 'เกิดข้อผิดพลาด!',
            text: `ไม่สามารถอนุมัติได้: ${data.message}`,
            icon: 'error',
            confirmButtonColor: '#d33'
          });
        }
      } catch (error) {
        console.error('Error approving request:', error);
        await Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  // ฟังก์ชันใหม่สำหรับ Reject
  const handleReject = async (id, type) => {
    // ตรวจสอบสิทธิ์ก่อน
    if (!canApprove()) {
      await Swal.fire({
        title: 'ไม่มีสิทธิ์!',
        text: 'เฉพาะ Admin และ Approver เท่านั้นที่สามารถปฏิเสธคำขอได้',
        icon: 'warning',
        confirmButtonColor: '#f0ad4e'
      });
      return;
    }

    // ตรวจสอบสถานะปัจจุบัน
    const currentData = type === 'external' ? filteredExternalRequests : filteredInternalRequests;
    const currentRequest = currentData.find(req => req.request_id === id);
    const isAlreadyApproved = currentRequest?.status === 'approved';

    const { value: rejectReason } = await Swal.fire({
      title: isAlreadyApproved ? 'ยกเลิกการอนุมัติ' : 'ปฏิเสธคำขอ',
      html: `
        <p>${isAlreadyApproved ? 
          'คุณต้องการยกเลิกการอนุมัติและปฏิเสธคำขอนี้ใช่หรือไม่?' : 
          'คุณต้องการปฏิเสธคำขอนี้ใช่หรือไม่?'
        }</p>
        <div class="mt-3">
          <small class="text-muted d-block mb-2">
            <i class="fas fa-user-times"></i> ผู้ปฏิเสธ: ${userInfo?.fullName || userInfo?.username || 'ไม่ระบุ'}
          </small>
          <textarea 
            id="reject-reason" 
            class="form-control" 
            placeholder="${isAlreadyApproved ? 
              'ระบุเหตุผลการยกเลิกการอนุมัติ (ไม่จำเป็น)' : 
              'ระบุเหตุผลการปฏิเสธ (ไม่จำเป็น)'
            }"
            rows="3"
          ></textarea>
        </div>
      `,
      icon: isAlreadyApproved ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isAlreadyApproved ? '#ffc107' : '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: isAlreadyApproved ? 'ยกเลิกการอนุมัติ' : 'ปฏิเสธ',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        return document.getElementById('reject-reason').value;
      }
    });

    if (rejectReason !== undefined) { // ถ้าไม่ได้กด Cancel
      try {
        const endpoint = type === 'external' 
          ? '/api/admin/reject-external-request' 
          : '/api/admin/reject-internal-request';
        
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({ 
            requestId: id,
            status: 'rejected',
            rejectReason: rejectReason || null,
            previousStatus: currentRequest?.status // ส่งสถานะเดิมไปด้วย
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          await Swal.fire({
            title: isAlreadyApproved ? 'ยกเลิกการอนุมัติสำเร็จ!' : 'ปฏิเสธสำเร็จ!',
            html: `
              <p>${isAlreadyApproved ? 
                'ยกเลิกการอนุมัติและปฏิเสธคำขอเรียบร้อยแล้ว' : 
                'ปฏิเสธคำขอเรียบร้อยแล้ว'
              }</p>
              ${rejectReason ? `<div class="mt-2"><small class="text-muted"><strong>เหตุผล:</strong> ${rejectReason}</small></div>` : ''}
              <div class="mt-2">
                <small class="text-muted">
                  <i class="fas fa-clock"></i> เวลา: ${new Date().toLocaleString('th-TH')}
                </small>
              </div>
            `,
            icon: 'success',
            confirmButtonColor: '#28a745'
          });
          
          // รีเฟรชข้อมูลหลังจากปฏิเสธ
          fetchRequests();
        } else {
          await Swal.fire({
            title: 'เกิดข้อผิดพลาด!',
            text: `ไม่สามารถดำเนินการได้: ${data.message}`,
            icon: 'error',
            confirmButtonColor: '#d33'
          });
        }
      } catch (error) {
        console.error('Error rejecting request:', error);
        await Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  // เพิ่มฟังก์ชันตรวจสอบสิทธิ์แก้ไข/ลบ
  const canEditDelete = () => {
    return userRole === 'admin' || userRole === 'super_admin';
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
              <div>
                <h2>หน้าจัดการระบบ</h2>
                <small className="opacity-75">
                  <i className="fas fa-user"></i> {userInfo?.fullName || userInfo?.username} 
                  ({userRole === 'admin' ? 'ผู้ดูแลระบบ' : userRole === 'approver' ? 'ผู้อนุมัติ' : 'ผู้ใช้'})
                </small>
              </div>
              <Button variant="outline-light" onClick={handleLogout}>ออกจากระบบ</Button>
            </div>
          </Col>
        </Row>
        
        <Container>
          {/* แสดงสิทธิ์การใช้งาน */}
          {!canApprove() && (
            <Row className="mb-3">
              <Col>
                <div className="alert alert-warning d-flex align-items-center">
                  <FaLock className="me-2" />
                  <div>
                    <strong>หมายเหตุ:</strong> คุณไม่มีสิทธิ์อนุมัติ/ปฏิเสธคำขอ เฉพาะ Admin และ Approver เท่านั้นที่สามารถดำเนินการได้
                  </div>
                </div>
              </Col>
            </Row>
          )}

          {userRole === 'approver' && (
            <Row className="mb-3">
              <Col>
                <div className="alert alert-info d-flex align-items-center">
                  <FaLock className="me-2" />
                  <div>
                    <strong>สิทธิ์ Approver:</strong> คุณสามารถอนุมัติ/ปฏิเสธคำขอได้ แต่ไม่สามารถแก้ไข/ลบข้อมูลได้ (เฉพาะ Admin เท่านั้น)
                  </div>
                </div>
              </Col>
            </Row>
          )}

          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Body>
                  <h4>คำขอทั้งหมด</h4>
                  
                  {/* Filter Card - เหมือนเดิม */}
                  <Card className="mb-3">
                    <Card.Body>
                      <h5 className="mb-3">
                        <FaFilter className="me-2" />
                        ค้นหาคำขอ
                      </h5>
                      {/* Filter content เหมือนเดิม */}
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
                            <Form.Label>{key === 'external' ? 'ชื่อ-นามสกุล' : 'รหัสพนักงาน/ชื่อ'}</Form.Label>
                            <InputGroup>
                              <Form.Control
                                type="text"
                                name="name"
                                value={searchFilters.name}
                                onChange={handleSearchChange}
                                placeholder={key === 'external' ? "ค้นหาตามชื่อ" : "ค้นหาตามรหัสพนักงานหรือชื่อ"}
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
                  

                  {/* Bulk actions - เหมือนเดิม */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={handleSelectAll}
                        className="d-flex align-items-center"
                      >
                        <FaCheck className="me-1" />
                        {isAllSelected() ? 'ยกเลิกเลือกทั้งหมด (หน้านี้)' : 'เลือกทั้งหมด (หน้านี้)'}
                      </Button>
                      
                      {getCurrentSelectedItems().length > 0 && canEditDelete() && (
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted">
                            เลือกแล้ว {getCurrentSelectedItems().length} รายการ
                          </span>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={handleDeleteSelected}
                            className="d-flex align-items-center"
                          >
                            <FaTrashAlt className="me-1" />
                            ลบรายการที่เลือก
                          </Button>
                        </div>
                      )}
                      
                      {getCurrentSelectedItems().length > 0 && !canEditDelete() && (
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted">
                            เลือกแล้ว {getCurrentSelectedItems().length} รายการ
                          </span>
                          <span className="text-muted small">
                            <FaLock className="me-1" />
                            ไม่มีสิทธิ์ลบ (เฉพาะ Admin เท่านั้น)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Tabs
                    activeKey={key}
                    onSelect={(k) => {
                      setKey(k);
                      setSelectAll(false);
                      setSelectedExternalItems([]);
                      setSelectedInternalItems([]);
                      setCurrentPage(1);
                    }}
                    className="mb-3"
                  >
                    <Tab eventKey="external" title="คำขอจากบุคคลภายนอก">
                      {loading ? (
                        <div className="text-center py-4">กำลังโหลดข้อมูล...</div>
                      ) : (
                        <>
                          {renderPagination()}
                          
                          <Table striped bordered hover responsive className="align-middle">
                            <thead>
                              <tr className='text-center'>
                                <th style={{ width: '40px' }}>
                                  <Form.Check 
                                    type="checkbox"
                                    checked={isAllSelected()}
                                    onChange={handleSelectAll}
                                  />
                                </th>
                                <th>#</th>
                                <th>เลขที่เอกสาร</th>
                                <th>ชื่อผู้ร้องขอ</th>
                                <th>วัตถุประสงค์</th>
                                <th>วันที่ร้องขอ</th>
                                <th>สถานะ</th>
                                <th>รายละเอียด / อนุมัติ / ปฏิเสธ</th>
                                <th>การจัดการ</th>
                                <th>พิมพ์</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getCurrentPageData().length > 0 ? (
                                getCurrentPageData().map((request, index) => (
                                  <tr key={request.request_id} className="text-center">
                                    <td>
                                      <Form.Check 
                                        type="checkbox"
                                        checked={selectedExternalItems.includes(request.request_id)}
                                        onChange={() => handleSelectItem(request.request_id, 'external')}
                                      />
                                    </td>
                                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td>{request.document_number || 'ไม่ระบุ'}</td>
                                    <td>{`${request.first_name || ''} ${request.last_name || ''}`}</td>
                                    <td className="text-start" title={request.purpose || 'ไม่ระบุ'}>
                                      {truncateText(request.purpose)}
                                    </td>
                                    <td>{formatDate(request.visit_date)}</td>
                                    <td>{getStatusBadge(request.status)}</td>
                                    <td>
                                      <div className="d-flex justify-content-center gap-1">
                                        {/* ปุ่มดูรายละเอียด */}
                                        <Link 
                                          href={`/admin/request-external/${request.request_id}`} 
                                          className="btn btn-sm btn-primary rounded-circle d-inline-flex align-items-center justify-content-center"
                                          style={{ width: '2rem', height: '2rem' }}
                                          title="ดูรายละเอียด"
                                        >
                                          <FaSearch />
                                        </Link>
                                        
                                        {/* ปุ่ม Approve และ Reject - แสดงเฉพาะเมื่อไม่ได้ปฏิเสธแล้ว */}
                                        {request.status !== 'rejected' && (
                                          canApprove() ? (
                                            <>
                                              {/* ปุ่ม Approve - แสดงเฉพาะเมื่อยังไม่อนุมัติ */}
                                              {request.status !== 'approved' && (
                                                <Button 
                                                  variant="success" 
                                                  size="sm" 
                                                  className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                                  style={{ width: '2rem', height: '2rem' }}
                                                  onClick={() => handleApprove(request.request_id, 'external')}
                                                  title="อนุมัติคำขอ"
                                                >
                                                  <FaCheckCircle />
                                                </Button>
                                              )}
                                              
                                              {/* ปุ่ม Reject - แสดงเสมอ ยกเว้นเมื่อถูกปฏิเสธแล้ว */}
                                              <Button 
                                                variant={request.status === 'approved' ? 'warning' : 'danger'}
                                                size="sm" 
                                                className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                                style={{ width: '2rem', height: '2rem' }}
                                                onClick={() => handleReject(request.request_id, 'external')}
                                                title={request.status === 'approved' ? 'ยกเลิกการอนุมัติ' : 'ปฏิเสธคำขอ'}
                                              >
                                                <FaTimesCircle />
                                              </Button>
                                            </>
                                          ) : (
                                            <Button 
                                              variant="secondary" 
                                              size="sm" 
                                              className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                              style={{ width: '2rem', height: '2rem' }}
                                              disabled
                                              title="ไม่มีสิทธิ์อนุมัติ/ปฏิเสธ"
                                            >
                                              <FaLock />
                                            </Button>
                                          )
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <div className="d-flex justify-content-center gap-2">
                                        {canEditDelete() ? (
                                          <>
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
                                          </>
                                        ) : (
                                          <>
                                            <Button 
                                              variant="secondary" 
                                              size="sm" 
                                              className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                              style={{ width: '2rem', height: '2rem' }}
                                              disabled
                                              title="ไม่มีสิทธิ์แก้ไข (เฉพาะ Admin เท่านั้น)"
                                            >
                                              <FaLock />
                                            </Button>
                                            <Button 
                                              variant="secondary" 
                                              size="sm" 
                                              className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                              style={{ width: '2rem', height: '2rem' }}
                                              disabled
                                              title="ไม่มีสิทธิ์ลบ (เฉพาะ Admin เท่านั้น)"
                                            >
                                              <FaLock />
                                            </Button>
                                          </>
                                        )}
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
                                  <td colSpan="10" className="text-center py-3">ไม่พบข้อมูลคำขอ</td>
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
                          {renderPagination()}
                          
                          <Table striped bordered hover responsive className="align-middle">
                            <thead>
                              <tr className='text-center'>
                                <th style={{ width: '40px' }}>
                                  <Form.Check 
                                    type="checkbox"
                                    checked={isAllSelected()}
                                    onChange={handleSelectAll}
                                  />
                                </th>
                                <th>#</th>
                                <th>เลขที่เอกสาร</th>
                                <th>ชื่อผู้ร้องขอ</th>
                                <th>วัตถุประสงค์</th>
                                <th>วันที่ร้องขอ</th>
                                <th>สถานะ</th>
                                <th>รายละเอียด / อนุมัติ / ปฏิเสธ</th>
                                <th>การจัดการ</th>
                                <th>พิมพ์</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getCurrentPageData().length > 0 ? (
                                getCurrentPageData().map((request, index) => (
                                  <tr key={request.request_id} className="text-center">
                                    <td>
                                      <Form.Check 
                                        type="checkbox"
                                        checked={selectedInternalItems.includes(request.request_id)}
                                        onChange={() => handleSelectItem(request.request_id, 'internal')}
                                      />
                                    </td>
                                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td>{request.document_number || 'ไม่ระบุ'}</td>
                                    <td>{`${request.first_name || ''} ${request.last_name || ''}`.trim() || 'ไม่ระบุ'}</td>
                                    <td className="text-start" title={request.purpose || 'ไม่ระบุ'}>
                                      {truncateText(request.purpose)}
                                    </td>
                                    <td>{formatDate(request.visit_date)}</td>
                                    <td>{getStatusBadge(request.status)}</td>
                                    <td>
                                      <div className="d-flex justify-content-center gap-1">
                                        {/* ปุ่มดูรายละเอียด */}
                                        <Link 
                                          href={`/admin/request-internal/${request.request_id}`}
                                          className="btn btn-sm btn-primary rounded-circle d-inline-flex align-items-center justify-content-center"
                                          style={{ width: '2rem', height: '2rem' }}
                                          title="ดูรายละเอียด"
                                        >
                                          <FaSearch />
                                        </Link>
                                        
                                        {/* ปุ่ม Approve และ Reject - แสดงเฉพาะเมื่อไม่ได้ปฏิเสธแล้ว */}
                                        {request.status !== 'rejected' && (
                                          canApprove() ? (
                                            <>
                                              {/* ปุ่ม Approve - แสดงเฉพาะเมื่อยังไม่อนุมัติ */}
                                              {request.status !== 'approved' && (
                                                <Button 
                                                  variant="success" 
                                                  size="sm" 
                                                  className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                                  style={{ width: '2rem', height: '2rem' }}
                                                  onClick={() => handleApprove(request.request_id, 'internal')}
                                                  title="อนุมัติคำขอ"
                                                >
                                                  <FaCheckCircle />
                                                </Button>
                                              )}
                                              
                                              {/* ปุ่ม Reject - แสดงเสมอ ยกเว้นเมื่อถูกปฏิเสธแล้ว */}
                                              <Button 
                                                variant={request.status === 'approved' ? 'warning' : 'danger'}
                                                size="sm" 
                                                className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                                style={{ width: '2rem', height: '2rem' }}
                                                onClick={() => handleReject(request.request_id, 'internal')}
                                                title={request.status === 'approved' ? 'ยกเลิกการอนุมัติ' : 'ปฏิเสธคำขอ'}
                                              >
                                                <FaTimesCircle />
                                              </Button>
                                            </>
                                          ) : (
                                            <Button 
                                              variant="secondary" 
                                              size="sm" 
                                              className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                              style={{ width: '2rem', height: '2rem' }}
                                              disabled
                                              title="ไม่มีสิทธิ์อนุมัติ/ปฏิเสธ"
                                            >
                                              <FaLock />
                                            </Button>
                                          )
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <div className="d-flex justify-content-center gap-2">
                                        {canEditDelete() ? (
                                          <>
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
                                          </>
                                        ) : (
                                          <>
                                            <Button 
                                              variant="secondary" 
                                              size="sm" 
                                              className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                              style={{ width: '2rem', height: '2rem' }}
                                              disabled
                                              title="ไม่มีสิทธิ์แก้ไข (เฉพาะ Admin เท่านั้น)"
                                            >
                                              <FaLock />
                                            </Button>
                                            <Button 
                                              variant="secondary" 
                                              size="sm" 
                                              className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                              style={{ width: '2rem', height: '2rem' }}
                                              disabled
                                              title="ไม่มีสิทธิ์ลบ (เฉพาะ Admin เท่านั้น)"
                                            >
                                              <FaLock />
                                            </Button>
                                          </>
                                        )}
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
                                  <td colSpan="10" className="text-center py-3">ไม่พบข้อมูลคำขอ</td>
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