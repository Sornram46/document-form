import { Form } from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';

export default function EmployeeInfoSection({ formData, handleInputChange, validated }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const suggestionsRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const [fieldsLocked, setFieldsLocked] = useState(false);
  
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

  useEffect(() => {
    function handleKeyDown(e) {
      if (!showSuggestions || suggestions.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prevIndex => {
            const newIndex = prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0;
            const element = document.getElementById(`suggestion-item-${newIndex}`);
            if (element) element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            return newIndex;
          });
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prevIndex => {
            const newIndex = prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1;
            const element = document.getElementById(`suggestion-item-${newIndex}`);
            if (element) element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            return newIndex;
          });
          break;
          
        case 'Enter':
          if (selectedIndex >= 0) {
            e.preventDefault();
            selectUser(suggestions[selectedIndex]);
          }
          break;
          
        case 'Escape':
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
          
        default:
          break;
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSuggestions, selectedIndex, suggestions]);
  
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
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.employeeId) {
        fetchUsers(formData.employeeId);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [formData.employeeId]);
  
  const selectUser = (user) => {
    console.log('Selected user data:', user);
    
    if (!user.username) {
      console.error('Username is missing from API response:', user);
      return;
    }
    
    const updates = [
      { name: 'employeeId', value: user.username },
      { name: 'firstName', value: user.first_name || '' },
      { name: 'lastName', value: user.last_name || '' },
      { name: 'department', value: user.dept_name_th || '' },
      { name: 'phone', value: user.phone_num || '' }
    ];
    
    updates.forEach(update => {
      console.log(`Updating ${update.name} to:`, update.value);
      handleInputChange({
        target: update
      });
    });
    
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setFieldsLocked(true);
  };
  
  return (
    <div>
      <Form.Group className="mb-3 position-relative">
        <Form.Label><span style={{fontWeight:'600'}}>รหัสพนักงาน:</span></Form.Label>
        <div className="position-relative">
          <Form.Control
            ref={inputRef}
            type="text"
            name="employeeId"
            value={formData.employeeId}
            onChange={(e) => {
              handleInputChange(e);
              setShowSuggestions(true);
              setFieldsLocked(false);
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
              backgroundColor: '#e8f5e9',
              borderColor: '#a5d6a7'
            }}
          >
              {suggestions.map((user, index) => (
                <div 
                  id={`suggestion-item-${index}`}
                  key={index} 
                  className="p-2 border-bottom suggestion-item"
                  onClick={() => selectUser(user)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: index === selectedIndex 
                      ? '#4caf50'
                      : (index % 2 === 0 ? '#e8f5e9' : '#c8e6c9'),
                    color: index === selectedIndex ? 'white' : 'inherit'
                  }}
                >
                  <div><strong>รหัส: {user.username}</strong></div>
                  <div className="small text-muted" style={index === selectedIndex ? {color: '#e8f5e9'} : {}}>ชื่อ: {user.first_name || 'ไม่ระบุ'}</div>
                  <div className="small text-muted" style={index === selectedIndex ? {color: '#e8f5e9'} : {}}>นามสกุล: {user.last_name || 'ไม่ระบุ'}</div>
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
            onChange={(e) => {
              // อนุญาตเฉพาะตัวอักษรไทย อังกฤษ และช่องว่าง
              const value = e.target.value.replace(/[^a-zA-Zก-๙\s]/g, '');
              handleInputChange({
                target: {
                  name: 'firstName',
                  value
                }
              });
            }}
            onKeyPress={(e) => {
              // ป้องกันการพิมพ์ตัวเลขและสัญลักษณ์พิเศษ
              const allowedPattern = /[a-zA-Zก-๙\s]/;
              if (!allowedPattern.test(e.key)) {
                e.preventDefault();
              }
            }}
            required
            isInvalid={validated && !formData.firstName}
            readOnly={fieldsLocked}
            style={fieldsLocked ? { backgroundColor: '#f8f9fa', borderColor: '#ced4da' } : {}}
            placeholder="กรอกชื่อ (ตัวอักษรเท่านั้น)"
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
          onChange={(e) => {
            // อนุญาตเฉพาะตัวอักษรไทย อังกฤษ และช่องว่าง
            const value = e.target.value.replace(/[^a-zA-Zก-๙\s]/g, '');
            handleInputChange({
              target: {
                name: 'lastName',
                value
              }
            });
          }}
          onKeyPress={(e) => {
            // ป้องกันการพิมพ์ตัวเลขและสัญลักษณ์พิเศษ
            const allowedPattern = /[a-zA-Zก-๙\s]/;
            if (!allowedPattern.test(e.key)) {
              e.preventDefault();
            }
          }}
          required
          isInvalid={validated && !formData.lastName}
          readOnly={fieldsLocked}
          style={fieldsLocked ? { backgroundColor: '#f8f9fa', borderColor: '#ced4da' } : {}}
          placeholder="กรอกนามสกุล (ตัวอักษรเท่านั้น)"
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
          readOnly={fieldsLocked}
          style={fieldsLocked ? { backgroundColor: '#f8f9fa', borderColor: '#ced4da' } : {}}
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
            const value = e.target.value.replace(/\D/g, '');
            handleInputChange({
              target: {
                name: 'phone',
                value
              }
            });
          }}
          onKeyPress={(e) => {
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