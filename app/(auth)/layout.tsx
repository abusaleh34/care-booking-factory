'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header with language switcher */}
      <header className="w-full py-4 px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-lg">{t('app.name')}</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Globe className="h-5 w-5" />
              <span className="sr-only">{t('language.changeLanguage')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"}>
            <DropdownMenuItem onClick={() => changeLanguage('en')}>
              {t('language.english')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('ar')}>
              {t('language.arabic')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main content - centered */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className={cn(
          "w-full max-w-md mx-auto bg-background rounded-lg shadow-lg p-8 border animate-in fade-in duration-500",
          isRTL ? "text-right" : "text-left"
        )}>
          {children}
        </div>
      </main>

      {/* Simple footer */}
      <footer className="py-4 px-6 text-center text-sm text-muted-foreground">
        <p>{t('footer.copyright')}</p>
      </footer>
    </div>
  );
}
