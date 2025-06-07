'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Added import
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn, formatPrice } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog'; // Aliased DialogDescription
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label'; // Label is used outside of FormField here
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription as AlertDescUI } from '@/components/ui/alert'; // Aliased AlertDescription
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'; // Ensured correct import

// Icons
import { PlusCircle, Edit3, Trash2, Loader2, Eye, EyeOff, PackageOpen, AlertTriangle } from 'lucide-react';
import { Icons } from '@/components/ui/icons';

// Types
interface Service {
  id: string;
  providerId: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  price: number;
  currency: string;
  duration: number; // in minutes
  category: string; // category ID
  image?: string;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Category {
  id: string;
  name: { en: string; ar: string };
}

interface ProviderProfile {
  id: string; // This is the actual providerId for services
  userId: string;
  businessName: { en: string; ar: string };
  // ... other provider fields if needed
}

interface UserWithProviderProfile {
  user: {
    id: string;
    role: string;
    // ... other user fields
  };
  provider?: ProviderProfile; // Provider profile might be optional if not fully set up
}

const currencies = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR']; // Example currencies

// Zod Schema for Service Form Validation
const serviceFormSchemaFactory = (t: any) => z.object({
  name_en: z.string().min(1, { message: t('validation.required', { field: t('common:form.nameEnglish', 'English Name') }) }),
  name_ar: z.string().min(1, { message: t('validation.required', { field: t('common:form.nameArabic', 'Arabic Name') }) }),
  description_en: z.string().min(1, { message: t('validation.required', { field: t('common:form.descriptionEnglish', 'English Description') }) }).max(500, { message: t('validation.maxLength', { field: t('common:form.descriptionEnglish', 'English Description'), max: 500 }) }),
  description_ar: z.string().min(1, { message: t('validation.required', { field: t('common:form.descriptionArabic', 'Arabic Description') }) }).max(500, { message: t('validation.maxLength', { field: t('common:form.descriptionArabic', 'Arabic Description'), max: 500 }) }),
  price: z.preprocess(
    (val) => parseFloat(z.string().parse(val)),
    z.number().positive({ message: t('validation.positiveNumber', { field: t('common:form.price', 'Price') }) })
  ),
  currency: z.string().min(1, { message: t('validation.required', { field: t('common:form.currency', 'Currency') }) }),
  duration: z.preprocess(
    (val) => parseInt(z.string().parse(val), 10),
    z.number().int().positive({ message: t('validation.positiveInteger', { field: t('common:form.duration', 'Duration') }) })
  ),
  category: z.string().min(1, { message: t('validation.required', { field: t('common:form.category', 'Category') }) }),
  image: z.string().url({ message: t('validation.invalidUrl', { field: t('common:form.imageUrl', 'Image URL') }) }).optional().or(z.literal('')),
  available: z.boolean().default(true),
});

type ServiceFormValues = z.infer<ReturnType<typeof serviceFormSchemaFactory>>;

// API Interaction Functions
const fetchProviderProfile = async (userId: string): Promise<UserWithProviderProfile> => {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch provider profile');
  return response.json();
};

const fetchServices = async (providerId: string): Promise<Service[]> => {
  const response = await fetch(`/api/services?providerId=${providerId}`);
  if (!response.ok) throw new Error('Failed to fetch services');
  const data = await response.json();
  return data.services || []; // Assuming API returns { services: [], ... }
};

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch('/api/categories');
  if (!response.ok) throw new Error('Failed to fetch categories');
  const data = await response.json();
  return data.categories || [];
};

const addServiceAPI = async (serviceData: ServiceFormValues & { providerId: string }): Promise<Service> => {
  const response = await fetch('/api/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serviceData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add service');
  }
  return response.json();
};

const updateServiceAPI = async ({ id, ...serviceData }: ServiceFormValues & { id: string; providerId: string }): Promise<Service> => {
  const response = await fetch(`/api/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serviceData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update service');
  }
  return response.json();
};

const deleteServiceAPI = async (serviceId: string): Promise<void> => {
  const response = await fetch(`/api/services/${serviceId}`, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete service');
  }
};

const updateServiceAvailabilityAPI = async ({ serviceId, available }: { serviceId: string; available: boolean }): Promise<Service> => {
  const response = await fetch(`/api/services/${serviceId}`, {
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ available }), 
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update service availability');
  }
  return response.json();
};


export default function ProviderServicesPage() {
  const { t, i18n } = useTranslation(['provider', 'common', 'forms']);
  const queryClient = useQueryClient();
  const { user: authUser, isLoading: isLoadingAuth } = useAuth();
  const isRTL = i18n.language === 'ar';
  const serviceFormSchema = serviceFormSchemaFactory(t);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name_en: '', name_ar: '', description_en: '', description_ar: '',
      price: 0, currency: 'USD', duration: 30, category: '', image: '', available: true,
    },
  });

  const { data: userProfileData, isLoading: isLoadingUserProfile, error: userProfileError } = useQuery({
    queryKey: ['providerProfileData', authUser?.id], // Changed queryKey to be more specific
    queryFn: () => authUser ? fetchProviderProfile(authUser.id) : Promise.reject(new Error("User not authenticated")),
    enabled: !!authUser && !isLoadingAuth,
  });

  const providerIdToUse = userProfileData?.provider?.id;

  const { data: services, isLoading: isLoadingServices, error: servicesError } = useQuery<Service[], Error>({
    queryKey: ['providerServices', providerIdToUse],
    queryFn: () => providerIdToUse ? fetchServices(providerIdToUse) : Promise.resolve([]),
    enabled: !!providerIdToUse,
  });

  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const addServiceMutation = useMutation<Service, Error, ServiceFormValues>({
    mutationFn: (data) => addServiceAPI({ ...data, providerId: providerIdToUse! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerServices', providerIdToUse] });
      setDialogOpen(false);
      form.reset();
      setApiError(null);
    },
    onError: (error) => setApiError(error.message),
  });

  const editServiceMutation = useMutation<Service, Error, ServiceFormValues & { id: string }>({
    mutationFn: (data) => updateServiceAPI({ ...data, providerId: providerIdToUse! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerServices', providerIdToUse] });
      setDialogOpen(false);
      form.reset();
      setCurrentService(null);
      setApiError(null);
    },
    onError: (error) => setApiError(error.message),
  });

  const deleteServiceMutation = useMutation<void, Error, string>({
    mutationFn: deleteServiceAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerServices', providerIdToUse] });
      setDeleteDialogOpen(false);
      setCurrentService(null);
      setApiError(null);
    },
    onError: (error) => setApiError(error.message),
  });

  const toggleAvailabilityMutation = useMutation<Service, Error, { serviceId: string; available: boolean }>({
    mutationFn: updateServiceAvailabilityAPI,
    onSuccess: (updatedService) => {
      queryClient.setQueryData<Service[]>(['providerServices', providerIdToUse], (oldData) =>
        oldData?.map(service => service.id === updatedService.id ? updatedService : service) || []
      );
      setApiError(null);
    },
    onError: (error) => setApiError(error.message),
  });

  const handleOpenDialog = (mode: 'add' | 'edit', service?: Service) => {
    setFormMode(mode);
    setApiError(null);
    if (mode === 'edit' && service) {
      setCurrentService(service);
      form.reset({
        name_en: service.name.en,
        name_ar: service.name.ar,
        description_en: service.description.en,
        description_ar: service.description.ar,
        price: service.price,
        currency: service.currency,
        duration: service.duration,
        category: service.category,
        image: service.image || '',
        available: service.available,
      });
    } else {
      setCurrentService(null);
      form.reset({
        name_en: '', name_ar: '', description_en: '', description_ar: '',
        price: 0, currency: 'USD', duration: 30, category: '', image: '', available: true,
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = (data: ServiceFormValues) => {
    if (!providerIdToUse) {
      setApiError("Provider information is missing.");
      return;
    }
    if (formMode === 'add') {
      addServiceMutation.mutate(data);
    } else if (currentService) {
      editServiceMutation.mutate({ ...data, id: currentService.id });
    }
  };

  const handleDeleteService = () => {
    if (currentService) {
      deleteServiceMutation.mutate(currentService.id);
    }
  };

  const handleToggleAvailability = (serviceId: string, available: boolean) => {
    toggleAvailabilityMutation.mutate({ serviceId, available });
  };

  if (isLoadingAuth || isLoadingUserProfile) {
    return (
      <div className="container py-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      </div>
    );
  }

  if (userProfileError) {
    return <div className="container py-8"><Alert variant="destructive"><AlertTitle>{t('common:errors.general')}</AlertTitle><AlertDescUI>{userProfileError.message}</AlertDescUI></Alert></div>;
  }
  
  if (authUser && authUser.role === 'provider' && !providerIdToUse && !isLoadingUserProfile) {
    return (
      <div className="container py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('profileNotSetupTitle', 'Provider Profile Not Set Up')}</h2>
        <p className="text-muted-foreground mb-6">{t('profileNotSetupMessage', 'Please complete your provider profile setup to manage services.')}</p>
        <Button asChild><Link href="/provider/profile/edit">{t('setupProfileButton', 'Set Up Profile')}</Link></Button>
      </div>
    );
  }


  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('manageServicesTitle', 'Manage Your Services')}</h1>
          <p className="text-muted-foreground">{t('manageServicesSubtitle', 'Add, edit, or remove services offered by your business.')}</p>
        </div>
        <Button onClick={() => handleOpenDialog('add')}>
          <PlusCircle className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
          {t('addNewServiceButton', 'Add New Service')}
        </Button>
      </div>

      {apiError && <Alert variant="destructive"><AlertTitle>{t('common:errors.general')}</AlertTitle><AlertDescUI>{apiError}</AlertDescUI></Alert>}
      {servicesError && <Alert variant="destructive"><AlertTitle>{t('common:errors.general')}</AlertTitle><AlertDescUI>{servicesError.message}</AlertDescUI></Alert>}
      {categoriesError && <Alert variant="destructive"><AlertTitle>{t('common:errors.general')}</AlertTitle><AlertDescUI>{categoriesError.message}</AlertDescUI></Alert>}

      {isLoadingServices || isLoadingCategories ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : services && services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => {
            const categoryName = categories?.find(c => c.id === service.category)?.name;
            return (
              <Card key={service.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{isRTL ? service.name.ar : service.name.en}</CardTitle>
                  {categoryName && <Badge variant="outline" className="mt-1 w-fit">{isRTL ? categoryName.ar : categoryName.en}</Badge>}
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">{isRTL ? service.description.ar : service.description.en}</p>
                  <div className="text-sm">
                    <strong>{t('common:form.price')}:</strong> {formatPrice(service.price, service.currency, i18n.language)}
                  </div>
                  <div className="text-sm">
                    <strong>{t('common:form.duration')}:</strong> {service.duration} {t('common:time.minutesShort')}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-4 border-t">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch
                      id={`available-${service.id}`}
                      checked={service.available}
                      onCheckedChange={(checked) => handleToggleAvailability(service.id, checked)}
                      disabled={toggleAvailabilityMutation.isPending && toggleAvailabilityMutation.variables?.serviceId === service.id}
                    />
                    <Label htmlFor={`available-${service.id}`} className="text-sm">
                      {service.available ? t('common:status.active', 'Active') : t('common:status.inactive', 'Inactive')}
                    </Label>
                    {toggleAvailabilityMutation.isPending && toggleAvailabilityMutation.variables?.serviceId === service.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog('edit', service)}>
                      <Edit3 className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" /> {t('common:buttons.edit')}
                    </Button>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" onClick={() => { setCurrentService(service); setDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" /> {t('common:buttons.delete')}
                      </Button>
                    </AlertDialogTrigger>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <PackageOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('noServicesTitle', 'No Services Yet')}</h3>
          <p className="text-muted-foreground mb-6">{t('noServicesSubtitle', 'Start by adding your first service to attract customers.')}</p>
          <Button onClick={() => handleOpenDialog('add')}>
            <PlusCircle className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {t('addFirstServiceButton', 'Add Your First Service')}
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(isOpen) => { setDialogOpen(isOpen); if (!isOpen) { form.reset(); setCurrentService(null); setApiError(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formMode === 'add' ? t('addNewServiceTitle', 'Add New Service') : t('editServiceTitle', 'Edit Service')}</DialogTitle>
            <DialogDesc>{formMode === 'add' ? t('addNewServiceDesc', 'Fill in the details for your new service.') : t('editServiceDesc', 'Update the details of your service.')}</DialogDesc>
          </DialogHeader>
          {apiError && <Alert variant="destructive"><AlertTitle>{t('common:errors.general')}</AlertTitle><AlertDescUI>{apiError}</AlertDescUI></Alert>}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name_en" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common:form.nameEnglish')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage>{form.formState.errors.name_en && t(form.formState.errors.name_en.message as string, { field: t('common:form.nameEnglish') })}</FormMessage>
                  </FormItem>
                )} />
                <FormField control={form.control} name="name_ar" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common:form.nameArabic')}</FormLabel>
                    <FormControl><Input dir="rtl" {...field} /></FormControl>
                    <FormMessage>{form.formState.errors.name_ar && t(form.formState.errors.name_ar.message as string, { field: t('common:form.nameArabic') })}</FormMessage>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description_en" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common:form.descriptionEnglish')}</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage>{form.formState.errors.description_en && t(form.formState.errors.description_en.message as string, { field: t('common:form.descriptionEnglish'), max: 500 })}</FormMessage>
                </FormItem>
              )} />
              <FormField control={form.control} name="description_ar" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common:form.descriptionArabic')}</FormLabel>
                  <FormControl><Textarea dir="rtl" rows={3} {...field} /></FormControl>
                  <FormMessage>{form.formState.errors.description_ar && t(form.formState.errors.description_ar.message as string, { field: t('common:form.descriptionArabic'), max: 500 })}</FormMessage>
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common:form.price')}</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage>{form.formState.errors.price && t(form.formState.errors.price.message as string, { field: t('common:form.price') })}</FormMessage>
                  </FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common:form.currency')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t('forms:placeholders.selectCurrency', 'Select currency')} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {currencies.map(curr => <SelectItem key={curr} value={curr}>{curr}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage>{form.formState.errors.currency && t(form.formState.errors.currency.message as string, { field: t('common:form.currency') })}</FormMessage>
                  </FormItem>
                )} />
                <FormField control={form.control} name="duration" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common:form.duration')} ({t('common:time.minutes')})</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage>{form.formState.errors.duration && t(form.formState.errors.duration.message as string, { field: t('common:form.duration') })}</FormMessage>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common:form.category')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingCategories}>
                    <FormControl><SelectTrigger><SelectValue placeholder={isLoadingCategories ? t('common:loading.loading') : t('forms:placeholders.selectCategory', 'Select category')} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories?.map(cat => <SelectItem key={cat.id} value={cat.id}>{isRTL ? cat.name.ar : cat.name.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage>{form.formState.errors.category && t(form.formState.errors.category.message as string, { field: t('common:form.category') })}</FormMessage>
                </FormItem>
              )} />
              <FormField control={form.control} name="image" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common:form.imageUrl')} ({t('common:form.optional')})</FormLabel>
                  <FormControl><Input type="url" placeholder="https://example.com/image.jpg" {...field} /></FormControl>
                  <FormMessage>{form.formState.errors.image && t(form.formState.errors.image.message as string, { field: t('common:form.imageUrl') })}</FormMessage>
                </FormItem>
              )} />
              <FormField control={form.control} name="available" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>{t('common:form.availableForBooking', 'Available for Booking')}</FormLabel>
                    <FormDescription>{t('forms:descriptions.serviceAvailability', 'Allow customers to book this service.')}</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">{t('common:buttons.cancel')}</Button></DialogClose>
                <Button type="submit" disabled={addServiceMutation.isPending || editServiceMutation.isPending}>
                  {(addServiceMutation.isPending || editServiceMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {formMode === 'add' ? t('common:buttons.add') : t('common:buttons.saveChanges')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteServiceTitle', 'Are you sure?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteServiceDesc', 'This action cannot be undone. This will permanently delete the service')}
              {currentService && <strong className="mx-1">{isRTL ? currentService.name.ar : currentService.name.en}</strong>}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCurrentService(null)}>{t('common:buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleDeleteService}
                disabled={deleteServiceMutation.isPending}
              >
                {deleteServiceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common:buttons.delete')}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
