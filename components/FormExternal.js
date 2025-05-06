import { useState } from "react";
import Swal from "sweetalert2"; // Import SweetAlert2

export default function Form() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch("/api/submit-external-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // ใช้ SweetAlert2 แทน alert สำหรับการแจ้งเตือนสำเร็จ
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ!',
          text: 'บันทึกข้อมูลเรียบร้อยแล้ว',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#3085d6'
        });
      } else {
        // ดึงข้อมูล error จาก response และใช้ SweetAlert2 แสดงข้อผิดพลาด
        const errorData = await res.json();
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด!',
          text: errorData.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#d33'
        });
      }
    } catch (error) {
      // จัดการกรณี network error
      console.error("Error submitting form:", error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดการเชื่อมต่อ!',
        text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#d33'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="ชื่อ"
        className="w-full p-2 border rounded"
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="อีเมล"
        className="w-full p-2 border rounded"
        onChange={handleChange}
        required
      />
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
        ส่งข้อมูล
      </button>
    </form>
  );
}
