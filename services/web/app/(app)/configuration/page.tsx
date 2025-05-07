import { AppSidebar } from '@/features/app-sidebar';
import { ConfigurationSidebar } from '@/features/app-sidebar/lib';

export default function Organization() {
  return (
    <>
      <AppSidebar sidebar={ConfigurationSidebar} />
      CONFIGURATION
    </>
  )
}
