import React from 'react';
import { Button } from 'react-bootstrap';
import { FaPrint } from 'react-icons/fa';

export default function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button 
      variant="primary" 
      onClick={handlePrint}
      className="px-4 py-2"
    >
      <FaPrint className="me-2" /> พิมพ์แบบฟอร์ม
    </Button>
  );
}