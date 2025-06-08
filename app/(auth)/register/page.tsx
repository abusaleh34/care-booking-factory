'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Icons } from '@/components/ui/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Registration form schema with validation
const registerFormSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'validation.required' }),
  lastName: z
    .string()
    .min(1, { message: 'validation.required' }),
  email: z
    .string()
    .min(1, { message: 'validation.required' })
    .email({ message: 'validation.email' }),
  phoneNumber: z
    .string()
    .min(1, { message: 'validation.required' })
    .regex(/^\+?[0-9\s-()]{8,}$/, { message: 'validation.phoneNumber' }),
  password: z
    .string()
    .min(8, { message: 'validation.password' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'validation.required' }),
  role: z
    .enum(['customer', 'provider'], { required_error: 'validation.required' }),
  terms: z
    .boolean()
    .refine((val) => val === true, { message: 'validation.termsRequired' }),
  privacy: z
    .boolean()
    .refine((val) => val === true, { message: 'validation.termsRequired' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'validation.passwordMatch',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

// Mock registration API function that will be intercepted by MSW
const registerUser = async (data: RegisterFormValues) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
};

export default function RegisterPage() {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const isRTL = i18n.language === 'ar';

  // Set up form with react-hook-form and zod validation
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      role: 'customer',
      terms: false,
      privacy: false,
    },
  });

  // Set up registration mutation with React Query
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      // Store user data and token in localStorage or a state management solution
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      // Redirect to OTP verification
      router.push('/auth/verify-otp');
    },
    onError: (error: Error) => {
      setAuthError(error.message);
      if (error.message.includes('already in use')) {
        setAuthError('register.alreadyExists');
      }
    },
  });

  // Form submission handler
  const onSubmit = (values: RegisterFormValues) => {
    setAuthError(null);
    registerMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{t('auth:register.title')}</h1>
        <p className="text-muted-foreground">
          {t('auth:register.subtitle')}
        </p>
      </div>

      {authError && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertDescription>{t(`auth:${authError}`, t(`errors.${authError}`, authError))}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Account Type Selection */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>{t('auth:register.accountType')}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4 rtl:space-x-reverse"
                  >
                    <FormItem className="flex items-center space-x-2 rtl:space-x-reverse">
                      <FormControl>
                        <RadioGroupItem value="customer" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {t('auth:register.customerAccount')}
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 rtl:space-x-reverse">
                      <FormControl>
                        <RadioGroupItem value="provider" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {t('auth:register.providerAccount')}
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage>{(msg: { message: string }) => t(`auth:${msg.message}`)}</FormMessage>
              </FormItem>
            )}
          />
          
          {/* Name Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common:form.firstName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('common:form.firstName')}
                      disabled={registerMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{(msg: { message: string }) => t(`auth:${msg.message}`)}</FormMessage>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common:form.lastName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('common:form.lastName')}
                      disabled={registerMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{(msg: { message: string }) => t(`auth:${msg.message}`)}</FormMessage>
                </FormItem>
              )}
            />
          </div>
          
          {/* Contact Information */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common:form.email')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    disabled={registerMutation.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage>{(msg: { message: string }) => t(`auth:${msg.message}`)}</FormMessage>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common:form.phoneNumber')}</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    autoComplete="tel"
                    disabled={registerMutation.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage>{(msg: { message: string }) => t(`auth:${msg.message}`)}</FormMessage>
              </FormItem>
            )}
          />
          
          {/* Password Fields */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common:form.password')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    disabled={registerMutation.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage>{(msg: { message: string }) => t(`auth:${msg.message}`)}</FormMessage>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common:form.confirmPassword')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    disabled={registerMutation.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage>{(msg: { message: string }) => t(`auth:${msg.message}`)}</FormMessage>
              </FormItem>
            )}
          />
          
          {/* Terms and Privacy */}
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rtl:space-x-reverse">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={registerMutation.isPending}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      {t('auth:register.termsAndConditions')}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="privacy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rtl:space-x-reverse">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={registerMutation.isPending}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      {t('auth:register.privacyPolicy')}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <Icons.spinner className={cn("mr-2 h-4 w-4", isRTL && "ml-2 mr-0")} />
            ) : null}
            {t('common:auth.register')}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('common:auth.orContinueWith')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" type="button" disabled={registerMutation.isPending}>
          <Icons.google className={cn("mr-2 h-4 w-4", isRTL && "ml-2 mr-0")} />
          Google
        </Button>
        <Button variant="outline" type="button" disabled={registerMutation.isPending}>
          <Icons.apple className={cn("mr-2 h-4 w-4", isRTL && "ml-2 mr-0")} />
          Apple
        </Button>
      </div>

      <div className="text-center text-sm">
        {t('common:auth.alreadyHaveAccount')}{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          {t('common:auth.signIn')}
        </Link>
      </div>
    </div>
  );
}
