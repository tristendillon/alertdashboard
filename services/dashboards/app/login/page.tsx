import { redirect as windowRedirect } from 'next/navigation'

interface LoginRedirectProps {
  searchParams: Promise<{ redirect: string }>
}

export default async function LoginRedirect({
  searchParams,
}: LoginRedirectProps) {
  const { redirect } = await searchParams

  windowRedirect(`${process.env.NEXT_PUBLIC_WEB_URL}/auth/login?redirect=${redirect}`)
}
