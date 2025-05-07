"use client"

import React, { createContext, useContext } from 'react';
import { JoinedUser } from '@workspace/ui/lib/types';
import { useQuery } from '@workspace/ui/hooks/use-query';
import { api } from '@workspace/convex/app/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';

interface UserProviderContext {
  user?: JoinedUser;
}

interface UserProviderProps {
  children: React.ReactNode;
  allowDashboardAccounts?: boolean;
}

const UserContext = createContext<UserProviderContext | null>(null);


export const UserProvider = ({ children, allowDashboardAccounts = false }: UserProviderProps) => {
  const { data: user, isPending: userPending, error: userError } = useQuery(api.authSchema.users.me);
  const { data: role, isPending: rolePending, error: roleError } = useQuery(api.authSchema.roles.me)
  const { signOut } = useAuthActions()

  // Ensure that a dashboard account cannot access application that dont allow it
  if (user && user.email.includes('@alertdashboard.dashboard.com') && !allowDashboardAccounts) {
    signOut()
    return <div>You are not authorized to access this application</div>
  }

  if (userError) {
    return <div>Error Loading User</div>
  }

  if (roleError) {
    return <div>Error Loading Role</div>
  }


  return (
    <UserContext.Provider value={{
      user: user ? {
        ...user,
        joinedRole: role
      } : undefined
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context.user;
};
