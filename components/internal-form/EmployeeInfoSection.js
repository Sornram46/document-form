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
  // 
  // เลือกผู้ใช้จากรายการแนะนำ
  const selectUser = (user) => {
    console.log('Selected user data:', user);
    
    // Make sure the username field from the API matches employeeId in the form
    // First, ensure we have the username from the API response
    if (!user.username) {
      console.error('Username is missing from API response:', user);
      return;
    }
    
    // Update form fields with user data
    const updates = [
      { name: 'employeeId', value: user.username },
      { name: 'firstName', value: user.first_name || '' },
      { name: 'lastName', value: user.last_name || '' },
      { name: 'department', value: user.dept_name_th || '' },
      
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
      <Form.Group className="mb-3 position-relative">
        <Form.Label><span style={{fontWeight:'600'}}>รหัสพนักงาน:</span></Form.Label>
        <div className="position-relative">
          <Form.Control
            type="text"
            name="employeeId"
            value={formData.employeeId}
            onChange={(e) => {
              handleInputChange(e);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="พิมพ์รหัสพนักงาน"
            required
            autoComplete="off"
            isInvalid={validated && !formData.employeeId}
          />
          <Form.Control.Feedback type="invalid">
            กรุณากรอกรหัสพนักงาน
          </Form.Control.Feedback>
          
          {loading && (
            <div className="position-absolute top-50 end-0 translate-middle-y me-2">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          
          {showSuggestions && suggestions.length > 0 && (
            <div 
            ref={suggestionsRef}
            className="position-absolute w-100 border rounded shadow-sm mt-1"
            style={{ 
              maxHeight: '250px', 
              overflowY: 'auto', 
              zIndex: 1000,
              backgroundColor: '#e8f5e9', // สีเขียวอ่อนแบบ Material Design
              borderColor: '#a5d6a7'      // สีเขียวอ่อนสำหรับขอบ
            }}
          >
              {suggestions.map((user, index) => (
      <div 
        key={index} 
        className="p-2 border-bottom suggestion-item"
        onClick={() => selectUser(user)}
        style={{ 
          cursor: 'pointer',
          backgroundColor: index % 2 === 0 ? '#e8f5e9' : '#c8e6c9' // สีสลับแถว
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#81c784'} // สีเขียวเข้มเมื่อ hover
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#e8f5e9' : '#c8e6c9'} // กลับสู่สีเดิมเมื่อไม่ hover
      >
        <div><strong>รหัส: {user.username}</strong></div>
        <div className="small text-muted">ชื่อ: {user.first_name || 'ไม่ระบุ'}</div>
        <div className="small text-muted">นามสกุล: {user.last_name || 'ไม่ระบุ'}</div>
        <div className="small text-muted">แผนก: {user.dept_name_th || 'ไม่ระบุ'}</div>
      </div>
              ))}
            </div>
          )}
        </div>
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label><span style={{fontWeight:'600'}}>ชื่อ:</span></Form.Label>
        <Form.Control
          type="text"
          name="firstName"
          value={formData.firstName} 
          onChange={handleInputChange}
          required
          isInvalid={validated && !formData.firstName}
          readOnly
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
          value={formData.lastName}
          onChange={handleInputChange}
          required
          isInvalid={validated && !formData.lastName}
          readOnly
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
          value={formData.requestDate}
          onChange={handleInputChange}
          required
          isInvalid={validated && !formData.requestDate}
        />
        <Form.Control.Feedback type="invalid">
          กรุณากรอกวันที่ร้องขอ
        </Form.Control.Feedback>
      </Form.Group>
        
      <Form.Group className="mb-3">
        <Form.Label><span style={{fontWeight:'600'}}>แผนก:</span></Form.Label>
        <Form.Control
          type="text"
          name="department"
          value={formData.department}
          onChange={handleInputChange}
          required
          isInvalid={validated && !formData.department}
        />
        <Form.Control.Feedback type="invalid">
          กรุณากรอกแผนก
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label><span style={{fontWeight:'600'}}>เบอร์โทรศัพท์:</span></Form.Label>
        <Form.Control
          type="tel"
          name="phone"
          value={formData.phone}
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