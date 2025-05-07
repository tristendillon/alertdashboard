import { AppSidebar } from '@/features/app-sidebar';
import { DashboardsSidebar } from '@/features/app-sidebar/lib';

export default function Organization() {
  return (
    <>
      <AppSidebar sidebar={DashboardsSidebar} />
      DASHBOARDS
    </>
  )
}
