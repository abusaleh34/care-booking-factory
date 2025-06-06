'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Search, ChevronRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isRTL = i18n.language === 'ar';

  // Featured categories
  const categories = [
    { id: 'hair', name: t('categories.hair', 'Hair') },
    { id: 'makeup', name: t('categories.makeup', 'Makeup') },
    { id: 'spa', name: t('categories.spa', 'Spa') },
    { id: 'nails', name: t('categories.nails', 'Nails') },
    { id: 'barber', name: t('categories.barber', 'Barber') },
    { id: 'facial', name: t('categories.facial', 'Facial') }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">
                {t('app.name')}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium">
              {t('navigation.home')}
            </Link>
            <Link href="/search" className="text-sm font-medium">
              {t('navigation.search')}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                  <span className="sr-only">{t('language.changeLanguage')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                  {t('language.english')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('ar')}>
                  {t('language.arabic')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                {t('auth.login')}
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">{t('auth.register')}</Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                  <span className="sr-only">{t('language.changeLanguage')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                  {t('language.english')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('ar')}>
                  {t('language.arabic')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t p-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.home')}
              </Link>
              <Link
                href="/search"
                className="text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.search')}
              </Link>
              <Link
                href="/auth/login"
                className="text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('auth.login')}
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('auth.register')}
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-16 md:py-24 lg:py-32 flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              {t('app.tagline')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
              {t('app.description')}
            </p>

            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="flex w-full max-w-lg items-center space-x-2 rtl:space-x-reverse"
            >
              <Input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className={cn("h-4 w-4 mr-2", isRTL && "ml-2 mr-0")} />
                {t('form.search')}
              </Button>
            </form>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-12 bg-muted/50">
          <div className="container">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">
                {t('search.categories')}
              </h2>
              <Link href="/search" className="text-sm font-medium flex items-center">
                {t('buttons.seeAll')}
                <ChevronRight className={cn("h-4 w-4 ml-1", isRTL && "rotate-180 mr-1 ml-0")} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/search?category=${category.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <h3 className="font-medium">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Providers Section - Placeholder */}
        <section className="py-12">
          <div className="container">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">
                {t('provider.featured', 'Featured Providers')}
              </h2>
              <Link href="/search" className="text-sm font-medium flex items-center">
                {t('buttons.seeAll')}
                <ChevronRight className={cn("h-4 w-4 ml-1", isRTL && "rotate-180 mr-1 ml-0")} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Provider Cards Placeholder - Will be replaced with real data */}
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted relative">
                      {/* Placeholder for provider image */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-muted-foreground">
                          {t('provider.image', 'Provider Image')}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-lg mb-2">
                        {t('provider.name', 'Provider Name')} {i}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary">
                          {t('categories.hair', 'Hair')}
                        </Badge>
                        <Badge variant="secondary">
                          {t('categories.makeup', 'Makeup')}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          ★★★★☆ (4.0)
                        </span>
                        <Button size="sm" variant="outline">
                          {t('buttons.view')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-10">
        <div className="container flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              {t('footer.copyright')}
            </p>
          </div>
          <nav className="flex gap-4 md:gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              {t('footer.about')}
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              {t('footer.contact')}
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              {t('footer.terms')}
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              {t('footer.privacy')}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
