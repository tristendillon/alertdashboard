"use client";

import { useAuthActions } from '@convex-dev/auth/react';
import { useForm } from '@workspace/ui/hooks/use-form';
import { useRouter } from 'next/navigation';
import React from 'react'
import z from 'zod'

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
})

interface LoginFormProps {
  redirect?: string
}

export default function LoginForm({ redirect }: LoginFormProps) {
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
      try {
        await signIn('password', {
          flow: 'signIn',
          email: value.email,
          password: value.password,
        });
      } catch (error) {
        console.error(error);
      }
      router.push(redirect || "/");
    },
  })

  return (
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
          <form.Button
            type="submit"
            className="w-full"
            onClick={() => form.handleSubmit()}
            disabled={!canSubmit}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </form.Button>
        )}
      />

    </form>
  )
}
