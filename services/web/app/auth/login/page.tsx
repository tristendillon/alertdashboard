"use client"

import React from 'react'
import z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Button } from '@workspace/ui/components/button'
import { useForm } from '@workspace/ui/hooks/use-form'
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from 'next/navigation'

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
})

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuthActions();
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      try{
        await signIn('password', {
          flow: 'signIn',
          email: value.email,
          password: value.password,
        });
      } catch (error) {
        console.error(error);
      }
      router.push("/");
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
  })

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
          <form className="space-y-4">
            <form.AppField
              name="email"
              children={(field) => (
                <div className="space-y-2">
                  <form.Label>
                    Email
                  </form.Label>
                  <field.Input
                    placeholder="Enter your email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <form.FieldInfo field={field} />
                </div>
              )}
            />

            <form.AppField
              name="password"
              children={(field) => (
                <div className="space-y-2">
                  <form.Label>
                    Password
                  </form.Label>
                  <field.Input
                    type="password"
                    placeholder="Enter your password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <form.FieldInfo field={field} />
                </div>
              )}
            />
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="w-full"
                  onClick={() => form.handleSubmit()}
                  disabled={!canSubmit}
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              )}
            />

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
