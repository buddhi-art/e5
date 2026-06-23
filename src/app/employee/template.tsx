import { PageTransition } from '@/components/page-transition'

export default function EmployeeTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
