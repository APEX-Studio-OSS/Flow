'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { getSafeAvatarInitial } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { UserRound } from 'lucide-react';

interface FlowAvatarProps {
  name: string;
  avatarUrl: string | null;
  isGeneratedAvatar: boolean;
  className?: string;
  fallbackClassName?: string;
}

export function FlowAvatar({
  name,
  avatarUrl,
  isGeneratedAvatar,
  className,
  fallbackClassName,
}: FlowAvatarProps) {
  const showImage = !isGeneratedAvatar && !!avatarUrl;
  const label = name ? `Profile avatar for ${name}` : "Profile avatar";
  const initials = getSafeAvatarInitial(name);
  
  return (
    <Avatar 
      className={cn("border border-border shadow-sm", className)}
      role="img"
      aria-label={label}
    >
      <AvatarImage 
        src={showImage ? avatarUrl : undefined} 
        alt={label} 
      />
      <AvatarFallback 
        className={cn(
          "font-bold bg-primary/10 text-primary uppercase select-none flex items-center justify-center transition-colors duration-200",
          fallbackClassName
        )}
        aria-hidden="true"
      >
        {initials ? (
          initials
        ) : (
          <UserRound className="h-1/2 w-1/2 stroke-[2.5]" aria-hidden="true" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
