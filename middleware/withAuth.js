import { useEffect } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import { parseCookies } from 'nookies';

export function withAuth(WrappedComponent) {
  return function WithAuth(props) {
    const router = useRouter();
    
    useEffect(() => {
      const checkAuth = async () => {
        const cookies = parseCookies();
        const token = cookies.auth_token;
        
        if (!token) {
          router.replace('/admin/login');
          return;
        }
        
        try {
          // ตรวจสอบ token
          jwt.verify(token, 'your_jwt_secret');
          // token ถูกต้อง ทำต่อไป
        } catch (error) {
          // token ไม่ถูกต้องหรือหมดอายุ
          router.replace('/admin/login');
        }
      };
      
      checkAuth();
    }, []);
    
    return <WrappedComponent {...props} />;
  };
}