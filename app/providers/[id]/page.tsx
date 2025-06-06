'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO, getDay } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Icons
import { Star, MapPin, Clock, DollarSign, ChevronRight, MessageCircle, ImageIcon, Phone, Mail, CalendarDays, Users, Award } from 'lucide-react';
import { Icons } from '@/components/ui/icons';

// Utils
import { cn, formatDate, formatPrice, getDirection } from '@/lib/utils';

// Types (ensure these match your actual data structures from MSW)
interface ProviderDetails {
  id: string;
  userId: string;
  businessName: { en: string; ar: string };
  description: { en: string; ar: string };
  category: string[];
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  workingHours: {
    [key: string]: {
      isOpen: boolean;
      slots: { start: string; end: string }[];
    };
  };
  rating: number;
  reviewCount: number;
  gallery: string[];
  verified: boolean;
  featured: boolean;
  // Assuming phone and email are part of the provider or user object
  phoneNumber?: string; // Add if available directly on provider
  email?: string; // Add if available directly on provider
}

interface Service {
  id: string;
  providerId: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  price: number;
  currency: string;
  duration: number; // in minutes
  category: string;
  image?: string;
  available: boolean;
}

interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customer?: { // Assuming customer details might be fetched with reviews
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  providerId: string;
  serviceId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProviderPageData {
  provider: ProviderDetails;
  services: Service[];
  reviews: Review[];
}

// Mock API function to fetch provider details
const fetchProviderDetails = async (id: string): Promise<ProviderPageData> => {
  const response = await fetch(`/api/providers/${id}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch provider details');
  }
  return response.json();
};


export default function ProviderProfilePage() {
  const params = useParams();
  const providerId = params.id as string;
  const { t, i18n } = useTranslation(['common', 'provider']);
  const router = useRouter();
  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? ar : enUS;

  const { data, isLoading, error } = useQuery<ProviderPageData, Error>({
    queryKey: ['providerProfile', providerId],
    queryFn: () => fetchProviderDetails(providerId),
    enabled: !!providerId, // Only run query if providerId is available
  });

  const dayNames = [
    t('time.daysFull.sunday', 'Sunday'),
    t('time.daysFull.monday', 'Monday'),
    t('time.daysFull.tuesday', 'Tuesday'),
    t('time.daysFull.wednesday', 'Wednesday'),
    t('time.daysFull.thursday', 'Thursday'),
    t('time.daysFull.friday', 'Friday'),
    t('time.daysFull.saturday', 'Saturday'),
  ];

  if (isLoading) {
    return (
      <div className="container py-8 space-y-8">
        <Skeleton className="h-48 w-full rounded-lg" /> {/* Banner Placeholder */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 space-y-4">
            <Skeleton className="h-32 w-32 rounded-full mx-auto md:mx-0" /> {/* Avatar */}
            <Skeleton className="h-8 w-3/4 mx-auto md:mx-0" /> {/* Name */}
            <Skeleton className="h-6 w-1/2 mx-auto md:mx-0" /> {/* Rating */}
            <Skeleton className="h-10 w-full" /> {/* Book Button */}
          </div>
          <div className="w-full md:w-2/3 space-y-6">
            <Skeleton className="h-10 w-full" /> {/* Tabs Trigger */}
            <Skeleton className="h-64 w-full" /> {/* Tab Content */}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <Icons.alert className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('errors.general')}</h2>
        <p className="text-muted-foreground mb-6">{error.message || t('errors.tryAgain')}</p>
        <Button onClick={() => router.push('/search')}>{t('navigation.backToSearch', 'Back to Search')}</Button>
      </div>
    );
  }

  if (!data) return null;

  const { provider, services, reviews } = data;
  const providerName = isRTL ? provider.businessName.ar : provider.businessName.en;
  const providerBio = isRTL ? provider.description.ar : provider.description.en;

  return (
    <div className="bg-muted/30 min-h-screen">
      {/* Provider Header */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary to-primary/70">
        {provider.gallery && provider.gallery.length > 0 && (
          <Image
            src={provider.gallery[0]} // Use first gallery image as banner
            alt={`${providerName} banner`}
            fill
            className="object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-black/30" /> {/* Overlay */}
        <div className="container relative h-full flex flex-col justify-end pb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">{providerName}</h1>
          <div className="flex items-center gap-2 mt-2">
            {provider.verified && <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">{t('provider:verified')}</Badge>}
            <Badge variant="secondary">{provider.category.map(c => t(`categories:${c}`, c)).join(', ')}</Badge>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Provider Info */}
          <div className="w-full lg:w-1/3 space-y-6">
            <Card>
              <CardHeader className="items-center">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg -mt-16">
                  <AvatarImage src={provider.gallery[1] || provider.gallery[0]} alt={providerName} />
                  <AvatarFallback>{providerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </CardHeader>
              <CardContent className="text-center">
                <h2 className="text-2xl font-semibold">{providerName}</h2>
                <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{provider.rating.toFixed(1)}</span>
                  <span>({provider.reviewCount} {t('reviews:reviewsCount', { count: provider.reviewCount })})</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{providerBio}</p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button size="lg" className="w-full" onClick={() => alert(t('provider:bookNowClicked', 'Book Now Clicked! Implement booking flow.'))}>
                  <CalendarDays className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
                  {t('provider:bookAppointment', 'Book Appointment')}
                </Button>
                {/* <Button variant="outline" className="w-full">
                  <Heart className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
                  {t('buttons.addToFavorites')}
                </Button> */}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('provider:contactInfo', 'Contact Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start">
                  <MapPin className={cn("h-4 w-4 mt-0.5 text-muted-foreground", isRTL ? "ml-3" : "mr-3")} />
                  <span>
                    {provider.address.street}, {provider.address.city}, {provider.address.state} {provider.address.postalCode}, {provider.address.country}
                  </span>
                </div>
                {provider.phoneNumber && (
                  <div className="flex items-center">
                    <Phone className={cn("h-4 w-4 text-muted-foreground", isRTL ? "ml-3" : "mr-3")} />
                    <a href={`tel:${provider.phoneNumber}`} className="hover:underline">{provider.phoneNumber}</a>
                  </div>
                )}
                {provider.email && (
                  <div className="flex items-center">
                    <Mail className={cn("h-4 w-4 text-muted-foreground", isRTL ? "ml-3" : "mr-3")} />
                    <a href={`mailto:${provider.email}`} className="hover:underline">{provider.email}</a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Tabs */}
          <div className="w-full lg:w-2/3">
            <Tabs defaultValue="services" className="w-full" dir={getDirection(i18n.language)}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
                <TabsTrigger value="services">{t('provider:services', 'Services')}</TabsTrigger>
                <TabsTrigger value="gallery">{t('provider:gallery', 'Gallery')}</TabsTrigger>
                <TabsTrigger value="hours">{t('provider:workingHours', 'Working Hours')}</TabsTrigger>
                <TabsTrigger value="reviews">{t('provider:reviews', 'Reviews')}</TabsTrigger>
              </TabsList>

              {/* Services Tab */}
              <TabsContent value="services">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('provider:ourServices', 'Our Services')}</CardTitle>
                    <CardDescription>{t('provider:servicesDescription', 'Browse our range of professional services.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {services.length > 0 ? services.map((service) => (
                      <Card key={service.id} className="flex flex-col sm:flex-row gap-4 p-4">
                        {service.image && (
                          <div className="w-full sm:w-1/4 h-32 sm:h-auto relative rounded-md overflow-hidden">
                            <Image src={service.image} alt={isRTL ? service.name.ar : service.name.en} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{isRTL ? service.name.ar : service.name.en}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{isRTL ? service.description.ar : service.description.en}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 text-primary mr-1 rtl:ml-1 rtl:mr-0" />
                              {formatPrice(service.price, service.currency, i18n.language)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-primary mr-1 rtl:ml-1 rtl:mr-0" />
                              {service.duration} {t('time.minutesShort', 'min')}
                            </div>
                          </div>
                        </div>
                        <Button 
                          className="mt-4 sm:mt-0 sm:self-center"
                          onClick={() => alert(`${t('provider:bookService', 'Book')} ${isRTL ? service.name.ar : service.name.en}`)}
                        >
                          {t('buttons.book')}
                        </Button>
                      </Card>
                    )) : (
                      <p className="text-muted-foreground">{t('empty.noServices')}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gallery Tab */}
              <TabsContent value="gallery">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('provider:galleryTitle', 'Our Work')}</CardTitle>
                    <CardDescription>{t('provider:galleryDescription', 'A glimpse into our salon and the results we deliver.')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {provider.gallery.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {provider.gallery.map((imgUrl, index) => (
                          <div key={index} className="aspect-square relative rounded-lg overflow-hidden shadow-md group">
                            <Image src={imgUrl} alt={`${providerName} gallery image ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">{t('provider:noGalleryImages', 'No images in gallery yet.')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Working Hours Tab */}
              <TabsContent value="hours">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('provider:workingHoursTitle', 'Working Hours')}</CardTitle>
                    <CardDescription>{t('provider:workingHoursDescription', 'Our weekly schedule. We look forward to seeing you!')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[150px]">{t('time.day', 'Day')}</TableHead>
                          <TableHead>{t('time.hours', 'Hours')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayNames.map((dayName, index) => {
                          const dayKey = index.toString(); // API uses 0 for Sunday, 1 for Monday...
                          const hours = provider.workingHours[dayKey];
                          return (
                            <TableRow key={dayName}>
                              <TableCell className="font-medium">{dayName}</TableCell>
                              <TableCell>
                                {hours && hours.isOpen ? (
                                  hours.slots.map((slot, i) => (
                                    <span key={i} className="block">
                                      {slot.start} - {slot.end}
                                      {i < hours.slots.length - 1 && <br/>}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground">{t('time.closed', 'Closed')}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('provider:customerReviews', 'Customer Reviews')}</CardTitle>
                    <CardDescription>{t('reviews:basedOn', { count: provider.reviewCount })}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {reviews.length > 0 ? reviews.map((review) => (
                      <div key={review.id} className="flex gap-4">
                        <Avatar>
                          <AvatarImage src={review.customer?.avatar} alt={review.customer?.firstName} />
                          <AvatarFallback>
                            {review.customer?.firstName?.[0] || 'U'}
                            {review.customer?.lastName?.[0] || 'R'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">
                              {review.customer?.firstName} {review.customer?.lastName || t('reviews:anonymousUser', 'Anonymous')}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(review.createdAt, 'PP', i18n.language)}
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            {Array(5).fill(0).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-sm mt-2 text-foreground/80">{review.comment}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">{t('reviews:noReviewsYet', 'No reviews yet. Be the first to write one!')}</p>
                      </div>
                    )}
                    {reviews.length > 0 && (
                       <div className="pt-4 text-center">
                         <Button variant="outline">{t('buttons:seeMoreReviews', 'See More Reviews')}</Button>
                       </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
