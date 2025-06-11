'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameMonth,
  isSameDay,
  parseISO,
  getDay,
} from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn, formatPrice, getDirection } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription as AlertDescUI } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // For view switching
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'; // For date picker
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar'; // For date picker

// Icons
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, Tag, Edit, Trash2, Filter, ListChecks, GripVertical, AlertTriangle, Loader2 } from 'lucide-react';
import { Icons } from '@/components/ui/icons';

// Types
interface Booking {
  id: string;
  customerId: string;
  customer?: { firstName: string; lastName: string; avatar?: string };
  serviceId: string;
  service?: { name: { en: string; ar: string }; duration: number };
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalPrice: number;
  currency: string;
}

interface Service {
  id: string;
  name: { en: string; ar: string };
}

interface ProviderProfile {
  id: string;
  userId: string;
}

interface UserWithProviderProfile {
  user: { id: string; role: string; };
  provider?: ProviderProfile;
}

type CalendarView = 'month' | 'week' | 'day';

// API Interaction Functions
const fetchProviderProfile = async (userId: string): Promise<UserWithProviderProfile> => {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch provider profile');
  return response.json();
};

const fetchProviderBookings = async (providerId: string, startDate: string, endDate: string): Promise<Booking[]> => {
  const response = await fetch(`/api/bookings?providerId=${providerId}&startDate=${startDate}&endDate=${endDate}`);
  if (!response.ok) throw new Error('Failed to fetch bookings');
  const data = await response.json();
  return data.bookings || [];
};

const fetchProviderServices = async (providerId: string): Promise<Service[]> => {
  const response = await fetch(`/api/services?providerId=${providerId}`);
  if (!response.ok) throw new Error('Failed to fetch services');
  const data = await response.json();
  return data.services || [];
};

const updateBookingStatusAPI = async ({ bookingId, status }: { bookingId: string; status: Booking['status'] }): Promise<Booking> => {
  const response = await fetch(`/api/bookings/${bookingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update booking status');
  }
  return response.json();
};


export default function ProviderCalendarPage() {
  const { t, i18n } = useTranslation(['provider', 'common', 'booking']);
  const queryClient = useQueryClient();
  const { user: authUser, isLoading: isLoadingAuth } = useAuth();
  const isRTL = i18n.language === 'ar';
  const dateLocale = isRTL ? ar : enUS;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [filterService, setFilterService] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const { data: userProfileData, isLoading: isLoadingUserProfile, error: userProfileError } = useQuery({
    queryKey: ['providerProfileData', authUser?.id],
    queryFn: () => authUser ? fetchProviderProfile(authUser.id) : Promise.reject(new Error("User not authenticated")),
    enabled: !!authUser && !isLoadingAuth,
  });
  const providerId = userProfileData?.provider?.id;

  const dateRange = useMemo(() => {
    let start: Date, end: Date;
    if (calendarView === 'month') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else if (calendarView === 'week') {
      start = startOfWeek(currentDate, { locale: dateLocale });
      end = endOfWeek(currentDate, { locale: dateLocale });
    } else { // day view
      start = currentDate;
      end = currentDate;
    }
    return { start, end };
  }, [currentDate, calendarView, dateLocale]);

  const { data: bookings, isLoading: isLoadingBookings, error: bookingsError } = useQuery<Booking[], Error>({
    queryKey: ['providerBookings', providerId, format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
    queryFn: () => fetchProviderBookings(providerId!, format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')),
    enabled: !!providerId,
  });

  const { data: services, isLoading: isLoadingServices, error: servicesError } = useQuery<Service[], Error>({
    queryKey: ['providerServicesList', providerId],
    queryFn: () => fetchProviderServices(providerId!),
    enabled: !!providerId,
  });

  const updateBookingStatusMutation = useMutation<Booking, Error, { bookingId: string; status: Booking['status'] }>({\n    mutationFn: updateBookingStatusAPI,\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['providerBookings'] });\n      setIsBookingModalOpen(false);\n    },\n  });

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter(booking => {
      const serviceMatch = filterService ? booking.serviceId === filterService : true;
      const statusMatch = filterStatus ? booking.status === filterStatus : true;
      return serviceMatch && statusMatch;
    });
  }, [bookings, filterService, filterStatus]);

  const handlePrev = () => {
    if (calendarView === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (calendarView === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (calendarView === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (calendarView === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsBookingModalOpen(true);
  };

  const getBookingStatusBadgeVariant = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return 'default';      // Changed from 'success'
      case 'pending': return 'secondary';      // Changed from 'warning'
      case 'cancelled': return 'destructive';
      case 'completed': return 'outline';      // Changed to differentiate from confirmed
      default: return 'outline';
    }
  };

  const renderCalendarGrid = () => {
    if (calendarView === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart, { locale: dateLocale });
      const endDate = endOfWeek(monthEnd, { locale: dateLocale });
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const dayNames = Array.from({ length: 7 }).map((_, i) => format(addDays(startDate, i), 'EEE', { locale: dateLocale }));

      return (
        <div className="grid grid-cols-7 border-t border-l dark:border-gray-700">
          {dayNames.map(dayName => (
            <div key={dayName} className="p-2 text-center font-medium border-r border-b dark:border-gray-700 bg-muted/50">
              {dayName}
            </div>
          ))}
          {days.map((day, dayIdx) => {
            const dayBookings = filteredBookings.filter(b => isSameDay(parseISO(b.date), day));
            return (
              <div
                key={dayIdx}
                className={cn(
                  "p-2 border-r border-b dark:border-gray-700 min-h-[100px] relative",
                  !isSameMonth(day, currentDate) && "bg-muted/30 text-muted-foreground",
                  isSameDay(day, new Date()) && "bg-blue-50 dark:bg-blue-900/30"
                )}
              >
                <span className={cn("absolute top-1 right-1 rtl:left-1 rtl:right-auto text-xs", isSameDay(day, new Date()) && "font-bold text-primary")}>
                  {format(day, 'd')}
                </span>
                <div className="mt-4 space-y-1 overflow-y-auto max-h-[120px]">
                  {dayBookings.map(booking => (
                    <div
                      key={booking.id}
                      onClick={() => handleBookingClick(booking)}
                      className={cn(
                        "p-1.5 rounded-md text-xs cursor-pointer hover:opacity-80",
                        booking.status === 'confirmed' && 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100',
                        booking.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100',
                        booking.status === 'completed' && 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
                        booking.status === 'cancelled' && 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 line-through'
                      )}
                    >
                      <p className="font-semibold truncate">{booking.customer?.firstName || t('common:booking.customer')}</p>
                      <p className="truncate">{isRTL ? booking.service?.name.ar : booking.service?.name.en}</p>
                      <p>{booking.startTime}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    // Placeholder for Week and Day views
    return (
      <div className="p-4 border rounded-md text-center">
        <p>{t('viewNotImplemented', '{view} view is not fully implemented yet.', { view: t(calendarView) })}</p>
        <p>{t('currentPeriod', 'Currently viewing: {period}', { period: format(currentDate, 'PPP', { locale: dateLocale }) })}</p>
      </div>
    );
  };

  const quickStats = useMemo(() => {
    if (!filteredBookings) return { total: 0, confirmed: 0, pending: 0, revenue: 0 };
    let totalRevenue = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    filteredBookings.forEach(b => {
      if (b.status === 'confirmed' || b.status === 'completed') {
        totalRevenue += b.totalPrice;
      }
      if (b.status === 'confirmed') confirmedCount++;
      if (b.status === 'pending') pendingCount++;
    });
    return {
      total: filteredBookings.length,
      confirmed: confirmedCount,
      pending: pendingCount,
      revenue: totalRevenue,
    };
  }, [filteredBookings]);


  if (isLoadingAuth || isLoadingUserProfile) {
    return <div className="container py-8"><Skeleton className="h-96 w-full" /></div>;
  }
  if (userProfileError) {
    return <div className="container py-8"><Alert variant="destructive"><AlertTitle>{t('common:errors.general')}</AlertTitle><AlertDescUI>{userProfileError.message}</AlertDescUI></Alert></div>;
  }
  if (authUser && authUser.role !== 'provider') {
    return <div className="container py-8"><Alert variant="destructive"><AlertTitle>{t('common:errors.unauthorized')}</AlertTitle><AlertDescUI>{t('unauthorizedAccessMessage', 'You are not authorized to view this page.')}</AlertDescUI></Alert></div>;
  }
  if (!providerId) {
     return (
      <div className="container py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('profileNotSetupTitle', 'Provider Profile Not Set Up')}</h2>
        <p className="text-muted-foreground mb-6">{t('profileNotSetupMessage', 'Please complete your provider profile setup to view calendar.')}</p>
        <Button asChild><Link href="/provider/profile/edit">{t('setupProfileButton', 'Set Up Profile')}</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir={getDirection(i18n.language)}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('calendarTitle', 'Booking Calendar')}</h1>
          <p className="text-muted-foreground">{t('calendarSubtitle', 'View and manage your appointments.')}</p>
        </div>
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarDays className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <ShadcnCalendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                initialFocus
                locale={dateLocale}
                dir={getDirection(i18n.language)}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={handlePrev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={handleToday}>{t('common:time.today')}</Button>
          <Button variant="outline" size="icon" onClick={handleNext}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Tabs value={calendarView} onValueChange={(value) => setCalendarView(value as CalendarView)} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="month">{t('viewMonth', 'Month')}</TabsTrigger>
              <TabsTrigger value="week" disabled>{t('viewWeek', 'Week')}</TabsTrigger> {/* Placeholder */}
              <TabsTrigger value="day" disabled>{t('viewDay', 'Day')}</TabsTrigger> {/* Placeholder */}
            </TabsList>
          </Tabs>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={filterService} onValueChange={setFilterService} disabled={isLoadingServices}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('filterByService', 'Filter by Service')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('allServices', 'All Services')}</SelectItem>
                {services?.map(service => (
                  <SelectItem key={service.id} value={service.id}>{isRTL ? service.name.ar : service.name.en}</SelectItem>
                ))}\n              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('filterByStatus', 'Filter by Status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('allStatuses', 'All Statuses')}</SelectItem>
                {['pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                  <SelectItem key={status} value={status}>{t(`common:status.${status}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <Skeleton className="h-96 w-full" />
          ) : bookingsError ? (
            <Alert variant="destructive"><AlertTitle>{t('common:errors.general')}</AlertTitle><AlertDescUI>{bookingsError.message}</AlertDescUI></Alert>
          ) : (
            renderCalendarGrid()
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-4 justify-around pt-4 border-t">
            <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('statsTotalBookings', 'Total Bookings')}</p>
                <p className="text-xl font-bold">{quickStats.total}</p>
            </div>
            <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('statsConfirmed', 'Confirmed')}</p>
                <p className="text-xl font-bold text-green-600">{quickStats.confirmed}</p>
            </div>
            <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('statsPending', 'Pending')}</p>
                <p className="text-xl font-bold text-yellow-600">{quickStats.pending}</p>
            </div>
            <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('statsEstRevenue', 'Est. Revenue')}</p>
                <p className="text-xl font-bold">{formatPrice(quickStats.revenue, 'USD', i18n.language)}</p> {/* Assuming USD for now */}
            </div>
        </CardFooter>
      </Card>

      {/* Mock Availability Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('manageAvailabilityTitle', 'Manage Availability')}</CardTitle>
          <CardDescription>{t('manageAvailabilityDesc', 'Set your working hours or block off specific times. (Mock UI)')}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button variant="outline" disabled>
            <GripVertical className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('setWorkingHoursButton', 'Set Working Hours')}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">{t('availabilityFeatureComingSoon', 'Full availability management feature coming soon.')}</p>
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-md" dir={getDirection(i18n.language)}>
          <DialogHeader>
            <DialogTitle>{t('bookingDetailsTitle', 'Booking Details')}</DialogTitle>
            {selectedBooking && <DialogDesc>{t('bookingFor', 'Booking for {customer}', { customer: selectedBooking.customer?.firstName || t('common:booking.customer') })}</DialogDesc>}
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-3 py-4">
              <p><strong>{t('common:booking.service')}:</strong> {isRTL ? selectedBooking.service?.name.ar : selectedBooking.service?.name.en}</p>
              <p><strong>{t('common:booking.date')}:</strong> {format(parseISO(selectedBooking.date), 'PPP', { locale: dateLocale })}</p>
              <p><strong>{t('common:booking.time')}:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}</p>
              <p><strong>{t('common:booking.status')}:</strong> <Badge variant={getBookingStatusBadgeVariant(selectedBooking.status)}>{t(`common:status.${selectedBooking.status}`)}</Badge></p>
              <p><strong>{t('common:booking.price')}:</strong> {formatPrice(selectedBooking.totalPrice, selectedBooking.currency, i18n.language)}</p>
              
              {selectedBooking.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateBookingStatusMutation.mutate({ bookingId: selectedBooking.id, status: 'confirmed' })}
                    disabled={updateBookingStatusMutation.isPending}
                  >
                    {updateBookingStatusMutation.isPending && updateBookingStatusMutation.variables?.status === 'confirmed' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('confirmBookingButton', 'Confirm Booking')}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => updateBookingStatusMutation.mutate({ bookingId: selectedBooking.id, status: 'cancelled' })}
                    disabled={updateBookingStatusMutation.isPending}
                  >
                     {updateBookingStatusMutation.isPending && updateBookingStatusMutation.variables?.status === 'cancelled' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('cancelBookingButton', 'Cancel Booking')}
                  </Button>
                </div>
              )}
              {selectedBooking.status === 'confirmed' && (
                 <div className="flex gap-2 pt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateBookingStatusMutation.mutate({ bookingId: selectedBooking.id, status: 'completed' })}
                    disabled={updateBookingStatusMutation.isPending}
                  >
                    {updateBookingStatusMutation.isPending && updateBookingStatusMutation.variables?.status === 'completed' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('markAsCompletedButton', 'Mark as Completed')}
                  </Button>
                   <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => updateBookingStatusMutation.mutate({ bookingId: selectedBooking.id, status: 'cancelled' })}
                    disabled={updateBookingStatusMutation.isPending}
                  >
                     {updateBookingStatusMutation.isPending && updateBookingStatusMutation.variables?.status === 'cancelled' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('cancelBookingButton', 'Cancel Booking')}
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground pt-2">{t('dragDropMockInfo', 'Drag & drop to reschedule (mock - not functional). Click buttons to change status.')}</p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">{t('common:buttons.close', 'Close')}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
