import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button } from 'react-bootstrap';
import { FaPrint } from 'react-icons/fa';
import Image from 'next/image'; 
import 'bootstrap/dist/css/bootstrap.min.css';


export default function PrintForm() {
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);
  
  const router = useRouter();
  const { type, id } = router.query;
  
  useEffect(() => {
    if (id && type) {
      fetchRequestDetails();
    }
  }, [id, type]);
  
  const fetchRequestDetails = async () => {
    try {
      // เลือก API endpoint ตามประเภทของคำขอ
      const endpoint = type === 'external' 
        ? `/api/admin/get-external-request-details?id=${id}` 
        : `/api/admin/get-internal-request-details?id=${id}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success && data.request) {
        setRequest(data.request);
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
  
  // แปลงรูปแบบวันที่เป็น วัน/เดือน/ปี
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (error) {
      console.error('Date format error:', error);
      return '';
    }
  };

  // เพิ่มฟังก์ชันสำหรับการพิมพ์
  const handlePrint = () => {
    window.print();
  };
  
  if (loading) {
    return <div className="text-center py-5">กำลังโหลดข้อมูล...</div>;
  }
  
  if (error || !request) {
    return <div className="text-center py-5 text-danger">{error || 'ไม่พบข้อมูลคำขอ'}</div>;
  }
  
  return (
    <div className="bg-gray-100 p-4 print:p-0 print:m-0 print:bg-white">
      <Head>
        <title>แบบฟอร์มขอเข้าออกพื้นที่</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500&display=swap" rel="stylesheet" /> */}
        <style>
          {`
            /* Force Angsana New font everywhere */
            @font-face {
              font-family: 'Angsana New';
              src: local('Angsana New'), local('AngsanaNew');
              font-weight: normal;
              font-style: normal;
            }

            @font-face {
              font-family: 'Angsana New';
              src: local('Angsana New Bold'), local('AngsanaNew-Bold');
              font-weight: bold;
              font-style: normal;
            }

            * {
              font-family: 'Angsana New', 'AngsanaUPC', sans-serif !important;
            }

            @media print {
              /* ทำให้แน่ใจว่าใช้ฟอนต์เดียวกันตอนพิมพ์ */
              * {
                font-family: 'Angsana New', 'AngsanaUPC', sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }

            @media print {
              @page {
                size: A4 portrait;
                margin: 0.5cm;
              }
              
              body {
                margin: 0;
                padding: 0;
              }
              
              html, body {
                width: 210mm;
                height: 297mm;
                font-family: 'Angsana New','AngsanaUPC', sans-serif !important;
                font-weight: 400 !important;
                font-size: 16px !important;
              }
              
              * {
                font-family: 'Angsana New','AngsanaUPC', sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              .header-row {
                border-bottom: 1px solid #000 !important;
                font-weight: bold !important;
              }
              
              th, .font-bold {
                font-weight: bold !important;
              }
              
              .print-form {
                width: 210mm;
                height: 297mm;
                max-width: 210mm;
                overflow: hidden;
                margin: 0 auto;
                padding: 0;
                box-shadow: none;
                border: none;
              }
              
              .print-hidden {
                display: none !important;
              }
              
              .page-content {
                width: 100%;
                height: 100%;
                padding: 0.5cm;
              }
              
              /* ทำให้ตารางพอดีกับขนาดหน้ากระดาษ */
              .print-form table {
                width: 100%;
                table-layout: fixed;
                font-size: 16px !important;
              }
              
              /* ปรับขนาดตัวอักษรให้เล็กลงเพื่อให้เข้ากับ A4 */
              .print-form td, .print-form th {
                padding: 2px !important;
                font-size: 16px !important;
              }
              
              /* ปรับขนาดช่องเซ็นชื่อให้พอดี */
              .signature-section {
                margin-top: 10px !important;
                font-size: 14px !important;
              }
              
              /* ปรับแต่งขนาดหัวตาราง */
              .print-form .table-header, .header-row {
                font-size: 16px !important;
              }

              /* กำหนดขนาดฟอนต์สำหรับ label (ชื่อฟิลด์) เมื่อพิมพ์ */
              .label-bold {
                font-size: 18px !important; /* ปรับขนาดตามต้องการ */
                font-weight: bold !important;
              }
              
              /* ทำให้ตัวหนาในการพิมพ์เห็นชัดเจน */
              .font-bold, strong, b, .label-bold {
                font-weight: bold !important;
              }
            }
            
            /* Both screen and print */
            body {
              font-family: 'Angsana New','AngsanaUPC', sans-serif;
              font-weight: 300;
            }
            
            th, .font-bold {
              font-weight: 500;
            }
            
            .print-form {
              width: 210mm;
              max-width: 210mm;
              margin: 0 auto;
              background-color: white;
              // box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              font-size: 12px;
            }
            
            .page-content {
              position: relative;
              min-height: 250mm; /* ความสูงขั้นต่ำของเนื้อหา */
              padding: 10mm;
              display: flex;
              flex-direction: column;
              justify-content: flex-start; /* เริ่มจากด้านบน */
            }
            
            .form-content {
              flex-grow: 0; /* ไม่ขยายพื้นที่เต็ม container */
              margin-bottom: 2cm; /* เพิ่มระยะห่างด้านล่างของเนื้อหา */
            }
            
            .footer-section {
              margin-top: 1.5cm; /* เพิ่มระยะห่างด้านบนของส่วนลงนาม */
              width: 100%;
            }
            
            @media print {
              /* CSS สำหรับการพิมพ์ที่มีอยู่เดิม... */
              
              .page-content {
                min-height: unset; /* ยกเลิกการกำหนดความสูงขั้นต่ำ */
                height: auto; /* ให้ความสูงปรับตามเนื้อหา */
              }
              
              .footer-section {
                position: relative; /* เปลี่ยนจาก absolute เป็น relative */
                margin-top: 3cm; /* เพิ่มระยะห่างเมื่อพิมพ์ */
                bottom: auto; /* ไม่กำหนดตำแหน่งด้านล่าง */
                left: auto;
                right: auto;
                padding: 0;
              }
            }
            
            /* ทำให้ตารางพอดีกับขนาดหน้ากระดาษ */
            .print-form table {
              width: 100%;
              table-layout: fixed;
            }
            
            /* เพิ่มขนาดตัวอักษรในหัวข้อตาราง */
            .header-row, .table-header {
              font-size: 18px !important;
              font-weight: bold !important;
            }
          `}
        </style>
      </Head>
      <div className="print-form">
      <div className="text-center">
    <Image 
      src="/images/header.png" 
      alt="Logo" 
      width={200}
      height={60} 
      priority
      className="mx-auto mt-2 mb-6 " 
    />
  </div>
        <div className="page-content">
          <div className="form-content">
            <div className="text-left  font-bold mb-0 text-lg border-b border-black pb-2">
              แบบฟอร์ม ขอเข้า-ออกพื้นที่ควบคุมความปลอดภัย และการนำทรัพย์สินเข้า-ออกพื้นที่
            </div>
            
            {/* ส่วนที่ 1 */}
            <div>
            <div 
              className="py-1 px-2 font-bold border border-black header-row"
              style={{ backgroundColor: '#e5e7eb' }}
            >
              <span style={{ fontSize: '20px' }}>ส่วนที่ 1 : ข้อมูลผู้ร้องขอ</span>
            </div>
              <table className="w-full border-collapse border border-black">
                <tbody>
                  <tr>
                    <td className="p-0.5 px-1  w-1/2 text-sm border border-black">
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>ชื่อ - สกุล : </span>
                    {`${request.first_name || ''} ${request.last_name || ''}`}
                  </td>
                  <td className="p-0.5 px-1  w-1/2 text-sm border border-black">
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>วันที่ร้องขอ : </span>{formatDate(request.request_date)}
                  </td>
                  </tr>
                  <tr>
                  <td className="p-0.5 px-1  w-1/2 text-sm border border-black">
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {type === 'internal' ? 'รหัสพนักงาน :' : 'บริษัท :'}
                    </span>
                    {' '}{type === 'internal' ? request.employee_id : request.company}
                  </td>
                    <td className="p-0.5 px-1  w-1/2 text-sm border border-black">
                   <span style={{ fontSize: '20px', fontWeight: 'bold' }}> หน่วยงาน : </span>{request.department || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-0.5 px-1  w-1/2 text-sm border border-black">
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>อีเมล์ :  </span>{request.email || '-'}

                    </td>
                    <td className="p-0.5 px-1  w-1/2 text-sm border border-black">
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      เบอร์โทรศัพท์ : </span>{request.phone || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* ส่วนที่ 2 */}
            <div>
            <div 
                className="py-1 px-2 font-bold text-sm border border-black header-row"
                style={{ 
                  backgroundColor: '#e5e7eb'
                }}
              >
              <span style={{fontSize: '20px'}}>  ส่วนที่ 2 : ข้อมูลการขอเข้าพื้นที่</span>
              </div>
              <table className="w-full border-collapse border border-black">
                <tbody>
                  <tr>
                    <td className="p-0.5 px-1  w-1/2 text-sm border border-black">
                      <span style={{ fontSize: '20px', fontWeight: 'bold' }}>วันที่ต้องการเข้าพื้นที่ : </span> {formatDate(request.visit_date)}
                    </td>
                    <td className="p-0.5 px-1  w-1/2 text-sm border border-black">
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>  ช่วงเวลา : </span>  {`${request.visit_time_start || ''} - ${request.visit_time_end || ''}`}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-0.5 px-1  text-sm border border-black"><span style={{ fontSize: '20px', fontWeight: 'bold' }}> พื้นที่ควบคุมความปลอดภัย:</span></td>
                    <td className="p-0.5 px-1  border border-black" colSpan={2}>
                      <div className="flex items-center text-sm mb-1">
                        <div className={`w-3 px-1  h-3 mr-1 border border-black ${request.data_center ? 'bg-black' : ''}`}></div>
                        <input 
                          className="form-check-input me-2" 
                          type="checkbox" 
                          checked={request.data_center || ''}  
                          readOnly 
                        />
                        <label className="mr-3">ศูนย์ข้อมูล (Data center)</label>
                        <div className={`w-3 h-3 mr-1 border border-black ${request.support_room ? 'bg-black' : ''}`}></div>
                        <input 
                            className="form-check-input me-2" 
                            type="checkbox" 
                            checked={request.support_room || ''} 
                            readOnly 
                          />
                        <label className="mr-1">ห้องระบบสนับสนุน : {request.support_room_details || ''}
                        </label>
                      </div>
                    </td>
                  </tr>

                </tbody>
              </table>
              
              {/* วัตถุประสงค์ */}
              <table className="w-full border-collapse border-t-0 border border-black">
                <tbody>
                  <tr>
                    <td className="p-0.5 px-1 w-1/6 text-sm border border-black"><span style={{ fontSize: '20px', fontWeight: 'bold' }}>วัตถุประสงค์ : </span>{request.purpose || ''}</td>
                    
                    <td className="p-0.5 border border-black h-6">
                     
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* ชื่อผู้ประสานงาน */}
            <div>
              <div className="py-1 px-2 font-bold text-sm border border-black header-row">
                <span style={{fontSize:'20px'}}>ชื่อผู้ประสานงาน </span>
              </div>
              <table className="w-full border-collapse border border-black">
                <tbody>
                  <tr>
                    <td className="p-0.5 w-1/2 px-1 text-sm border border-black">
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      ชื่อ-สกุล : </span>{request.coordinator_fullname || ''}
                    </td>
                    <td className="p-0.5 w-1/2 px-1 text-sm border border-black">
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}> 
                      ตำแหน่ง : </span>{request.coordinator_dept_name_th || ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* รายละเอียดผู้เข้าพื้นที่ */}
            <div>
              <div className="py-1 px-2 font-bold text-sm border border-black header-row">
                รายละเอียดผู้เข้าพื้นที่
              </div>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th style={{ 
                      width: '40px', 
                      padding: '2px', 
                      textAlign: 'center', 
                      border: '1px solid black',
                      backgroundColor: '#e5e7eb',
                      fontWeight: 'bold'
                    }}>ลำดับ</th>
                    <th style={{ 
                      padding: '2px', 
                      textAlign: 'center', 
                      border: '1px solid black',
                      backgroundColor: '#e5e7eb',
                      fontWeight: 'bold'
                    }}>ชื่อ-สกุล</th>
                    <th style={{ 
                      padding: '2px', 
                      textAlign: 'center', 
                      border: '1px solid black',
                      backgroundColor: '#e5e7eb',
                      fontWeight: 'bold'
                    }}>หน่วยงาน</th>
                  </tr>
                </thead>
                <tbody>
                  {request.visitors && request.visitors.length > 0 ? (
                    request.visitors.map((visitor, index) => (
                      <tr key={index}>
                        <td className="p-0.5 text-center text-xs border border-black text-center">{index + 1}</td>
                        <td className="p-0.5 border border-black text-center">{visitor.name}</td>
                        <td className="p-0.5 border border-black text-center">{visitor.position}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-0.5 text-center border border-black">ไม่มีข้อมูลผู้เข้าพื้นที่</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* รายการของที่ต้องการนำเข้า-ออกพื้นที่ */}
<div className="mb-2">
  <div className="py-1 px-2 font-bold text-sm border border-black header-row">
    รายการของที่ต้องการนำเข้า-ออกพื้นที่
  </div>
  <table className="w-full border-collapse border border-black">
    <tbody>
      <tr>
        <td className="p-0.5 border border-black" colSpan={5}>
          <div className="d-flex gap-4 align-items-center">
            <div className="form-check mb-0">
              <input 
                className="form-check-input me-2" 
                type="checkbox" 
                checked={request.import_export_option === 'importAccess'} 
                readOnly 
              />
              <label className="form-check-label">นำของเข้า-ออกพื้นที่</label>
            </div>
            <div className="form-check mb-0">
              <input 
                className="form-check-input me-2" 
                type="checkbox" 
                checked={request.import_export_option !== 'importAccess'} 
                readOnly 
              />
              <label className="form-check-label">ไม่มีการนำของเข้า-ออกพื้นที่</label>
            </div>
          </div>
        </td>
      </tr>
      
      {request.import_export_option === 'importAccess' && (
        <>
          <tr>
            <th style={{ 
              width: '40px', 
              padding: '2px', 
              textAlign: 'center', 
              border: '1px solid black',
              backgroundColor: '#e5e7eb',
              fontWeight: 'bold'
            }}>ลำดับ</th>
            <th style={{ 
              padding: '2px', 
              textAlign: 'center', 
              border: '1px solid black',
              backgroundColor: '#e5e7eb',
              fontWeight: 'bold'
            }}>รายการสิ่งของ</th>
            <th style={{ 
              padding: '2px', 
              textAlign: 'center', 
              border: '1px solid black',
              backgroundColor: '#e5e7eb',
              fontWeight: 'bold'
            }}>จำนวน</th>
            <th style={{ 
              padding: '2px', 
              textAlign: 'center', 
              border: '1px solid black',
              backgroundColor: '#e5e7eb',
              fontWeight: 'bold'
            }}>นำเข้า</th>
            <th style={{ 
              padding: '2px', 
              textAlign: 'center', 
              border: '1px solid black',
              backgroundColor: '#e5e7eb',
              fontWeight: 'bold'
            }}>นำออก</th>
          </tr>
          {request.equipment && request.equipment.length > 0 ? (
            request.equipment.map((item, index) => (
              <tr key={index}>
                <td className="p-0.5 text-center text-xs border border-black ">{index + 1}</td>
                <td className="p-0.5 border border-black text-center">{item.name}</td>
                <td className="p-0.5 text-center border border-black ">
                  {parseInt(item.import_quantity) + parseInt(item.export_quantity) || 0}
                </td>
                <td className="p-0.5 text-center border border-black">
                  <div className="form-check d-flex justify-content-center">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      checked={parseInt(item.import_quantity) > 0} 
                      readOnly 
                    />
                  </div>
                </td>
                <td className="p-0.5 text-center border border-black">
                  <div className="form-check d-flex justify-content-center">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      checked={parseInt(item.export_quantity) > 0} 
                      readOnly 
                    />
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-0.5 text-center border border-black">ไม่มีข้อมูลรายการสิ่งของ</td>
            </tr>
          )}
        </>
      )}
    </tbody>
  </table>
</div>

{/* แยกส่วนที่ 3 ออกมาเป็นอิสระจากเงื่อนไขการนำของเข้า-ออก */}
<div className="mb-2">
  <div className="py-1 px-2 font-bold border border-black header-row"
    style={{ backgroundColor: '#e5e7eb' }}
  >
    <span style={{ fontSize: '20px', fontWeight:'bold' }}>ส่วนที่ 3 : การพิจารณาอนุมัติ</span>
  </div>
  <table className="w-full border-collapse border border-black">
    <tbody>
      <tr>
        <td className="p-0.5 px-1 text-sm border border-black">
          <div className="d-flex align-items-center flex-wrap" style={{ fontSize: '12px' }}>
            <div className="form-check me-4 mb-0 d-flex align-items-center">
              <input 
                className="form-check-input me-2" 
                type="checkbox" 
                checked={request.status === 'approved'} 
                readOnly 
              />
              <label className="form-check-label">อนุมัติ</label> 
            </div>
            <div className="form-check me-2 mb-0 d-flex align-items-center">
              <input 
                className="form-check-input me-2" 
                type="checkbox" 
                checked={request.status === 'rejected'} 
                readOnly 
              />
              <label className="form-check-label">ไม่อนุมัติ</label> 
            </div>
            {request.status === 'rejected' && (
              <span className="ms-1">
                เนื่องจาก: {request.status_comment || '-'}
              </span>
            )}
          </div>
          <div className="text-center mt-0 pt-1">
            <p>ลงชื่อ......................................ผู้อนุมัติ</p>
            <p className="mt-0">({request.approver || '..................................' })</p>
            <p className="mt-0">วันที่ {formatDate(request.approve_date || '........../............/............')}</p>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

{/* ส่วนแสดงเลขที่เอกสาร */}
<div className="d-flex justify-content-between align-items-start mt-2">
  <div className="text-left small text-muted">
    หมายเหตุ: หากรายการมีมากกว่านี้ สามารถระบุในเอกสารแนบ
  </div>
  <div className="text-right small text-muted">
    เลขที่เอกสาร: {request.document_number || '-'}
  </div>
</div>

 </div>

      </div>
      
      {/* ปุ่มพิมพ์ */}
      <div className="max-w-[210mm] mx-auto mt-4 text-center print-hidden print:hidden">
        <Button 
          variant="primary" 
          onClick={handlePrint}
          className="px-4 py-2"
        >
          <FaPrint className="me-2" /> พิมพ์แบบฟอร์ม
        </Button>
      </div>
    </div>
    </div>
  );
}