'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Icons
import { Search, Filter, Star, MapPin, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Icons } from '@/components/ui/icons';

// Utils
import { cn } from '@/lib/utils';

// Types
type Provider = {
  id: string;
  businessName: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  category: string[];
  address: {
    city: string;
    country: string;
  };
  rating: number;
  reviewCount: number;
  gallery: string[];
  verified: boolean;
  featured: boolean;
};

type Category = {
  id: string;
  name: {
    en: string;
    ar: string;
  };
};

// API functions
const fetchProviders = async (
  page = 1,
  limit = 9,
  search = '',
  category = '',
  featured = false,
  minRating = 0
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (featured) params.append('featured', 'true');
  if (minRating > 0) params.append('minRating', minRating.toString());

  const response = await fetch(`/api/providers?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch providers');
  }
  return response.json();
};

const fetchCategories = async () => {
  const response = await fetch('/api/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

export default function SearchPage() {
  const { t, i18n } = useTranslation(['common']);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = i18n.language === 'ar';

  // Extract search parameters
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';

  // State for filters
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [minRating, setMinRating] = useState(0);
  const [featured, setFeatured] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const itemsPerPage = 9;

  // Fetch providers with React Query
  const {
    data: providersData,
    isLoading: isLoadingProviders,
    error: providersError,
    refetch: refetchProviders,
  } = useQuery({
    queryKey: ['providers', currentPage, searchQuery, selectedCategory, featured, minRating],
    queryFn: () => fetchProviders(currentPage, itemsPerPage, searchQuery, selectedCategory, featured, minRating),
    staleTime: 60000, // 1 minute
  });

  // Fetch categories with React Query
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: Infinity, // Categories don't change often
  });

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    refetchProviders();
    setFiltersOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory('');
    setMinRating(0);
    setFeatured(false);
    setCurrentPage(1);
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetchProviders();
  };

  // Update URL with search parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    
    const url = `/search?${params.toString()}`;
    router.replace(url);
  }, [searchQuery, selectedCategory, router]);

  // Handle pagination
  const totalPages = providersData ? Math.ceil(providersData.total / itemsPerPage) : 0;
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Render pagination controls
  const renderPagination = () => {
    if (!totalPages || totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mt-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNumber;
          
          if (totalPages <= 5) {
            // Show all pages if 5 or fewer
            pageNumber = i + 1;
          } else if (currentPage <= 3) {
            // At the start
            pageNumber = i + 1;
          } else if (currentPage >= totalPages - 2) {
            // At the end
            pageNumber = totalPages - 4 + i;
          } else {
            // In the middle
            pageNumber = currentPage - 2 + i;
          }
          
          return (
            <Button
              key={pageNumber}
              variant={currentPage === pageNumber ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(pageNumber)}
            >
              {pageNumber}
            </Button>
          );
        })}
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Render provider card
  const renderProviderCard = (provider: Provider) => {
    const name = isRTL ? provider.businessName.ar : provider.businessName.en;
    const description = isRTL ? provider.description.ar : provider.description.en;
    
    return (
      <Card key={provider.id} className="overflow-hidden h-full flex flex-col">
        <div className="aspect-video relative bg-muted overflow-hidden">
          {provider.gallery && provider.gallery.length > 0 ? (
            <Image
              src={provider.gallery[0]}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icons.user className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          {provider.featured && (
            <Badge className="absolute top-2 right-2 bg-primary">
              {t('provider.featured')}
            </Badge>
          )}
        </div>
        <CardContent className="p-4 flex-1">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{name}</h3>
            {provider.verified && (
              <Badge variant="outline" className="ml-1 rtl:mr-1 rtl:ml-0">
                {t('provider.verified')}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <MapPin className="h-3.5 w-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
            <span>
              {provider.address.city}, {provider.address.country}
            </span>
          </div>
          
          <div className="flex items-center mb-3">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1 rtl:ml-1 rtl:mr-0" />
            <span className="text-sm font-medium">{provider.rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground ml-1 rtl:mr-1 rtl:ml-0">
              ({provider.reviewCount})
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-2">
            {provider.category.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {t(`categories.${cat}`, cat)}
              </Badge>
            ))}
            {provider.category.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{provider.category.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 mt-auto">
          <Button asChild className="w-full">
            <Link href={`/providers/${provider.id}`}>
              {t('buttons.view')}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Render loading skeleton
  const renderSkeletons = () => {
    return Array(itemsPerPage)
      .fill(0)
      .map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-video relative bg-muted">
            <Skeleton className="h-full w-full" />
          </div>
          <CardContent className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-3" />
            <div className="flex gap-1 mb-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ));
  };

  // Render filter sidebar for desktop
  const renderFilterSidebar = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-3">{t('search.categories')}</h3>
          <div className="space-y-2">
            {isLoadingCategories ? (
              <>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </>
            ) : (
              categoriesData?.categories.map((category: Category) => (
                <div key={category.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategory === category.id}
                    onCheckedChange={() => 
                      setSelectedCategory(selectedCategory === category.id ? '' : category.id)
                    }
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {isRTL ? category.name.ar : category.name.en}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3">{t('search.rating')}</h3>
          <div className="space-y-4">
            {[4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={minRating === rating}
                  onCheckedChange={() => setMinRating(minRating === rating ? 0 : rating)}
                />
                <label
                  htmlFor={`rating-${rating}`}
                  className="text-sm flex items-center cursor-pointer"
                >
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                  <span className="ml-1 rtl:mr-1 rtl:ml-0">
                    {t('search.andAbove')}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox
              id="featured"
              checked={featured}
              onCheckedChange={(checked) => setFeatured(!!checked)}
            />
            <label htmlFor="featured" className="text-sm cursor-pointer">
              {t('provider.featured')}
            </label>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={applyFilters} className="w-full mb-2">
            {t('form.apply')}
          </Button>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="w-full"
          >
            {t('form.clear')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="bg-muted/30 border-b py-6">
        <div className="container">
          <h1 className="text-2xl font-bold mb-4">{t('search.searchResults')}</h1>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-9 rtl:pr-9 rtl:pl-4",
                  isRTL ? "text-right" : "text-left"
                )}
              />
            </div>
            <Button type="submit">{t('form.search')}</Button>
            
            {/* Mobile filter button */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden" type="button">
                  <Filter className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('search.filters')}
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? "right" : "left"} className="w-[300px] sm:w-[350px]">
                <div className="h-full py-4 overflow-y-auto">
                  {renderFilterSidebar()}
                </div>
              </SheetContent>
            </Sheet>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-64 shrink-0">
            {renderFilterSidebar()}
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Active filters */}
            {(selectedCategory || minRating > 0 || featured) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategory && categoriesData?.categories && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {isRTL 
                      ? categoriesData.categories.find((c: Category) => c.id === selectedCategory)?.name.ar 
                      : categoriesData.categories.find((c: Category) => c.id === selectedCategory)?.name.en}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedCategory('')}
                    />
                  </Badge>
                )}
                
                {minRating > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {minRating}+ {t('search.rating')}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setMinRating(0)}
                    />
                  </Badge>
                )}
                
                {featured && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {t('provider.featured')}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFeatured(false)}
                    />
                  </Badge>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-7"
                >
                  {t('form.clear')}
                </Button>
              </div>
            )}

            {/* Results count and sort */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">
                {providersData?.total
                  ? t('search.resultsCount', {
                      count: providersData.total,
                      defaultValue: '{{count}} results found',
                    })
                  : isLoadingProviders
                  ? t('loading.loading')
                  : t('empty.noResults')}
              </p>
              
              <Select
                defaultValue="rating"
                onValueChange={(value) => {
                  // Sort functionality would be implemented here
                  // For now, it's just UI
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('search.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">{t('search.sortByRating')}</SelectItem>
                  <SelectItem value="reviews">{t('search.sortByReviews')}</SelectItem>
                  <SelectItem value="name">{t('search.sortByName')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results grid */}
            {providersError ? (
              <div className="text-center py-12">
                <p className="text-destructive mb-2">{t('errors.general')}</p>
                <Button onClick={() => refetchProviders()}>
                  {t('errors.tryAgain')}
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoadingProviders
                    ? renderSkeletons()
                    : providersData?.providers?.length > 0
                    ? providersData.providers.map((provider: Provider) => 
                        renderProviderCard(provider)
                      )
                    : (
                      <div className="col-span-full text-center py-12">
                        <Icons.search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          {t('empty.noResults')}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {t('search.tryDifferentSearch')}
                        </p>
                        <Button onClick={resetFilters}>
                          {t('form.clear')}
                        </Button>
                      </div>
                    )}
                </div>

                {/* Pagination */}
                {renderPagination()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
