import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
import '../styles/index.css';
import Head from 'next/head';
import Swal from 'sweetalert2';

export default function Home() {
  const handleDashboardClick = () => {
    Swal.fire({
      title: 'ไม่สามารถเข้าถึงได้',
      text: 'ขออภัย ระบบแดชบอร์ดยังไม่เปิดให้บริการ',
      icon: 'warning',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#3085d6',
      footer: 'จะเปิดให้บริการเร็วๆ นี้'
    });
  };
  return (
    <>
      <Head>
        <title>ระบบขออนุญาตเข้าพื้นที่ - โรงพยาบาลบางปะกอก9 อินเตอร์เนชั่นแนล</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </Head>

      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
        {/* ส่วนหัวข้อหลัก */}
        <div className="text-center mb-3">
          <h1 className="display-5 fw-bold text-primary">ระบบขออนุญาตเข้าพื้นที่</h1>
          <div className="border-bottom border-primary w-50 mx-auto my-2" style={{ borderWidth: '3px !important' }}></div>
          <h2 className="h4 text-secondary">โรงพยาบาลบางปะกอก9 อินเตอร์เนชั่นแนล</h2>
        </div>
        
        <div className="container text-center">
          <h3 className="h5 mb-3 text-muted">เลือกประเภทการขออนุญาต</h3>
          
          {/* แถวที่ 1 - บุคคลภายนอกและภายใน */}
          <div className="row g-3 mb-3">
            {/* เปลี่ยนจาก col-12 col-md-6 เป็น col-6 เพื่อให้แสดง 2 การ์ดต่อแถวทุกขนาดหน้าจอ */}
            <div className="col-6">
              <Link href="/external-form" className="text-decoration-none">
                <div className="card shadow p-3 hover-effect h-100">
                  <div className="card-body p-2">
                    <div className="icon-container">👤</div>
                    <p className="mt-1 fw-bold card-text">บุคคลภายนอก</p>
                  </div>
                </div>
              </Link>
            </div>
            
            <div className="col-6">
              <Link href="/internal-form" className="text-decoration-none">
                <div className="card shadow p-3 hover-effect h-100">
                  <div className="card-body p-2">
                    <div className="icon-container">👥</div>
                    <p className="mt-1 fw-bold card-text">บุคคลภายใน</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
          
          {/* แถวที่ 2 - การจัดการและแดชบอร์ด */}
          <div className="row g-3">
            <div className="col-6">
              <Link href="/admin/login" className="text-decoration-none">
                <div className="card shadow p-3 py-4 hover-effect h-100">
                  <div className="card-body p-2">
                    <div className="icon-container">⚙️</div>
                    <p className="mt-1 fw-bold card-text">การจัดการ</p>
                  </div>
                </div>
              </Link>
            </div>
            
            <div className="col-6">
              <div className="card shadow p-3 hover-effect h-100"
               onClick={handleDashboardClick}
               >
                
                <div className="card-body p-2">
                  <div className="icon-container">📈</div>
                  <p className="mt-1 fw-bold card-text">แดชบอร์ด</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-muted">
            <small>&copy; 2025 โรงพยาบาลบางปะกอก9 อินเตอร์เนชั่นแนล</small>
          </div>
        </div>
      </div>
    </>
  );
}