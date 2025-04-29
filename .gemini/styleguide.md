# Next.js Style Guide

# This style guide only applies to the NextJS projects

# inside of the services directory.

# Only our NextJS services should have these styles applied.

# Introduction

This style guide outlines the coding conventions for Next.js applications developed in our organization.
It's based on Next.js best practices and modern React patterns, with specific adaptations for our needs.

# Key Principles

- **Readability:** Code should be easy to understand for all team members.
- **Maintainability:** Code should be easy to modify and extend.
- **Consistency:** Adhering to a consistent style across all projects improves collaboration.
- **Performance:** Follow Next.js best practices for optimal performance.
- **Type Safety:** Leverage TypeScript for better code quality and developer experience.

# NextJS Services Structure

## NextJS Services Organization

- **app/:** Use the App Router for all new projects
  - **layout.tsx:** Root layout component
  - **page.tsx:** Home page component
  - **(app)/\*:** The authed directory of the app
  - **auth/\*:** Auth related routes
- **components/:** Reusable UI components
  - **{feature}/\*:** Feature-specific components
  - **{feature}/hooks:** Feature-specific hooks
  - **{feature}/lib:** Feature-specific lib
  - **{component}/\*:** reusable singular app component
- **lib/:** Utility functions and shared logic
- **hooks/:** Hook functions and shared logic
- **types/:** TypeScript type definitions
- **public/:** Static assets

## File Naming

- **Components:** kebab-case (e.g., `some-component.tsx`)
- **Pages/Routes:** kebab-case (e.g., `user-profile/page.tsx`)
- **Utilities:** kebab-case (e.g., `format-date.ts`)
- **Convex Files:** kebab-case (e.g., `create-user.ts`, `get-users.ts`)

# Code Style

## TypeScript

- **Use strict mode:** Enable all strict TypeScript compiler options
- **Explicit types:** Avoid using `any` type
- **Interface vs Type:** Use interfaces for object shapes, types for unions and primitives
- **Generic types:** Use generics for reusable components and functions

## React Components

- **Functional Components:** Use functional components with hooks
- **Component Props:**
  ```typescript
  interface ButtonProps {
    variant: 'primary' | 'secondary'
    children: React.ReactNode
    onClick?: () => void
  }
  ```
- **Default Props:** Use TypeScript's default values instead of defaultProps
- **Event Handlers:** Use arrow functions or useCallback for event handlers

## Hooks

- **Custom Hooks:** Prefix with 'use' (e.g., `useAuth`)
- **Hook Dependencies:** Always include all dependencies in dependency arrays
- **Hook Order:** Maintain consistent hook order within components
- **Hook Rules:** Follow React's Rules of Hooks strictly

## Styling

- **CSS:** Use Tailwind CSS for component styles
- **Tailwind CSS:** Follow Tailwind's utility-first approach
- **Responsive Design:** Use Tailwind's responsive prefixes

## Data Management with Convex

- **Schema Definition:**

  ```typescript
  // convex/schema.ts
  import { defineSchema, defineTable } from 'convex/server'
  import { v } from 'convex/values'

  export default defineSchema({
    users: defineTable({
      name: v.string(),
      email: v.string(),
      createdAt: v.number(),
    }),
  })
  ```

- **Mutations:**

  ```typescript
  // convex/users.ts
  import { mutation } from './_generated/server'
  import { v } from 'convex/values'

  export const createUser = mutation({
    args: {
      name: v.string(),
      email: v.string(),
    },
    handler: async (ctx, args) => {
      const userId = await ctx.db.insert('users', {
        name: args.name,
        email: args.email,
        createdAt: Date.now(),
      })
      return userId
    },
  })
  ```

- **Queries:**

  ```typescript
  // convex/users.ts
  import { query } from './_generated/server'

  export const getUsers = query({
    handler: async (ctx) => {
      return await ctx.db.query('users').collect()
    },
  })
  ```

- **Client-side Usage:**

  ```typescript
  // components/user-list.tsx
  'use client'

  import { useQuery } from "@workspace/ui/hooks/use-query"
  import { api } from "@/convex/_generated/api"

  export function UserList() {
    const { data: users, isPending: usersLoading, error: usersError} = useQuery(api.users.getUsers)

    if (!usersLoading) return <div>Loading...</div>
    if (usersError) return <div>Error...</div>
    return (
      <ul>
        {users.map((user) => (
          <li key={user._id}>{user.name}</li>
        ))}
      </ul>
    )
  }
  ```

## Performance

- **Code Splitting:** Leverage Next.js automatic code splitting
- **Image Optimization:** Use Next.js Image component
- **Lazy Loading:** Implement lazy loading for heavy components
- **Bundle Analysis:** Regularly analyze bundle size

# Example Components

## Server Component

```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Welcome</h1>
      <UserList />
    </main>
  )
}
```

## Client Component with Convex

```typescript
// components/user-list.tsx
'use client'

import { useQuery } from "convex/react"
import { api } from "@workspace/convex/app/_generated/api"
import { Button } from "@workspace/ui/components/button

export function UserList() {
  const users = useQuery(api.users.getUsers)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!users) return <div>Loading...</div>

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 hover:text-blue-800"
      >
        {isExpanded ? 'Collapse' : 'Expand'}
      </Button>
      {isExpanded && (
        <ul className="mt-4">
          {users.map((user) => (
            <li key={user._id} className="py-2">
              {user.name} - {user.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

# Tooling

- **ESLint:** Use ESLint with Next.js recommended rules
- **Prettier:** Use Prettier for code formatting
- **TypeScript:** Enable strict mode

# Documentation

<!-- - **Component Documentation:** Use JSDoc comments for components -->
<!-- - **Convex Documentation:** Document mutations and queries -->

- **README:** Maintain up-to-date README files for each project
- **Changelog:** Keep a changelog for significant changes
