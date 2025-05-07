import { AppSidebar } from '@/features/app-sidebar';
import { OrganizationSidebar } from '@/features/app-sidebar/lib';

export default function Organization() {
  return (
    <>
      <AppSidebar sidebar={OrganizationSidebar} />
      ORGANIZATION
    </>
  )
}
