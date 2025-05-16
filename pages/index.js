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
  
  // สร้างอาเรย์เก็บข้อมูลของ cards ทั้งหมด เพื่อให้ง่ายต่อการเพิ่ม/แก้ไขในอนาคต
  const menuItems = [
    {
      title: "ฟอร์มขอเข้าพื้นที่",
      icon: "👤",
      link: "/combined-form",
      isLink: true
    },
    {
      title: "การจัดการ",
      icon: "⚙️",
      link: "/admin/login",
      isLink: true
    },
    {
      title: "แดชบอร์ด",
      icon: "📈",
      onClick: handleDashboardClick,
      isLink: false
    }
    // สามารถเพิ่ม items ใหม่ได้ที่นี่ในอนาคต เช่น:
    // {
    //   title: "รายงาน",
    //   icon: "📃",
    //   link: "/reports",
    //   isLink: true
    // }
  ];

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
          
          {/* ใช้เพียง row เดียว โดยไม่ต้องแบ่งเป็นหลายแถว */}
          <div className="row g-3">
            {menuItems.map((item, index) => (
              <div className="col-6" key={index}>
                {item.isLink ? (
                  <Link href={item.link} className="text-decoration-none">
                    <div className="card shadow p-3 hover-effect h-100">
                      <div className="card-body p-2">
                        <div className="icon-container">{item.icon}</div>
                        <p className="mt-1 fw-bold card-text">{item.title}</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div 
                    className="card shadow p-3 hover-effect h-100"
                    onClick={item.onClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body p-2">
                      <div className="icon-container">{item.icon}</div>
                      <p className="mt-1 fw-bold card-text">{item.title}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-muted">
            <small>&copy; 2025 โรงพยาบาลบางปะกอก9 อินเตอร์เนชั่นแนล</small>
          </div>
        </div>
      </div>
    </>
  );
}