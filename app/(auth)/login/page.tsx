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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/ui/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Login form schema with validation
const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'errors.requiredField' })
    .email({ message: 'errors.invalidEmail' }),
  password: z
    .string()
    .min(1, { message: 'errors.requiredField' }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

// Mock login API function that will be intercepted by MSW
const loginUser = async (data: { email: string; password: string }) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
};

export default function LoginPage() {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const isRTL = i18n.language === 'ar';

  // Set up form with react-hook-form and zod validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Set up login mutation with React Query
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Store user data and token in localStorage or a state management solution
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      // Redirect based on user role
      if (data.user.role === 'provider') {
        router.push('/provider/dashboard');
      } else {
        router.push('/');
      }
    },
    onError: (error: Error) => {
      setAuthError(error.message);
    },
  });

  // Form submission handler
  const onSubmit = (values: LoginFormValues) => {
    setAuthError(null);
    loginMutation.mutate({
      email: values.email,
      password: values.password,
    });
    
    // If remember me is checked, store email in localStorage
    if (values.rememberMe) {
      localStorage.setItem('rememberedEmail', values.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{t('auth:login.title', 'Sign In')}</h1>
        <p className="text-muted-foreground">
          {t('auth:login.subtitle', 'Enter your credentials to access your account')}
        </p>
      </div>

      {authError && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertDescription>{t(`errors.${authError}`, authError)}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    disabled={loginMutation.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage>{(msg: { message: string }) => t(msg.message)}</FormMessage>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>{t('common:form.password')}</FormLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t('common:auth.forgotPassword')}
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    disabled={loginMutation.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage>{(msg: { message: string }) => t(msg.message)}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rtl:space-x-reverse">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={loginMutation.isPending}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal cursor-pointer">
                  {t('auth:login.rememberMe', 'Remember me')}
                </FormLabel>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('common:auth.login')}
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
        <Button variant="outline" type="button" disabled={loginMutation.isPending}>
          <Icons.google className={cn("mr-2 h-4 w-4", isRTL && "ml-2 mr-0")} />
          Google
        </Button>
        <Button variant="outline" type="button" disabled={loginMutation.isPending}>
          <Icons.apple className={cn("mr-2 h-4 w-4", isRTL && "ml-2 mr-0")} />
          Apple
        </Button>
      </div>

      <div className="text-center text-sm">
        {t('common:auth.dontHaveAccount')}{' '}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          {t('common:auth.signUp')}
        </Link>
      </div>
    </div>
  );
}
