
import React from 'react';
import {
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Ticket,
  HeartPulse,
  Zap,
  Home,
  Circle,
  LucideProps,
  Construction,
  Landmark,
  PiggyBank,
  Book,
  Plane,
  Gift,
  MoreHorizontal,
  Briefcase,
  BookCopy,
  User,
  ShoppingBag,
  Bus,
  Train,
  Fuel,
  Tv,
  Music,
  Pill,
  Phone,
  Wifi,
  Building,
  BookOpen,
  Luggage,
  Users,
  Wallet,
  CreditCard,
  Receipt,
  Repeat,
  Shield,
  Dumbbell,
  PawPrint,
  Shirt,
  Sparkles,
  Wrench,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const iconMap: { [key: string]: React.ElementType } = {
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Ticket,
  HeartPulse,
  Zap,
  Home,
  Circle,
  Construction,
  Landmark,
  PiggyBank,
  Book,
  Plane,
  Gift,
  MoreHorizontal,
  Briefcase,
  BookCopy,
  User,
  ShoppingBag,
  Bus,
  Train,
  Fuel,
  Tv,
  Music,
  Pill,
  Phone,
  Wifi,
  Building,
  BookOpen,
  Luggage,
  Users,
  Wallet,
  CreditCard,
  Receipt,
  Repeat,
  Shield,
  Dumbbell,
  PawPrint,
  Shirt,
  Sparkles,
  Wrench,
};

export const iconNames = Object.keys(iconMap);

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const Icon = iconMap[name] || Circle;
  return <Icon {...props} />;
}

    