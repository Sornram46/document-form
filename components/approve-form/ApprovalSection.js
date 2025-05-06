import { Form, FormCheck, FormGroup, FormLabel } from 'react-bootstrap';
import { useState } from 'react';

export default function ApprovalSection({ formData, handleInputChange }) {
  const [showRejectionReason, setShowRejectionReason] = useState(false);
  
  const handleApprovalStatusChange = (e) => {
    const isRejected = e.target.value === 'rejected';
    
    // Set state for showing rejection reason input
    setShowRejectionReason(isRejected);
    
    // Update the form with the selected option
    handleInputChange({
      target: {
        name: 'approvalStatus',
        value: e.target.value
      }
    });
  };

  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Label>ผู้อนุมัติ</Form.Label>
        <Form.Control
          type="text"
          name="approver"
          value={formData.approver}
          onChange={handleInputChange}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>ตำแหน่งผู้อนุมัติ</Form.Label>
        <Form.Control
          type="text"
          name="approverPosition"
          value={formData.approverPosition}
          onChange={handleInputChange}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>หมายเหตุ</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          name="approvalNotes"
          value={formData.approvalNotes}
          onChange={handleInputChange}
        />
      </Form.Group>

      <Form.Group className='mb-3'>
        <Form.Label>สถานะการอนุมัติ</Form.Label>
        <div>
          <Form.Check
            type='radio'
            label='อนุมัติ'
            name='approvalStatus'
            id='approvalStatus-approved'
            value='approved'
            checked={formData.approvalStatus === 'approved'}
            onChange={handleApprovalStatusChange}
            required
          />
          <Form.Check
            type='radio'
            label='ไม่อนุมัติ'
            name='approvalStatus'
            id='approvalStatus-rejected'
            value='rejected'
            checked={formData.approvalStatus === 'rejected'}
            onChange={handleApprovalStatusChange}
            required
          />
        </div>
      </Form.Group>
      
      {showRejectionReason && (
        <Form.Group className="mb-3">
          <Form.Label>เหตุผลที่ไม่อนุมัติ</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            className='mb-2'
            name="rejectionReason"
            value={formData.rejectionReason || ''}
            onChange={handleInputChange}
            required
          />
        </Form.Group>
      )}
    </div>
  );
}
