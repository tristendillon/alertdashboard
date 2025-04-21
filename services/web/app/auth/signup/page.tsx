"use client"

import React from 'react'
import z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Button } from '@workspace/ui/components/button'
import { useForm } from '@workspace/ui/hooks/use-form'
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { useQueryCallback } from '@workspace/ui/hooks/use-query'
import { api } from '@workspace/convex/app/_generated/api'
import { ConvexError } from 'convex/values'

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string().min(8, { message: 'Confirm password must be at least 8 characters' }),
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
}).superRefine((values, ctx) => {
  if (values.password !== values.confirmPassword) {
    ctx.addIssue({
      path: ['confirmPassword'],
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
    })
  }
})

const TEST_ORG = "ks78vkn4yfgsjmyknnftcmpdt17een79"

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const emailTaken = useQueryCallback(api.users.emailTaken)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
    validators: {
      onSubmit: loginSchema
    },
    onSubmit: async ({ value }) => {
      const formData = new FormData()
      formData.append("flow", "signUp")
      formData.append("organizationId", TEST_ORG)
      formData.append('email', value.email)
      formData.append('password', value.password)
      formData.append('confirmPassword', value.confirmPassword)
      formData.append('firstName', value.firstName)
      formData.append('lastName', value.lastName)

      try {
        await signIn('password', formData);
        toast.success("Sign up successful");
      } catch (error) {
        if (error instanceof ConvexError) {
          toast.error(error.message)
          return
        }
        console.log(error)
        toast.error("Something went wrong")
      }
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign up</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="flex gap-2 w-full">
              <form.AppField
                name="firstName"
                children={(field) => (
                  <div className="space-y-2 w-full">
                    <form.Label>
                      First Name
                    </form.Label>
                    <field.Input
                      placeholder="Enter your first name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <form.FieldInfo field={field} />
                  </div>
                )}
              />
              <form.AppField
                name="lastName"
                children={(field) => (
                  <div className="space-y-2 w-full">
                    <form.Label>
                      Last Name
                    </form.Label>
                    <field.Input
                      placeholder="Enter your last name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <form.FieldInfo field={field} />
                  </div>
                )}
              />
            </div>
            <div></div>
            <form.AppField
              name="email"
              validators={{
                onChangeAsyncDebounceMs: 500,
                onChangeAsync: async ({ value }) => {
                  const isEmailTaken = await emailTaken({ email: value })
                  if (isEmailTaken) {
                    return { message: "Email is already taken" };
                  }
                  return undefined;
                },
              }}
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
            <form.AppField
              name="confirmPassword"
              children={(field) => (
                <div className="space-y-2">
                  <form.Label>
                    Confirm Password
                  </form.Label>
                  <field.Input
                    type="password"
                    placeholder="Confirm your password"
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
