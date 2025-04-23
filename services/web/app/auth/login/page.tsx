import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import LoginForm from '@/forms/login-form'

interface LoginPageProps {
  searchParams: Promise<{
    redirect: string;
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm redirect={redirect} />
        </CardContent>
      </Card>
    </div>
  )
}
