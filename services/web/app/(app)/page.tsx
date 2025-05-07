import { AppSidebar } from '@/features/app-sidebar';
import { HomeSidebar } from '@/features/app-sidebar/lib';

export default function Home() {
  return (
    <>
      <AppSidebar sidebar={HomeSidebar} />
      HOME
    </>
  )
}
