import React from "react";
import { Loader2, Check, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search, Menu, User, Settings, LogOut, Bell, Heart, Calendar, Clock, DollarSign, Star, Edit, Trash, Plus, Minus, Info, AlertCircle } from "lucide-react";

// Custom SVG icons for brands
const Google = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const Apple = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    {...props}
  >
    <path d="M14.94 5.19A4.38 4.38 0 0 0 16 2a4.44 4.44 0 0 0-3 1.52 4.17 4.17 0 0 0-1 3.09 3.69 3.69 0 0 0 2.94-1.42zm2.52 7.44a4.51 4.51 0 0 1 2.16-3.81 4.66 4.66 0 0 0-3.66-2c-1.56-.16-3 .91-3.83.91-.83 0-2-.89-3.3-.87a4.92 4.92 0 0 0-4.14 2.53C2.93 12.45 4.24 17 6 19.47c.8 1.21 1.8 2.58 3.12 2.53 1.25-.05 1.72-.8 3.24-.8s2 .8 3.28.77c1.36 0 2.22-1.23 3.06-2.44a10.88 10.88 0 0 0 1.38-2.85 4.42 4.42 0 0 1-2.62-4.05z" />
  </svg>
);

// Custom spinner icon that extends Loader2 with animation
const Spinner = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <Loader2 className={`animate-spin ${className}`} {...props} />
);

export const Icons = {
  // Brand icons
  google: Google,
  apple: Apple,
  
  // UI state icons
  spinner: Spinner,
  check: Check,
  close: X,
  
  // Navigation icons
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  search: Search,
  menu: Menu,
  
  // User related icons
  user: User,
  settings: Settings,
  logout: LogOut,
  notification: Bell,
  favorite: Heart,
  
  // Booking related icons
  calendar: Calendar,
  clock: Clock,
  dollar: DollarSign,
  star: Star,
  
  // Action icons
  edit: Edit,
  delete: Trash,
  add: Plus,
  remove: Minus,
  
  // Feedback icons
  info: Info,
  alert: AlertCircle,
};
