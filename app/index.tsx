import { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to login screen on app start
  return <Redirect href="/UserManagement/login" />;
}

