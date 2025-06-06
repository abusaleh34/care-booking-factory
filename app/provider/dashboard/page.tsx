'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { format, parseISO, isToday } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Icons
import { Calendar, Clock, DollarSign, Users, Star, ChevronRight, Plus, Settings, BarChart } from 'lucide-react';
import { Icons } from '@/components/ui/icons';

// Utils
import { cn, formatDate, formatPrice } from '@/lib/utils';

// Types
type Provider = {
  id: string;
  userId: string;
  businessName: {
    en: string;
    ar: string;
  };
  rating: number;
  reviewCount: number;
  verified: boolean;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
};

type Booking = {
  id: string;
  customerId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalPrice: number;
  currency: string;
  createdAt: string;
  customer?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  service?: {
    name: {
      en: string;
      ar: string;
    };
  };
};

type Stats = {
  totalBookings: number;
  upcomingBookings: number;
  totalRevenue: number;
  averageRating: number;
};

// Mock API functions
const fetchProviderDashboard = async (userId: string) => {
  // In a real app, we would fetch from the API
  // For now, we'll use the mock API set up with MSW
  const userResponse = await fetch(`/api/users/${userId}`);
  if (!userResponse.ok) throw new Error('Failed to fetch user data');
  const userData = await userResponse.json();
  
  // Fetch bookings for this provider
  const bookingsResponse = await fetch(`/api/bookings?providerId=${userData.provider.id}`);
  if (!bookingsResponse.ok) throw new Error('Failed to fetch bookings');
  const bookingsData = await bookingsResponse.json();
  
  // Calculate stats
  const stats: Stats = {
    totalBookings: bookingsData.total || 0,
    upcomingBookings: bookingsData.bookings.filter((b: Booking) => 
      (b.status === 'confirmed' || b.status === 'pending') && 
      new Date(`${b.date}T${b.startTime}`) > new Date()
    ).length,
    totalRevenue: bookingsData.bookings
      .filter((b: Booking) => b.status === 'completed')
      .reduce((sum: number, b: Booking) => sum + b.totalPrice, 0),
    averageRating: userData.provider.rating || 0
  };
  
  // Get today's appointments
  const todayBookings = bookingsData.bookings.filter((b: Booking) => 
    isToday(new Date(b.date)) && 
    (b.status === 'confirmed' || b.status === 'pending')
  );
  
  // Sort by start time
  todayBookings.sort((a: Booking, b: Booking) => {
    return a.startTime.localeCompare(b.startTime);
  });
  
  // Get recent bookings (last 5)
  const recentBookings = [...bookingsData.bookings]
    .sort((a: Booking, b: Booking) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);
  
  return {
    user: userData.user,
    provider: userData.provider,
    stats,
    todayBookings,
    recentBookings
  };
};

export default function ProviderDashboard() {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? ar : enUS;
  
  // In a real app, we would get the userId from auth context
  // For mock purposes, we'll use the provider user ID from our mock data
  const userId = '2'; // This matches our mock provider user
  
  // Fetch dashboard data
  const { data, isLoading, error } = useQuery({
    queryKey: ['providerDashboard', userId],
    queryFn: () => fetchProviderDashboard(userId),
    staleTime: 60000, // 1 minute
  });
  
  // Format currency based on locale
  const formatCurrency = (amount: number, currency: string) => {
    return formatPrice(amount, currency, i18n.language);
  };
  
  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mb-4">
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container py-12 text-center">
        <Icons.alert className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('errors.general')}</h2>
        <p className="text-muted-foreground mb-6">{t('errors.tryAgain')}</p>
        <Button onClick={() => window.location.reload()}>
          {t('buttons.refresh')}
        </Button>
      </div>
    );
  }
  
  if (!data) return null;
  
  const { user, provider, stats, todayBookings, recentBookings } = data;
  const businessName = isRTL ? provider.businessName.ar : provider.businessName.en;
  
  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('provider.welcomeMessage', {
              name: `${user.firstName} ${user.lastName}`,
              defaultValue: `Welcome, ${user.firstName} ${user.lastName}!`
            })}
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'PPP', { locale })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={provider.verified ? "default" : "outline"}>
            {provider.verified ? t('provider.verified') : t('provider.notVerified')}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href="/provider/profile">
              {t('provider.viewProfile')}
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('provider.stats.totalBookings')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('provider.stats.upcomingBookings')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('provider.stats.totalRevenue')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue, 'USD')}
              </div>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('provider.stats.rating')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-1">{stats.averageRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-muted-foreground ml-1">
                  ({provider.reviewCount})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('provider.todayAppointments')}</CardTitle>
                <CardDescription>
                  {t('provider.appointmentsForToday', {
                    count: todayBookings.length,
                    defaultValue: '{{count}} appointments scheduled for today'
                  })}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/provider/calendar">
                  {t('buttons.viewAll')}
                  <ChevronRight className={cn("ml-1 h-4 w-4", isRTL && "mr-1 ml-0 rotate-180")} />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {todayBookings.length > 0 ? (
                <div className="space-y-4">
                  {todayBookings.map((booking: Booking) => (
                    <div 
                      key={booking.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={booking.customer?.avatar} alt={`${booking.customer?.firstName} ${booking.customer?.lastName}`} />
                          <AvatarFallback>
                            {booking.customer?.firstName?.[0]}{booking.customer?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {booking.customer?.firstName} {booking.customer?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isRTL ? booking.service?.name.ar : booking.service?.name.en}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                          <span className="font-medium">
                            {booking.startTime} - {booking.endTime}
                          </span>
                        </div>
                        <Badge variant={getStatusBadge(booking.status)} className="mt-1">
                          {t(`status.${booking.status}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <h3 className="text-lg font-medium mb-1">
                    {t('provider.noAppointmentsToday')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('provider.freeTimeMessage')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t('provider.quickActions')}</CardTitle>
              <CardDescription>
                {t('provider.manageYourBusiness')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/provider/services/new">
                  <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t('provider.addService')}
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/provider/services">
                  <Settings className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t('provider.manageServices')}
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/provider/calendar">
                  <Calendar className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t('provider.schedule')}
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/provider/earnings">
                  <BarChart className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t('provider.earnings')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('provider.recentBookings')}</CardTitle>
              <CardDescription>
                {t('provider.recentBookingsDescription')}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/provider/bookings">
                {t('buttons.viewAll')}
                <ChevronRight className={cn("ml-1 h-4 w-4", isRTL && "mr-1 ml-0 rotate-180")} />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('booking.customer')}</TableHead>
                <TableHead>{t('booking.service')}</TableHead>
                <TableHead>{t('booking.date')}</TableHead>
                <TableHead>{t('booking.time')}</TableHead>
                <TableHead>{t('booking.price')}</TableHead>
                <TableHead>{t('booking.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.map((booking: Booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {booking.customer?.firstName} {booking.customer?.lastName}
                  </TableCell>
                  <TableCell>
                    {isRTL ? booking.service?.name.ar : booking.service?.name.en}
                  </TableCell>
                  <TableCell>
                    {formatDate(booking.date, 'PP', i18n.language)}
                  </TableCell>
                  <TableCell>
                    {booking.startTime}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(booking.totalPrice, booking.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(booking.status)}>
                      {t(`status.${booking.status}`)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
