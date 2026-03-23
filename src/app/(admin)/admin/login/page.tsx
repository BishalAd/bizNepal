import AdminLoginClient from './AdminLoginClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Portal Login | BizNepal',
  description: 'Secure access to the BizNepal Administration Dashboard.',
}

export default function AdminLoginPage() {
  return <AdminLoginClient />
}
