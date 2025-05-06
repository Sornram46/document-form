import { Form } from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';

export default function EmployeeInfoSection({ formData, handleInputChange, validated }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const suggestionsRef = useRef(null);
  
  // สำหรับปิด suggestions เมื่อคลิกนอก dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // ดึงข้อมูลพนักงานจาก API
  const fetchUsers = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/request-details-section?search=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.employeeId) {
        fetchUsers(formData.employeeId);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [formData.employeeId]);
  
  // เลือกผู้ใช้จากรายการแนะนำ
  const selectUser = (user) => {
    console.log('Selected user data:', user);
    
    // Make sure the username field from the API matches employeeId in the form
    if (!user.username) {
      console.error('Username is missing from API response:', user);
      return;
    }
    
    // Update form fields with user data for external visitor
    const updates = [
      { name: 'firstName', value: user.first_name || '' },
      { name: 'lastName', value: user.last_name || '' },
      { name: 'companyName', value: user.company_name || '' }, // เปลี่ยนจาก department เป็น companyName
      { name: 'phone', value: user.phone_num || '' }
    ];
    
    // Apply each update using the handleInputChange function
    updates.forEach(update => {
      console.log(`Updating ${update.name} to:`, update.value);
      handleInputChange({
        target: update
      });
    });
    
    setShowSuggestions(false);
  };
  
  return (
    <div>
      {/* ถ้าต้องการแสดงรายการผู้ใช้จาก suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="position-relative">
          <div 
            ref={suggestionsRef}
            className="position-absolute start-0 w-100 bg-white border rounded shadow-sm" 
            style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}
          >
            {suggestions.map((user) => (
              <div 
                key={user.username}
                className="p-2 border-bottom cursor-pointer hover-bg-light"
                onClick={() => selectUser(user)}
              >
                <div><strong>รหัส: {user.username}</strong></div>
                <div className="small text-muted">ชื่อ: {user.first_name || 'ไม่ระบุ'}</div>
                <div className="small text-muted">นามสกุล: {user.last_name || 'ไม่ระบุ'}</div>
                <div className="small text-muted">บริษัท: {user.company_name || 'ไม่ระบุ'}</div> {/* เปลี่ยนจาก แผนก เป็น บริษัท */}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Form.Group className="mb-3">
        <Form.Label><span style={{fontWeight:'600'}}>ชื่อ:</span></Form.Label>
        <Form.Control
          type="text"
          name="firstName"
          value={formData.firstName || ''} 
          onChange={handleInputChange}
          required
          isInvalid={validated && !formData.firstName}
        />
        <Form.Control.Feedback type="invalid">
          กรุณากรอกชื่อ
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label><span style={{fontWeight:'600'}}>นามสกุล:</span></Form.Label>
        <Form.Control
          type="text"
          name="lastName"
          value={formData.lastName || ''}
          onChange={handleInputChange}
          required
          isInvalid={validated && !formData.lastName}
        />
        <Form.Control.Feedback type="invalid">
          กรุณากรอกนามสกุล
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label><span style={{fontWeight:'600'}}>วันที่ร้องขอ:</span></Form.Label>
        <Form.Control
          type="date"
          name="requestDate"
          value={formData.requestDate || ''}
          onChange={handleInputChange}
          required
          isInvalid={validated && !formData.requestDate}
        />
        <Form.Control.Feedback type="invalid">
          กรุณากรอกวันที่ร้องขอ
        </Form.Control.Feedback>
      </Form.Group>
        
      <Form.Group className="mb-3">
        <Form.Label><span style={{fontWeight:'600'}}>บริษัท:</span></Form.Label>
        <Form.Control
          type="text"
          name="company"
          value={formData.company || ''}
          onChange={handleInputChange}
          required
          isInvalid={validated && !formData.company}
        />
        <Form.Control.Feedback type="invalid">
          กรุณากรอกชื่อบริษัท
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label><span style={{fontWeight:'600'}}>เบอร์โทรศัพท์:</span></Form.Label>
        <Form.Control
          type="tel"
          name="phone"
          value={formData.phone || ''}
          onChange={(e) => {
            // รับเฉพาะตัวเลขเท่านั้น
            const value = e.target.value.replace(/\D/g, '');
            handleInputChange({
              target: {
                name: 'phone',
                value
              }
            });
          }}
          onKeyPress={(e) => {
            // ป้องกันการพิมพ์อักขระที่ไม่ใช่ตัวเลข
            if (!/[0-9]/.test(e.key)) {
              e.preventDefault();
            }
          }}
          required
          isInvalid={validated && !formData.phone}
        />
        <Form.Control.Feedback type="invalid">
          กรุณากรอกเบอร์โทรศัพท์
        </Form.Control.Feedback>
      </Form.Group> 

    </div>
  );
}