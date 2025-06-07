'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO, addMinutes, isValid } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import * as z from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'; // Added shadcn/ui Form components

// Icons
import { CalendarDays, Clock, DollarSign, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, User, Info, CreditCard, ShoppingBag, Edit3 } from 'lucide-react';
import { Icons } from '@/components/ui/icons';

// Utils & Context
import { cn, formatDate, formatPrice, getDirection } from '@/lib/utils';
import { useAuth, User as AuthUser } from '@/contexts/AuthContext';

// Types (ensure these match your actual data structures from MSW)
interface ProviderData {
  id: string;
  businessName: { en: string; ar: string };
  services: Service[];
  // Add other provider details if needed for display (e.g., address for confirmation)
  address?: {
    city: string;
    country: string;
  };
}

interface Service {
  id: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  price: number;
  currency: string;
  duration: number; // in minutes
  image?: string;
}

interface TimeSlot {
  start: string; // HH:mm
  end: string; // HH:mm
}

interface AvailabilityResponse {
  providerId: string;
  date: string;
  availableSlots: TimeSlot[];
}

interface BookingPayload {
  customerId: string;
  providerId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  notes?: string;
}

interface BookingResponse {
  booking: {
    id: string;
    // ... other booking details
  };
  service: Service;
}

const STEPS = [
  { id: 'service', labelKey: 'booking.steps.service' },
  { id: 'datetime', labelKey: 'booking.steps.dateTime' },
  { id: 'confirm', labelKey: 'booking.steps.confirm' },
  { id: 'payment', labelKey: 'booking.steps.payment' },
  { id: 'booked', labelKey: 'booking.steps.booked' },
];

// Schema for customer notes
const notesFormSchema = z.object({
  notes: z.string().max(500, 'booking.notesTooLong').optional(),
});
type NotesFormValues = z.infer<typeof notesFormSchema>;

// Schema for mock payment
const paymentFormSchema = z.object({
  cardNumber: z.string().min(16, 'booking.payment.invalidCard').max(16, 'booking.payment.invalidCard'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'booking.payment.invalidExpiry'),
  cvv: z.string().min(3, 'booking.payment.invalidCvv').max(4, 'booking.payment.invalidCvv'),
  cardHolderName: z.string().min(1, 'booking.payment.nameRequired'),
});
type PaymentFormValues = z.infer<typeof paymentFormSchema>;


export default function BookingPage() {
  const params = useParams();
  const providerId = params.providerId as string;
  const { t, i18n } = useTranslation(['common', 'booking']);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const isRTL = i18n.language === 'ar';
  const dateLocale = isRTL ? ar : enUS;

  const [currentStep, setCurrentStep] = useState(0); // Index of STEPS array
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [finalBookingDetails, setFinalBookingDetails] = useState<BookingResponse | null>(null);

  const notesForm = useForm<NotesFormValues>({
    resolver: zodResolver(notesFormSchema),
    defaultValues: { notes: '' },
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { cardNumber: '', expiryDate: '', cvv: '', cardHolderName: '' },
  });

  // Fetch provider details and services
  const { data: providerData, isLoading: isLoadingProvider, error: providerError } = useQuery<ProviderData, Error>({
    queryKey: ['providerBookingInfo', providerId],
    queryFn: async () => {
      const response = await fetch(`/api/providers/${providerId}`); // Assuming this endpoint returns services
      if (!response.ok) throw new Error(t('booking.errors.fetchProviderFailed'));
      const data = await response.json();
      return data.provider ? { ...data.provider, services: data.services || [] } : { id: providerId, businessName: { en: 'Unknown', ar: 'غير معروف' }, services: [] };
    },
    enabled: !!providerId,
  });

  // Fetch available time slots
  const { data: availabilityData, isLoading: isLoadingSlots, error: slotsError, refetch: refetchSlots } = useQuery<AvailabilityResponse, Error>({
    queryKey: ['availability', providerId, selectedServiceId, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!selectedDate || !selectedServiceId) throw new Error(t('booking.errors.selectDateServiceFirst'));
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/availability?providerId=${providerId}&date=${dateStr}&serviceId=${selectedServiceId}`);
      if (!response.ok) throw new Error(t('booking.errors.fetchSlotsFailed'));
      return response.json();
    },
    enabled: !!providerId && !!selectedServiceId && !!selectedDate,
    staleTime: 0, // Always refetch slots when date/service changes
    retry: false,
  });

  // Mutation for creating a booking
  const { mutate: createBooking, isPending: isCreatingBooking, error: bookingError } = useMutation<BookingResponse, Error, BookingPayload>({
    mutationFn: async (payload) => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || t('booking.errors.createBookingFailed'));
      }
      return response.json();
    },
    onSuccess: (data) => {
      setFinalBookingDetails(data);
      setCurrentStep(STEPS.findIndex(step => step.id === 'booked'));
      queryClient.invalidateQueries({ queryKey: ['bookings', authUser?.id] }); // Invalidate user's bookings list
    },
  });

  const selectedService = useMemo(() => {
    return providerData?.services.find(s => s.id === selectedServiceId);
  }, [providerData, selectedServiceId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/book/${providerId}`);
    }
  }, [authLoading, isAuthenticated, router, providerId]);

  const handleNextStep = () => {
    if (currentStep < STEPS.length - 2) { // -2 because 'booked' is the last, not a step to go "next" from
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedDate(undefined); // Reset date when service changes
    setSelectedTimeSlot(null);
    handleNextStep();
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && isValid(date) && date >= new Date(new Date().setHours(0,0,0,0))) {
      setSelectedDate(date);
      setSelectedTimeSlot(null); // Reset time slot when date changes
    }
  };
  
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    handleNextStep();
  };

  const handleConfirmAndPay = (data: NotesFormValues) => {
    setCustomerNotes(data.notes || '');
    handleNextStep(); // Move to payment step
  };

  const handleMockPayment = async (paymentData: PaymentFormValues) => {
    if (!authUser || !selectedService || !selectedDate || !selectedTimeSlot) {
      // This should ideally be caught by disabling buttons, but good to have a check
      alert(t('booking.errors.missingInfoPayment'));
      return;
    }
    // Simulate payment processing
    console.log('Mock payment processing with data:', paymentData);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

    const bookingPayload: BookingPayload = {
      customerId: authUser.id,
      providerId,
      serviceId: selectedService.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedTimeSlot.start,
      notes: customerNotes,
    };
    createBooking(bookingPayload);
  };

  const StepperUI = () => (
    <div className="mb-8">
      <ol className="flex items-center w-full">
        {STEPS.slice(0, -1).map((step, index) => ( // Exclude 'booked' step from stepper UI
          <li
            key={step.id}
            className={cn(
              "flex w-full items-center",
              index < STEPS.length - 2 && "after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-300 after:border-1 after:inline-block dark:after:border-gray-700",
              index <= currentStep && "text-primary dark:text-primary after:border-primary dark:after:border-primary"
            )}
          >
            <span className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0",
              index <= currentStep ? "bg-primary text-primary-foreground" : "bg-gray-200 dark:bg-gray-700"
            )}>
              {index < currentStep ? <CheckCircle className="w-5 h-5" /> : <span>{index + 1}</span>}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
        {t(STEPS[currentStep].labelKey)}
      </div>
    </div>
  );

  if (authLoading || isLoadingProvider) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-1/2 mb-8" /> {/* Stepper placeholder */}
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-1/3 ml-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!isAuthenticated) {
     return (
      <div className="container py-12 text-center">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('booking.errors.authRequiredTitle')}</AlertTitle>
          <AlertDescription>{t('booking.errors.authRequiredMessage')}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href={`/auth/login?redirect=/book/${providerId}`}>{t('auth.login')}</Link>
        </Button>
      </div>
    );
  }

  if (providerError) {
    return <Alert variant="destructive">{providerError.message}</Alert>;
  }

  if (!providerData) {
    return <Alert variant="destructive">{t('booking.errors.providerNotFound')}</Alert>;
  }
  
  const providerBusinessName = isRTL ? providerData.businessName.ar : providerData.businessName.en;

  // Step 1: Service Selection
  const renderServiceSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t('booking.selectServiceTitle', { providerName: providerBusinessName })}</CardTitle>
        <CardDescription>{t('booking.selectServiceDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {providerData.services.length === 0 ? (
          <p>{t('booking.noServicesAvailable')}</p>
        ) : (
          <RadioGroup
            onValueChange={handleServiceSelect}
            defaultValue={selectedServiceId || undefined}
            className="space-y-4"
          >
            {providerData.services.map((service) => (
              <Label
                key={service.id}
                htmlFor={`service-${service.id}`}
                className={cn(
                  "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                  selectedServiceId === service.id && "ring-2 ring-primary border-primary"
                )}
              >
                <div className="flex items-center mb-2 sm:mb-0">
                  {service.image && (
                    <Image src={service.image} alt={isRTL ? service.name.ar : service.name.en} width={64} height={64} className="w-16 h-16 rounded-md object-cover mr-4 rtl:ml-4 rtl:mr-0" />
                  )}
                  <div>
                    <h3 className="font-semibold">{isRTL ? service.name.ar : service.name.en}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{isRTL ? service.description.ar : service.description.en}</p>
                    <div className="text-sm mt-1">
                      <span className="font-medium">{formatPrice(service.price, service.currency, i18n.language)}</span>
                      <span className="text-muted-foreground mx-1">·</span>
                      <span>{service.duration} {t('time.minutesShort')}</span>
                    </div>
                  </div>
                </div>
                <RadioGroupItem value={service.id} id={`service-${service.id}`} className="sr-only" />
                {selectedServiceId === service.id && <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-2 sm:mt-0" />}
              </Label>
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );

  // Step 2: Date & Time Selection
  const renderDateTimeSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t('booking.selectDateTimeTitle')}</CardTitle>
        <CardDescription>
          {selectedService ? t('booking.selectDateTimeForService', { serviceName: isRTL ? selectedService.name.ar : selectedService.name.en }) : t('booking.selectServiceFirst')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-2">{t('booking.selectDate')}</h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            fromDate={new Date()} // Disable past dates
            locale={dateLocale}
            dir={getDirection(i18n.language)}
            className="rounded-md border p-0"
            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Basic past date disabling
          />
        </div>
        <div>
          <h3 className="font-medium mb-2">{t('booking.selectTime')}</h3>
          {isLoadingSlots && <div className="grid grid-cols-3 gap-2 mt-2">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}
          {slotsError && <Alert variant="destructive">{slotsError.message}</Alert>}
          {!isLoadingSlots && !slotsError && selectedDate && availabilityData && (
            availabilityData.availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mt-2 max-h-72 overflow-y-auto pr-2">
                {availabilityData.availableSlots.map((slot) => (
                  <Button
                    key={slot.start}
                    variant={selectedTimeSlot?.start === slot.start ? 'default' : 'outline'}
                    onClick={() => handleTimeSlotSelect(slot)}
                    className="w-full"
                  >
                    {slot.start}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mt-2">{t('booking.noSlotsAvailable')}</p>
            )
          )}
          {!selectedDate && <p className="text-muted-foreground mt-2">{t('booking.selectDateToSeeTimes')}</p>}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handlePrevStep}><ChevronLeft className={cn("h-4 w-4", isRTL ? "ml-1" : "mr-1")} /> {t('buttons.previous')}</Button>
        <Button onClick={handleNextStep} disabled={!selectedTimeSlot || !selectedService || !selectedDate}>
          {t('buttons.next')} <ChevronRight className={cn("h-4 w-4", isRTL ? "mr-1" : "ml-1")} />
        </Button>
      </CardFooter>
    </Card>
  );

  // Step 3: Confirmation
  const renderConfirmation = () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) return null;
    const serviceName = isRTL ? selectedService.name.ar : selectedService.name.en;
    const dateTime = `${formatDate(selectedDate, 'PPP', i18n.language)} ${t('time.at')} ${selectedTimeSlot.start}`;

    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('booking.confirmDetailsTitle')}</CardTitle>
          <CardDescription>{t('booking.confirmDetailsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">{serviceName}</h3>
            <div className="flex items-center text-muted-foreground">
              <User className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              <span>{providerBusinessName}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <CalendarDays className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              <span>{dateTime}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              <span>{selectedService.duration} {t('time.minutesShort')}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>{t('booking.totalPrice')}</span>
              <span>{formatPrice(selectedService.price, selectedService.currency, i18n.language)}</span>
            </div>
          </div>

          <Form {...notesForm}>
            <form onSubmit={notesForm.handleSubmit(handleConfirmAndPay)}>
              <FormField
                control={notesForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="customer-notes" className="font-medium">{t('booking.customerNotesLabel')}</FormLabel>
                    <FormControl>
                      <Textarea
                        id="customer-notes"
                        placeholder={t('booking.customerNotesPlaceholder')}
                        className="mt-1"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage>{notesForm.formState.errors.notes && t(notesForm.formState.errors.notes.message as string)}</FormMessage>
                  </FormItem>
                )}
              />
              <CardFooter className="flex justify-between mt-6 p-0">
                <Button variant="outline" onClick={handlePrevStep} type="button"><ChevronLeft className={cn("h-4 w-4", isRTL ? "ml-1" : "mr-1")} /> {t('buttons.previous')}</Button>
                <Button type="submit">
                  {t('booking.confirmAndPay')} <CreditCard className={cn("h-4 w-4", isRTL ? "mr-1" : "ml-1")} />
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };

  // Step 4: Mock Payment
  const renderPayment = () => {
     if (!selectedService || !selectedDate || !selectedTimeSlot) return null; // Should not happen if flow is correct
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('booking.payment.title')}</CardTitle>
          <CardDescription>{t('booking.payment.description', { amount: formatPrice(selectedService.price, selectedService.currency, i18n.language) })}</CardDescription>
        </CardHeader>
        <CardContent>
          {bookingError && <Alert variant="destructive" className="mb-4">{bookingError.message}</Alert>}
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(handleMockPayment)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="cardHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="cardHolderName">{t('booking.payment.cardHolderName')}</FormLabel>
                    <FormControl>
                      <Input id="cardHolderName" placeholder={t('booking.payment.cardHolderNamePlaceholder')} {...field} disabled={isCreatingBooking} />
                    </FormControl>
                    <FormMessage>{paymentForm.formState.errors.cardHolderName && t(paymentForm.formState.errors.cardHolderName.message as string)}</FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="cardNumber">{t('booking.payment.cardNumber')}</FormLabel>
                    <FormControl>
                      <Input id="cardNumber" placeholder="0000 0000 0000 0000" {...field} disabled={isCreatingBooking} />
                    </FormControl>
                    <FormMessage>{paymentForm.formState.errors.cardNumber && t(paymentForm.formState.errors.cardNumber.message as string)}</FormMessage>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={paymentForm.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="expiryDate">{t('booking.payment.expiryDate')}</FormLabel>
                      <FormControl>
                        <Input id="expiryDate" placeholder="MM/YY" {...field} disabled={isCreatingBooking} />
                      </FormControl>
                      <FormMessage>{paymentForm.formState.errors.expiryDate && t(paymentForm.formState.errors.expiryDate.message as string)}</FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="cvv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="cvv">{t('booking.payment.cvv')}</FormLabel>
                      <FormControl>
                        <Input id="cvv" placeholder="123" {...field} disabled={isCreatingBooking} />
                      </FormControl>
                      <FormMessage>{paymentForm.formState.errors.cvv && t(paymentForm.formState.errors.cvv.message as string)}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>
              <Alert variant="default" className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>{t('booking.payment.mockNoticeTitle')}</AlertTitle>
                <AlertDescription>{t('booking.payment.mockNoticeDescription')}</AlertDescription>
              </Alert>
              <CardFooter className="flex justify-between mt-6 p-0">
                <Button variant="outline" onClick={handlePrevStep} type="button" disabled={isCreatingBooking}>
                  <ChevronLeft className={cn("h-4 w-4", isRTL ? "ml-1" : "mr-1")} /> {t('buttons.previous')}
                </Button>
                <Button type="submit" disabled={isCreatingBooking}>
                  {isCreatingBooking && <Icons.spinner className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />}
                  {t('booking.payment.payNowButton')}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };

  // Step 5: Booking Confirmed
  const renderBookingConfirmed = () => {
    if (!finalBookingDetails || !selectedService || !selectedDate || !selectedTimeSlot) return null;
    const serviceName = isRTL ? finalBookingDetails.service.name.ar : finalBookingDetails.service.name.en;
    const dateTime = `${formatDate(selectedDate, 'PPP', i18n.language)} ${t('time.at')} ${selectedTimeSlot.start}`;

    return (
      <Card className="text-center">
        <CardHeader>
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">{t('booking.confirmed.title')}</CardTitle>
          <CardDescription>{t('booking.confirmed.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{t('booking.confirmed.bookingId', { id: finalBookingDetails.booking.id })}</p>
          <div className="p-4 border rounded-lg text-left rtl:text-right space-y-2 bg-muted/50">
            <p><strong>{t('booking.service')}:</strong> {serviceName}</p>
            <p><strong>{t('provider.name')}:</strong> {providerBusinessName}</p>
            <p><strong>{t('booking.dateTime')}:</strong> {dateTime}</p>
            <p><strong>{t('booking.totalPrice')}:</strong> {formatPrice(finalBookingDetails.service.price, finalBookingDetails.service.currency, i18n.language)}</p>
            {customerNotes && <p><strong>{t('booking.customerNotesLabel')}:</strong> {customerNotes}</p>}
          </div>
          <p className="text-sm text-muted-foreground">{t('booking.confirmed.emailConfirmation')}</p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild>
            <Link href="/bookings">{t('booking.confirmed.viewMyBookings')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{t('navigation.backToHome')}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderCurrentStep = () => {
    switch (STEPS[currentStep].id) {
      case 'service': return renderServiceSelection();
      case 'datetime': return renderDateTimeSelection();
      case 'confirm': return renderConfirmation();
      case 'payment': return renderPayment();
      case 'booked': return renderBookingConfirmed();
      default: return <p>{t('booking.errors.invalidStep')}</p>;
    }
  };

  return (
    <div className="container py-8">
      <Link href={`/providers/${providerId}`} className="inline-flex items-center text-sm text-primary hover:underline mb-6">
        <ChevronLeft className={cn("h-4 w-4", isRTL ? "ml-1" : "mr-1")} />
        {t('booking.backToProvider', { providerName: providerBusinessName })}
      </Link>
      
      {currentStep < STEPS.length -1 && <StepperUI />}
      {renderCurrentStep()}
    </div>
  );
}
