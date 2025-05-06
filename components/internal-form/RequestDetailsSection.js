import { Form, FormControl, FormGroup, FormLabel, FormSelect, Button, Row, Col } from 'react-bootstrap';
import { useState, useEffect } from 'react';

export default function RequestDetailsSection({ formData, handleInputChange, validated }) {
    // กำหนด default values ให้กับ equipment และ visitors เพื่อป้องกัน undefined
    const [equipment, setEquipment] = useState(
        Array.isArray(formData.equipment) ? formData.equipment : [{ name: '', importQuantity: 0, exportQuantity: 0 }]
    );
    
    const [visitors, setVisitors] = useState(
        Array.isArray(formData.visitors) ? formData.visitors : [{ name: '', position: '' }]
    );
    
    // อัพเดตเมื่อ formData เปลี่ยน
    useEffect(() => {
        if (Array.isArray(formData.equipment)) {
            setEquipment(formData.equipment);
        }
        
        if (Array.isArray(formData.visitors)) {
            setVisitors(formData.visitors);
        }
        
        setSupportRoomChecked(Boolean(formData.supportRoom));
        setShowImportList(formData.importExportOption === 'importAccess');
    }, [formData]);
    
    // ใช้ค่าจาก props ถ้ามี หรือใช้ค่าเริ่มต้น
    const [supportRoomChecked, setSupportRoomChecked] = useState(formData.supportRoom || false);
    
    // ปรับปรุงข้อมูลเมื่อ props เปลี่ยน
    useEffect(() => {
        if (formData.supportRoom !== undefined) {
            setSupportRoomChecked(formData.supportRoom);
        }
        
        if (formData.visitors && formData.visitors.length > 0) {
            setVisitors(formData.visitors);
        }
    }, [formData.supportRoom, formData.visitors]);

    const [showImportList, setShowImportList] = useState(formData.importExportOption === 'importAccess');
    
    useEffect(() => {
        setShowImportList(formData.importExportOption === 'importAccess');
    }, [formData.importExportOption]);

    useEffect(() => {
        if (formData.equipment && Array.isArray(formData.equipment)) {
            setEquipment(formData.equipment);
        }
    }, [formData.equipment]);
    
    // เพิ่ม state สำหรับผู้ประสานงาน
    const [coordinators, setCoordinators] = useState([]);
    const [loadingCoordinators, setLoadingCoordinators] = useState(false);

    // ดึงข้อมูลผู้ประสานงานจาก API
    useEffect(() => {
        const fetchCoordinators = async () => {
            setLoadingCoordinators(true);
            try {
                console.log('Fetching coordinators...');
                const response = await fetch('/api/get-coordinators');
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
                
                try {
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new Error('Server returned non-JSON response');
                    }
                    
                    const data = await response.json();
                    console.log('Fetched coordinators:', data);
                    
                    if (Array.isArray(data) && data.length > 0) {
                        setCoordinators(data);
                    } else {
                        console.warn('No coordinators found or empty array received');
                        // ใช้ข้อมูลจำลองหากไม่พบข้อมูล
                        const mockData = [
                            { username: '1001', first_name: 'สมชาย', last_name: 'ใจดี', dept_name_th: 'เทคโนโลยีสารสนเทศ', position: 'ผู้ประสานงานระบบ' },
                            { username: '1002', first_name: 'วิภา', last_name: 'รักดี', dept_name_th: 'เทคโนโลยีสารสนเทศ', position: 'ผู้ดูแลระบบ' }
                        ];
                        setCoordinators(mockData);
                    }
                } catch (parseError) {
                    console.error('Error parsing JSON response:', parseError);
                    throw parseError;
                }
            } catch (error) {
                console.error('Error fetching coordinators:', error);
                
                // ถ้าเกิด error ให้ใช้ข้อมูลจำลอง
                const mockData = [
                    { username: '1001', first_name: 'สมชาย', last_name: 'ใจดี', dept_name_th: 'เทคโนโลยีสารสนเทศ', position: 'ผู้ประสานงานระบบ' },
                    { username: '1002', first_name: 'วิภา', last_name: 'รักดี', dept_name_th: 'เทคโนโลยีสารสนเทศ', position: 'ผู้ดูแลระบบ' }
                ];
                setCoordinators(mockData);
            } finally {
                setLoadingCoordinators(false);
            }
        };
        
        fetchCoordinators();
    }, []);
    
    // เมื่อเลือกผู้ประสานงาน อัปเดตตำแหน่งอัตโนมัติและเก็บข้อมูลเพิ่มเติม
    const handleCoordinatorChange = (e) => {
        const selectedUsername = e.target.value;
        const selectedCoordinator = coordinators.find(c => c.username === selectedUsername);
        
        // อัปเดตค่าผู้ประสานงานที่เลือก
        handleInputChange(e);
        
        if (selectedCoordinator) {
            // เก็บข้อมูลชื่อ-นามสกุลเพื่อใช้ในการบันทึกลงฐานข้อมูล
            handleInputChange({
                target: {
                    name: 'coordinatorFullName',
                    value: `${selectedCoordinator.first_name} ${selectedCoordinator.last_name}`
                }
            });
            
            // เก็บข้อมูลแผนกเพื่อใช้ในการบันทึกลงฐานข้อมูล
            handleInputChange({
                target: {
                    name: 'coordinatorDept',
                    value: selectedCoordinator.dept_name_th || 'ไม่ระบุแผนก'
                }
            });
            
            // หากมีข้อมูลตำแหน่ง ให้อัปเดตช่องตำแหน่งด้วย
            if (selectedCoordinator.position) {
                handleInputChange({
                    target: {
                        name: 'rank',
                        value: selectedCoordinator.position
                    }
                });
            }
        }
    };

    // ตั้งค่าวันที่เริ่มต้นเมื่อ component ถูกโหลด
    useEffect(() => {
        // สร้างวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        
        // อัปเดตวันที่เฉพาะเมื่อยังไม่มีการตั้งค่า
        if (!formData.visitDate) {
            handleInputChange({
                target: {
                    name: 'visitDate',
                    value: today
                }
            });
        }
    }, []); // ทำงานเฉพาะครั้งแรกที่ component ถูก render

    // แก้ไข handleInputChange ให้รองรับ checkbox
    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        
        // อัพเดต local state สำหรับ supportRoom
        if (name === 'supportRoom') {
            setSupportRoomChecked(checked);
        }
        
        // ส่งการเปลี่ยนแปลงไปยัง parent component
        handleInputChange({
            target: {
                name,
                value: checked,
                type: 'checkbox',
                checked
            }
        });
    };

    const handleAddVisitor = () => {
        setVisitors([...visitors, { name: '', position: '' }]);
    };

    const handleVisitorChange = (index, value) => {
        const newVisitors = [...visitors];
        newVisitors[index].name = value;
        handleInputChange({
            target: {
                name: 'visitors',
                value: newVisitors
            }
        });
    };

    const handleVisitorPositionChange = (index, value) => {
        const newVisitors = [...visitors];
        newVisitors[index].position = value;
        setVisitors(newVisitors);
        handleInputChange({
            target: {
                name: 'visitors',
                value: newVisitors
            }
        });
    };

    const handleRemoveVisitor = (index) => {
        const newVisitors = visitors.filter((_, i) => i !== index);
        setVisitors(newVisitors);
        handleInputChange({
            target: {
                name: 'visitors',
                value: newVisitors
            }
        });
    };

    const handleImportAccessChange = (e) => {
        const isImportAccess = e.target.id === 'importAccess';
        setShowImportList(isImportAccess);
        
        // Update state with one value instead of two separate values
        handleInputChange({
            target: {
                name: 'importExportOption',
                value: isImportAccess ? 'importAccess' : 'nonImportAccess'
            }
        });
    };

    const handleAddEquipment = () => {
        const newEquipment = [
            ...equipment, 
            { 
              name: '', 
              importQuantity: 0, 
              exportQuantity: 0 
            }
          ];
          
          setEquipment(newEquipment);
          
          // อัปเดตข้อมูลหลักด้วย
          handleInputChange({
            target: {
              name: 'equipment',
              value: newEquipment
            }
          });
          
          // แสดงข้อมูลใหม่ที่เพิ่ม
          console.log('New equipment after adding:', newEquipment);
    };

    // แก้ไขฟังก์ชันนี้
    const handleEquipmentChange = (index, value) => {
        const newEquipment = [...equipment];
        newEquipment[index].name = value;
        
        setEquipment(newEquipment);
        
        // ส่งข้อมูลอัพเดตกลับไปยัง parent component
        handleInputChange({
            target: {
            name: 'equipment',
            value: newEquipment
            }
        });
        
        // แสดงข้อมูลที่อัปเดต
        console.log('Updated equipment after change:', newEquipment);
    };

    // เพิ่มฟังก์ชันสำหรับจัดการจำนวนนำเข้า
    const handleEquipmentImportQuantityChange = (index, value) => {
        const newEquipment = [...equipment];
        
        // แปลงค่าให้เป็นตัวเลขก่อนบันทึก
        const numValue = Number(value);
        newEquipment[index].importQuantity = Math.max(0, numValue);
        
        setEquipment(newEquipment);
        handleInputChange({
            target: {
                name: 'equipment',
                value: newEquipment
            }
        });
    };

    // เพิ่มฟังก์ชันใหม่สำหรับจัดการจำนวนนำออกโดยเฉพาะ
    const handleEquipmentExportQuantityChange = (index, value) => {
        const newEquipment = [...equipment];
        
        // แปลงค่าให้เป็นตัวเลข
        const numValue = Number(value);
        newEquipment[index].exportQuantity = Math.max(0, numValue);
        
        setEquipment(newEquipment);
        handleInputChange({
            target: {
                name: 'equipment',
                value: newEquipment
            }
        });
    };

    const handleRemoveEquipment = (index) => {
        const newEquipment = equipment.filter((_, i) => i !== index);
        setEquipment(newEquipment);
        handleInputChange({
            target: {
                name: 'equipment',
                value: newEquipment
            }
        });
    };

    return (
        <div>
            <Form.Group className="mb-3">
                <Form.Label><span style={{fontWeight:'900'}}>วันที่ต้องการเข้าพื้นที่:</span></Form.Label>
                <Form.Control
                    type="date"
                    name="visitDate"
                    value={formData.visitDate}
                    onChange={handleInputChange}
                    required
                    isInvalid={validated && !formData.visitDate}
                />
                <Form.Control.Feedback type="invalid">
                    กรุณาเลือกวันที่ต้องการเข้าพื้นที่
                </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>ช่วงเวลา</Form.Label>
                <div className="d-flex align-items-center gap-2">
                    <Form.Control
                        type="time"
                        name="visitTimeStart"
                        value={formData.visitTimeStart}
                        onChange={handleInputChange}
                        required
                        style={{ width: '140px' }}
                    />
                    <span>ถึง</span>
                    <Form.Control
                        type="time"
                        name="visitTimeEnd"
                        value={formData.visitTimeEnd}
                        onChange={handleInputChange}
                        required
                        style={{ width: '140px' }}
                    />
                </div>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label><span style={{fontWeight:'600'}}>พื้นที่ควบคุมความปลอดภัย:</span></Form.Label>
                <div className="border rounded p-3 mb-2">
                    <Form.Check
                        type="checkbox"
                        id="dataCenter"
                        name="dataCenter"
                        label="ศูนย์ข้อมูล (Data Center)"
                        checked={formData.dataCenter || false} // ป้องกัน undefined
                        onChange={handleCheckboxChange} // เปลี่ยนเป็น handleCheckboxChange
                    />
                    <Form.Check
                        type="checkbox"
                        id="supportRoom"
                        name="supportRoom"
                        label="ห้องระบบสนับสนุน"
                        checked={formData.supportRoom || false} // ป้องกัน undefined
                        onChange={handleCheckboxChange} // เปลี่ยนเป็น handleCheckboxChange
                    />
                    {supportRoomChecked && (
                        <Form.Control
                            type="text"
                            placeholder="ระบุรายละเอียดห้องระบบสนับสนุน"
                            className="mt-2"
                            name="supportRoomDetails"
                            value={formData.supportRoomDetails || ''}
                            onChange={handleInputChange}
                            required
                        />
                    )}
                </div>
            </Form.Group>


            <Form.Group className="mb-3">
                <Form.Label><span style={{fontWeight:'600'}}>วัตถุประสงค์ที่เข้ามาปฎิบัติงาน: </span></Form.Label>
                <Form.Control
                    type="text"
                    placeholder='โปรดระบุวัตถุประสงค์'
                    name='purpose'
                    value={formData.purpose || ''}
                    onChange={handleInputChange}
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label><span style={{fontWeight:'600'}}>ชื่อผู้ประสานงาน:</span></Form.Label>
                {loadingCoordinators ? (
                    <div className="d-flex align-items-center mt-2">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">กำลังโหลด...</span>
                        </div>
                        <span className="ms-2">กำลังโหลดรายชื่อผู้ประสานงาน...</span>
                    </div>
                ) : (
                    <Form.Select
                        name="coordinator"
                        value={formData.coordinator || ''}
                        onChange={handleCoordinatorChange}
                        required
                    >
                        <option value="">เลือกผู้ประสานงาน</option>
                        {coordinators.map((coordinator) => (
                            <option key={coordinator.username} value={coordinator.username}>
                                {coordinator.first_name} {coordinator.last_name} ({coordinator.dept_name_th || 'ไม่ระบุแผนก'})
                            </option>
                        ))}
                    </Form.Select>
                )}
            </Form.Group>
            
            <Form.Group className="mb-3">
                <Form.Label><span style={{fontWeight:'600'}}>ตำแหน่ง:</span></Form.Label>
                <Form.Control
                    type="text"
                    name="rank"
                    value={formData.rank || ''}
                    onChange={handleInputChange}
                    readOnly  // ทำให้เป็น read-only เพราะจะอัปเดตอัตโนมัติเมื่อเลือกผู้ประสานงาน
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label><span style={{fontWeight:'600'}}>รายชื่อผู้เข้าพื้นที่:</span></Form.Label>
                    <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={handleAddVisitor}
                    >
                        + เพิ่มผู้เข้าพื้นที่
                    </Button>
                </div>
                {visitors.map((visitor, index) => (
    <div key={index} className="mb-3 border rounded p-3 position-relative">
        <div className="mb-2">    
            <div className="d-flex gap-2">
                <Form.Control
                    type="text"
                    placeholder="ระบุรายชื่อผู้เข้าพื้นที่"
                    value={visitor.name || ''}
                    onChange={(e) => handleVisitorChange(index, e.target.value)}
                    required
                />
                {visitors.length > 1 && (
                    <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleRemoveVisitor(index)}
                    >
                        ลบ
                    </Button>  
                )}
            </div>
        </div>
        <div>
            <Form.Control
                type="text"
                placeholder="ตำแหน่ง"
                value={visitor.position || ''}
                onChange={(e) => handleVisitorPositionChange(index, e.target.value)}
                required
            />
        </div>
    </div>
))}
            </Form.Group>

            <FormGroup className="mb-3">
                <FormLabel><span style={{fontWeight:'600'}}>รายการของที่ต้องการนำ เข้า-ออกพื้นที่:</span></FormLabel>
                <div>
                    <Form.Check 
                        type="radio"
                        label="นำเข้า-ออกพื้นที่"
                        id="importAccess"
                        name="importExportOption"
                        value="importAccess"
                        checked={formData.importExportOption === 'importAccess'}
                        onChange={handleImportAccessChange}
                        required
                    />
                    <Form.Check 
                        type="radio"
                        label="ไม่มีการนำเข้า-ออกพื้นที่"
                        id="nonImportAccess"
                        name="importExportOption"
                        value="nonImportAccess"
                        checked={formData.importExportOption === 'nonImportAccess'}
                        onChange={handleImportAccessChange}
                        required
                    />
                </div>
            </FormGroup>

            {showImportList && (
                <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label><span style={{fontWeight:'600'}}>อุปกรณ์เข้าพื้นที่:</span></Form.Label>
                        <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={handleAddEquipment}
                        >
                            + เพิ่มอุปกรณ์
                        </Button>
                    </div>
                    {equipment && equipment.length > 0 ? (
                        equipment.map((item, index) => (
                            <div key={index} className="mb-3 border-bottom pb-3">
                                <div className="d-flex gap-2 mb-2">
                                    <Form.Control
                                        type="text"
                                        placeholder="ระบุรายการอุปกรณ์ที่ต้องการนำเข้า-ออกพื้นที่"
                                        value={item.name}
                                        onChange={(e) => handleEquipmentChange(index, e.target.value)}
                                        required
                                    />
                                    {equipment.length > 1 && (
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm"
                                            onClick={() => handleRemoveEquipment(index)}
                                        >
                                            ลบ
                                        </Button>
                                    )}
                                </div>
                                
                                <div className="d-flex mt-3">
                                    {/* ส่วนนำเข้า */}
                                    <div className="d-flex align-items-center me-2">
                                        <Form.Label className="me-1 mb-0">นำเข้า:</Form.Label>
                                        <div className="d-flex align-items-center">
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                onClick={() => handleEquipmentImportQuantityChange(index, Math.max(0, (item.importQuantity || 0) - 1))}
                                                type="button"
                                            >
                                                -
                                            </Button>
                                            <Form.Control
                                                type="text"  // เปลี่ยนจาก text เป็น number
                                                name={`importQuantity-${index}`}
                                                value={item.importQuantity || 0}
                                                onChange={(e) => handleEquipmentImportQuantityChange(index, e.target.value)}
                                                style={{ 
                                                    width: '68px', 
                                                    textAlign: 'center',
                                                    color: 'black',
                                                    backgroundColor: 'white',
                                                    
                                                    border: '1px solid #ced4da',
                                                    boxShadow: 'none !important',
                                                    appearance: 'textfield', // ปิดการแสดงลูกศรขึ้น-ลง
                                                    MozAppearance: 'textfield'
                                                   
                                                }}
                                                min={0}
                                                className="equipment-quantity"
                                            />
                                            <Button
                                                variant="outline-secondary" 
                                                size="sm" 
                                                onClick={() => handleEquipmentImportQuantityChange(index, (item.importQuantity || 0) + 1)}
                                                type="button"
                                            >
                                                +
                                            </Button>
                                        </div>
                                    </div>

                                    {/* ส่วนนำออก */}
                                    <div className="d-flex align-items-center">
                                        <Form.Label className="me-1 mb-0">นำออก:</Form.Label>
                                        <div className="d-flex align-items-center">
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                onClick={() => handleEquipmentExportQuantityChange(index, Math.max(0, (item.exportQuantity || 0) - 1))}
                                                type="button"
                                            >
                                                -
                                            </Button>
                                            <Form.Control
                                                type="text" 
                                                name={`exportQuantity-${index}`}
                                                value={item.exportQuantity || 0}
                                                onChange={(e) => handleEquipmentExportQuantityChange(index, e.target.value)}
                                                style={{ 
                                                    width: '68px', 
                                                    textAlign: 'center',
                                                    color: 'black',
                                                    backgroundColor: 'white',
                                                   
                                                    border: '1px solid #ced4da',
                                                    boxShadow: 'none !important',
                                                    appearance: 'textfield', // ปิดการแสดงลูกศรขึ้น-ลง
                                                    MozAppearance: 'textfield'
                                                }}
                                                min={0}
                                                className="equipment-quantity"
                                            />
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                onClick={() => handleEquipmentExportQuantityChange(index, (item.exportQuantity || 0) + 1)}
                                                type="button"
                                            >
                                                +
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>ไม่มีข้อมูลอุปกรณ์</p>
                    )}
                </Form.Group>
            )}

          
         
        </div>
    );
}
