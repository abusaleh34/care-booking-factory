import { http, HttpResponse, delay } from 'msw';
import { format, addDays, subDays, addHours, parseISO, isAfter, isBefore } from 'date-fns';

// Types for our mock data
type User = {
  id: string;
  email: string;
  password: string; // In a real app, this would be hashed
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'customer' | 'provider';
  avatar?: string;
  createdAt: string;
  language: 'en' | 'ar';
  favorites: string[];
};

type Provider = {
  id: string;
  userId: string;
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
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  workingHours: {
    [key: string]: { // day of week (0-6, 0 is Sunday)
      isOpen: boolean;
      slots: {
        start: string; // HH:mm format
        end: string; // HH:mm format
      }[];
    };
  };
  rating: number;
  reviewCount: number;
  services: string[];
  gallery: string[];
  verified: boolean;
  featured: boolean;
};

type Service = {
  id: string;
  providerId: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  price: number;
  currency: string;
  duration: number; // in minutes
  category: string;
  image?: string;
  available: boolean;
};

type Booking = {
  id: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalPrice: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type Review = {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

// Generate mock data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'customer@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
    role: 'customer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    createdAt: new Date(2023, 1, 1).toISOString(),
    language: 'en',
    favorites: ['1', '3'],
  },
  {
    id: '2',
    email: 'provider@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    phoneNumber: '+1987654321',
    role: 'provider',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    createdAt: new Date(2023, 0, 15).toISOString(),
    language: 'en',
    favorites: [],
  },
  {
    id: '3',
    email: 'arabic@example.com',
    password: 'password123',
    firstName: 'محمد',
    lastName: 'أحمد',
    phoneNumber: '+9665XXXXXXXX',
    role: 'customer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed',
    createdAt: new Date(2023, 2, 10).toISOString(),
    language: 'ar',
    favorites: ['2'],
  },
  {
    id: '4',
    email: 'arabic-provider@example.com',
    password: 'password123',
    firstName: 'فاطمة',
    lastName: 'علي',
    phoneNumber: '+9665XXXXXXXX',
    role: 'provider',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    createdAt: new Date(2023, 3, 5).toISOString(),
    language: 'ar',
    favorites: [],
  },
];

const mockProviders: Provider[] = [
  {
    id: '1',
    userId: '2',
    businessName: {
      en: 'Elegant Beauty Salon',
      ar: 'صالون الأناقة للتجميل',
    },
    description: {
      en: 'Luxury beauty salon offering a wide range of services including hair styling, makeup, nail care, and skin treatments.',
      ar: 'صالون تجميل فاخر يقدم مجموعة واسعة من الخدمات بما في ذلك تصفيف الشعر والمكياج والعناية بالأظافر وعلاجات البشرة.',
    },
    category: ['hair', 'makeup', 'nails', 'skincare'],
    address: {
      street: '123 Beauty Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      coordinates: {
        lat: 40.7128,
        lng: -74.006,
      },
    },
    workingHours: {
      '0': { isOpen: false, slots: [] }, // Sunday
      '1': { // Monday
        isOpen: true,
        slots: [
          { start: '09:00', end: '17:00' },
        ],
      },
      '2': { // Tuesday
        isOpen: true,
        slots: [
          { start: '09:00', end: '17:00' },
        ],
      },
      '3': { // Wednesday
        isOpen: true,
        slots: [
          { start: '09:00', end: '17:00' },
        ],
      },
      '4': { // Thursday
        isOpen: true,
        slots: [
          { start: '09:00', end: '17:00' },
        ],
      },
      '5': { // Friday
        isOpen: true,
        slots: [
          { start: '09:00', end: '17:00' },
        ],
      },
      '6': { // Saturday
        isOpen: true,
        slots: [
          { start: '10:00', end: '15:00' },
        ],
      },
    },
    rating: 4.8,
    reviewCount: 124,
    services: ['1', '2', '3', '4'],
    gallery: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937',
      'https://images.unsplash.com/photo-1487412947147-5cdc1cee3571',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e',
    ],
    verified: true,
    featured: true,
  },
  {
    id: '2',
    userId: '4',
    businessName: {
      en: 'Arabian Glow Spa',
      ar: 'سبا التوهج العربي',
    },
    description: {
      en: 'Traditional and modern spa treatments with a Middle Eastern touch. Specializing in hammam, facials, and massage therapy.',
      ar: 'علاجات السبا التقليدية والحديثة بلمسة شرق أوسطية. متخصصون في الحمام والعناية بالوجه والعلاج بالتدليك.',
    },
    category: ['spa', 'massage', 'facial', 'hammam'],
    address: {
      street: '45 Wellness Avenue',
      city: 'Dubai',
      state: 'Dubai',
      postalCode: '12345',
      country: 'UAE',
      coordinates: {
        lat: 25.2048,
        lng: 55.2708,
      },
    },
    workingHours: {
      '0': { // Sunday
        isOpen: true,
        slots: [
          { start: '10:00', end: '20:00' },
        ],
      },
      '1': { // Monday
        isOpen: true,
        slots: [
          { start: '10:00', end: '20:00' },
        ],
      },
      '2': { // Tuesday
        isOpen: true,
        slots: [
          { start: '10:00', end: '20:00' },
        ],
      },
      '3': { // Wednesday
        isOpen: true,
        slots: [
          { start: '10:00', end: '20:00' },
        ],
      },
      '4': { // Thursday
        isOpen: true,
        slots: [
          { start: '10:00', end: '20:00' },
        ],
      },
      '5': { // Friday
        isOpen: true,
        slots: [
          { start: '14:00', end: '22:00' },
        ],
      },
      '6': { isOpen: false, slots: [] }, // Saturday
    },
    rating: 4.9,
    reviewCount: 89,
    services: ['5', '6', '7', '8'],
    gallery: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874',
      'https://images.unsplash.com/photo-1519823551278-64ac92734fb1',
      'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
    ],
    verified: true,
    featured: true,
  },
  {
    id: '3',
    userId: '5',
    businessName: {
      en: 'Modern Cuts Barbershop',
      ar: 'صالون الحلاقة العصري',
    },
    description: {
      en: 'Premium barbershop offering haircuts, beard trims, shaves, and hair styling for men.',
      ar: 'صالون حلاقة متميز يقدم قصات الشعر وتشذيب اللحية والحلاقة وتصفيف الشعر للرجال.',
    },
    category: ['haircut', 'barber', 'shave', 'men'],
    address: {
      street: '78 Main Street',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'USA',
      coordinates: {
        lat: 34.0522,
        lng: -118.2437,
      },
    },
    workingHours: {
      '0': { isOpen: false, slots: [] }, // Sunday
      '1': { // Monday
        isOpen: true,
        slots: [
          { start: '10:00', end: '19:00' },
        ],
      },
      '2': { // Tuesday
        isOpen: true,
        slots: [
          { start: '10:00', end: '19:00' },
        ],
      },
      '3': { // Wednesday
        isOpen: true,
        slots: [
          { start: '10:00', end: '19:00' },
        ],
      },
      '4': { // Thursday
        isOpen: true,
        slots: [
          { start: '10:00', end: '19:00' },
        ],
      },
      '5': { // Friday
        isOpen: true,
        slots: [
          { start: '10:00', end: '19:00' },
        ],
      },
      '6': { // Saturday
        isOpen: true,
        slots: [
          { start: '09:00', end: '17:00' },
        ],
      },
    },
    rating: 4.7,
    reviewCount: 56,
    services: ['9', '10', '11', '12'],
    gallery: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a',
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f',
    ],
    verified: true,
    featured: false,
  },
];

const mockServices: Service[] = [
  // Elegant Beauty Salon services
  {
    id: '1',
    providerId: '1',
    name: {
      en: 'Haircut & Styling',
      ar: 'قص وتصفيف الشعر',
    },
    description: {
      en: 'Professional haircut and styling service tailored to your preferences.',
      ar: 'خدمة قص وتصفيف الشعر الاحترافية مصممة وفقًا لتفضيلاتك.',
    },
    price: 75,
    currency: 'USD',
    duration: 60,
    category: 'hair',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df',
    available: true,
  },
  {
    id: '2',
    providerId: '1',
    name: {
      en: 'Full Makeup Application',
      ar: 'تطبيق المكياج الكامل',
    },
    description: {
      en: 'Complete makeup service for special occasions or everyday glamour.',
      ar: 'خدمة مكياج كاملة للمناسبات الخاصة أو الإطلالة اليومية الجذابة.',
    },
    price: 90,
    currency: 'USD',
    duration: 75,
    category: 'makeup',
    image: 'https://images.unsplash.com/photo-1487412912498-0447579c8d4d',
    available: true,
  },
  {
    id: '3',
    providerId: '1',
    name: {
      en: 'Manicure & Pedicure',
      ar: 'مانيكير وباديكير',
    },
    description: {
      en: 'Complete nail care service for hands and feet with polish application.',
      ar: 'خدمة العناية الكاملة بالأظافر لليدين والقدمين مع وضع طلاء الأظافر.',
    },
    price: 65,
    currency: 'USD',
    duration: 90,
    category: 'nails',
    image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b',
    available: true,
  },
  {
    id: '4',
    providerId: '1',
    name: {
      en: 'Facial Treatment',
      ar: 'علاج الوجه',
    },
    description: {
      en: 'Rejuvenating facial treatment customized for your skin type.',
      ar: 'علاج منعش للوجه مخصص لنوع بشرتك.',
    },
    price: 120,
    currency: 'USD',
    duration: 60,
    category: 'skincare',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881',
    available: true,
  },
  
  // Arabian Glow Spa services
  {
    id: '5',
    providerId: '2',
    name: {
      en: 'Traditional Hammam',
      ar: 'الحمام التقليدي',
    },
    description: {
      en: 'Traditional Middle Eastern bath experience with steam and exfoliation.',
      ar: 'تجربة الحمام الشرق أوسطي التقليدي مع البخار والتقشير.',
    },
    price: 150,
    currency: 'AED',
    duration: 90,
    category: 'hammam',
    image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1',
    available: true,
  },
  {
    id: '6',
    providerId: '2',
    name: {
      en: 'Aromatherapy Massage',
      ar: 'مساج بالزيوت العطرية',
    },
    description: {
      en: 'Relaxing full-body massage with essential oils to reduce stress and tension.',
      ar: 'مساج مريح للجسم كامل بالزيوت الأساسية لتقليل التوتر والإجهاد.',
    },
    price: 280,
    currency: 'AED',
    duration: 60,
    category: 'massage',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874',
    available: true,
  },
  {
    id: '7',
    providerId: '2',
    name: {
      en: 'Gold Facial',
      ar: 'فيشل الذهب',
    },
    description: {
      en: 'Luxury facial treatment using 24k gold leaf to rejuvenate and brighten skin.',
      ar: 'علاج فاخر للوجه باستخدام رقائق الذهب عيار 24 قيراط لتجديد وتفتيح البشرة.',
    },
    price: 350,
    currency: 'AED',
    duration: 75,
    category: 'facial',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
    available: true,
  },
  {
    id: '8',
    providerId: '2',
    name: {
      en: 'Body Scrub & Wrap',
      ar: 'تقشير ولف الجسم',
    },
    description: {
      en: 'Full body exfoliation followed by a nourishing wrap to hydrate and rejuvenate skin.',
      ar: 'تقشير كامل للجسم يليه لف مغذي لترطيب وتجديد البشرة.',
    },
    price: 320,
    currency: 'AED',
    duration: 120,
    category: 'spa',
    image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2',
    available: true,
  },
  
  // Modern Cuts Barbershop services
  {
    id: '9',
    providerId: '3',
    name: {
      en: 'Classic Haircut',
      ar: 'قصة شعر كلاسيكية',
    },
    description: {
      en: 'Traditional men\'s haircut with clippers and scissors.',
      ar: 'قصة شعر تقليدية للرجال باستخدام المقصات وماكينة الحلاقة.',
    },
    price: 35,
    currency: 'USD',
    duration: 30,
    category: 'haircut',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1',
    available: true,
  },
  {
    id: '10',
    providerId: '3',
    name: {
      en: 'Beard Trim & Shape',
      ar: 'تشذيب وتشكيل اللحية',
    },
    description: {
      en: 'Professional beard grooming service to keep your facial hair looking its best.',
      ar: 'خدمة احترافية للعناية باللحية للحفاظ على مظهر شعر الوجه في أفضل حالاته.',
    },
    price: 25,
    currency: 'USD',
    duration: 20,
    category: 'barber',
    image: 'https://images.unsplash.com/photo-1521117184285-c804ebd84d67',
    available: true,
  },
  {
    id: '11',
    providerId: '3',
    name: {
      en: 'Hot Towel Shave',
      ar: 'حلاقة بالمنشفة الساخنة',
    },
    description: {
      en: 'Traditional straight razor shave with hot towel preparation for the ultimate smooth finish.',
      ar: 'حلاقة تقليدية بالموس المستقيم مع تحضير المنشفة الساخنة للحصول على نعومة فائقة.',
    },
    price: 45,
    currency: 'USD',
    duration: 45,
    category: 'shave',
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a',
    available: true,
  },
  {
    id: '12',
    providerId: '3',
    name: {
      en: 'Haircut & Beard Combo',
      ar: 'قصة شعر وتشذيب لحية',
    },
    description: {
      en: 'Complete grooming package including haircut and beard trim.',
      ar: 'باقة عناية كاملة تشمل قص الشعر وتشذيب اللحية.',
    },
    price: 55,
    currency: 'USD',
    duration: 60,
    category: 'men',
    image: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d',
    available: true,
  },
];

// Generate some bookings
const today = new Date();
const yesterday = subDays(today, 1);
const tomorrow = addDays(today, 1);
const nextWeek = addDays(today, 7);

const mockBookings: Booking[] = [
  {
    id: '1',
    customerId: '1',
    providerId: '1',
    serviceId: '1',
    date: format(yesterday, 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '11:00',
    status: 'completed',
    totalPrice: 75,
    currency: 'USD',
    notes: 'First time customer',
    createdAt: subDays(yesterday, 2).toISOString(),
    updatedAt: yesterday.toISOString(),
  },
  {
    id: '2',
    customerId: '1',
    providerId: '2',
    serviceId: '6',
    date: format(tomorrow, 'yyyy-MM-dd'),
    startTime: '14:00',
    endTime: '15:00',
    status: 'confirmed',
    totalPrice: 280,
    currency: 'AED',
    createdAt: subDays(today, 1).toISOString(),
    updatedAt: subDays(today, 1).toISOString(),
  },
  {
    id: '3',
    customerId: '3',
    providerId: '2',
    serviceId: '5',
    date: format(nextWeek, 'yyyy-MM-dd'),
    startTime: '16:00',
    endTime: '17:30',
    status: 'confirmed',
    totalPrice: 150,
    currency: 'AED',
    notes: 'First hammam experience',
    createdAt: subDays(today, 3).toISOString(),
    updatedAt: subDays(today, 3).toISOString(),
  },
  {
    id: '4',
    customerId: '3',
    providerId: '3',
    serviceId: '12',
    date: format(yesterday, 'yyyy-MM-dd'),
    startTime: '11:00',
    endTime: '12:00',
    status: 'completed',
    totalPrice: 55,
    currency: 'USD',
    createdAt: subDays(yesterday, 5).toISOString(),
    updatedAt: yesterday.toISOString(),
  },
  {
    id: '5',
    customerId: '1',
    providerId: '1',
    serviceId: '2',
    date: format(addDays(today, 3), 'yyyy-MM-dd'),
    startTime: '15:00',
    endTime: '16:15',
    status: 'pending',
    totalPrice: 90,
    currency: 'USD',
    notes: 'Special occasion makeup',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
];

const mockReviews: Review[] = [
  {
    id: '1',
    bookingId: '1',
    customerId: '1',
    providerId: '1',
    serviceId: '1',
    rating: 5,
    comment: 'Amazing haircut! Exactly what I wanted and the stylist was very professional.',
    createdAt: yesterday.toISOString(),
    updatedAt: yesterday.toISOString(),
  },
  {
    id: '2',
    bookingId: '4',
    customerId: '3',
    providerId: '3',
    serviceId: '12',
    rating: 4,
    comment: 'خدمة جيدة جدًا، ولكن كان هناك انتظار طويل قليلاً.',
    createdAt: yesterday.toISOString(),
    updatedAt: yesterday.toISOString(),
  },
];

// Generate available time slots based on provider working hours
const generateAvailableSlots = (providerId: string, date: string) => {
  const provider = mockProviders.find(p => p.id === providerId);
  if (!provider) return [];
  
  const dateObj = parseISO(date);
  const dayOfWeek = dateObj.getDay().toString();
  
  // Check if provider works on this day
  if (!provider.workingHours[dayOfWeek]?.isOpen) {
    return [];
  }
  
  const workingHours = provider.workingHours[dayOfWeek];
  const slots: { start: string; end: string }[] = [];
  
  // For each working period in the day
  workingHours.slots.forEach(period => {
    const [startHour, startMinute] = period.start.split(':').map(Number);
    const [endHour, endMinute] = period.end.split(':').map(Number);
    
    // Generate 30-minute slots
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Increment by 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute -= 60;
      }
      
      // Only add slot if it ends before or at the working period end
      if (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
        const endTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        slots.push({ start: startTime, end: endTime });
      }
    }
  });
  
  // Filter out slots that are already booked
  const bookedSlots = mockBookings.filter(
    booking => booking.providerId === providerId && 
               booking.date === date && 
               (booking.status === 'confirmed' || booking.status === 'pending')
  );
  
  return slots.filter(slot => {
    return !bookedSlots.some(booking => {
      return booking.startTime <= slot.start && booking.endTime > slot.start ||
             booking.startTime < slot.end && booking.endTime >= slot.end ||
             booking.startTime >= slot.start && booking.endTime <= slot.end;
    });
  });
};

// Helper function to generate JWT token (simplified for mock)
const generateToken = (user: User) => {
  return `mock-jwt-token-${user.id}-${user.role}-${Date.now()}`;
};

// Helper function to find user by credentials
const findUserByCredentials = (email: string, password: string) => {
  return mockUsers.find(user => user.email === email && user.password === password);
};

// API Handlers
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    await delay();
    const { email, password } = await request.json();
    
    const user = findUserByCredentials(email, password);
    if (!user) {
      return HttpResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const { password: _, ...userWithoutPassword } = user;
    return HttpResponse.json({
      user: userWithoutPassword,
      token: generateToken(user),
    });
  }),
  
  http.post('/api/auth/register', async ({ request }) => {
    await delay();
    const data = await request.json();
    
    // Check if email already exists
    const existingUser = mockUsers.find(user => user.email === data.email);
    if (existingUser) {
      return HttpResponse.json(
        { message: 'Email already in use' },
        { status: 400 }
      );
    }
    
    // Create new user
    const newUser: User = {
      id: `${mockUsers.length + 1}`,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || '',
      role: data.role || 'customer',
      createdAt: new Date().toISOString(),
      language: data.language || 'en',
      favorites: [],
    };
    
    mockUsers.push(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    return HttpResponse.json({
      user: userWithoutPassword,
      token: generateToken(newUser),
    }, { status: 201 });
  }),
  
  http.post('/api/auth/verify-otp', async ({ request }) => {
    await delay();
    const { email, otp } = await request.json();
    
    // In a real app, we would validate the OTP
    // For mock purposes, we'll accept any 6-digit OTP
    if (!/^\d{6}$/.test(otp)) {
      return HttpResponse.json(
        { message: 'Invalid OTP' },
        { status: 400 }
      );
    }
    
    const user = mockUsers.find(user => user.email === email);
    if (!user) {
      return HttpResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ verified: true });
  }),
  
  http.post('/api/auth/forgot-password', async ({ request }) => {
    await delay();
    const { email } = await request.json();
    
    const user = mockUsers.find(user => user.email === email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return HttpResponse.json({ 
        message: 'If your email is registered, you will receive a reset link' 
      });
    }
    
    return HttpResponse.json({ 
      message: 'If your email is registered, you will receive a reset link' 
    });
  }),
  
  // Provider endpoints
  http.get('/api/providers', async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const featured = url.searchParams.get('featured') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    
    let filteredProviders = [...mockProviders];
    
    if (category) {
      filteredProviders = filteredProviders.filter(provider => 
        provider.category.includes(category)
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProviders = filteredProviders.filter(provider => 
        provider.businessName.en.toLowerCase().includes(searchLower) ||
        provider.businessName.ar.includes(search) ||
        provider.description.en.toLowerCase().includes(searchLower) ||
        provider.description.ar.includes(search)
      );
    }
    
    if (featured) {
      filteredProviders = filteredProviders.filter(provider => provider.featured);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProviders = filteredProviders.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      providers: paginatedProviders,
      total: filteredProviders.length,
      page,
      limit,
      totalPages: Math.ceil(filteredProviders.length / limit),
    });
  }),
  
  http.get('/api/providers/:id', async ({ params }) => {
    await delay();
    const { id } = params;
    const provider = mockProviders.find(p => p.id === id);
    
    if (!provider) {
      return HttpResponse.json(
        { message: 'Provider not found' },
        { status: 404 }
      );
    }
    
    // Get provider services
    const services = mockServices.filter(service => service.providerId === id);
    
    // Get provider reviews
    const reviews = mockReviews.filter(review => review.providerId === id);
    
    return HttpResponse.json({
      provider,
      services,
      reviews,
    });
  }),
  
  // Service endpoints
  http.get('/api/services', async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const providerId = url.searchParams.get('providerId');
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    
    let filteredServices = [...mockServices];
    
    if (providerId) {
      filteredServices = filteredServices.filter(service => service.providerId === providerId);
    }
    
    if (category) {
      filteredServices = filteredServices.filter(service => service.category === category);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredServices = filteredServices.filter(service => 
        service.name.en.toLowerCase().includes(searchLower) ||
        service.name.ar.includes(search) ||
        service.description.en.toLowerCase().includes(searchLower) ||
        service.description.ar.includes(search)
      );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedServices = filteredServices.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      services: paginatedServices,
      total: filteredServices.length,
      page,
      limit,
      totalPages: Math.ceil(filteredServices.length / limit),
    });
  }),
  
  http.get('/api/services/:id', async ({ params }) => {
    await delay();
    const { id } = params;
    const service = mockServices.find(s => s.id === id);
    
    if (!service) {
      return HttpResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Get provider info
    const provider = mockProviders.find(p => p.id === service.providerId);
    
    return HttpResponse.json({
      service,
      provider,
    });
  }),
  
  // Booking endpoints
  http.get('/api/bookings', async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const customerId = url.searchParams.get('customerId');
    const providerId = url.searchParams.get('providerId');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    
    let filteredBookings = [...mockBookings];
    
    if (customerId) {
      filteredBookings = filteredBookings.filter(booking => booking.customerId === customerId);
    }
    
    if (providerId) {
      filteredBookings = filteredBookings.filter(booking => booking.providerId === providerId);
    }
    
    if (status) {
      filteredBookings = filteredBookings.filter(booking => booking.status === status);
    }
    
    // Sort by date, most recent first
    filteredBookings.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
    
    // Enrich with service and provider details
    const enrichedBookings = paginatedBookings.map(booking => {
      const service = mockServices.find(s => s.id === booking.serviceId);
      const provider = mockProviders.find(p => p.id === booking.providerId);
      
      return {
        ...booking,
        service,
        provider,
      };
    });
    
    return HttpResponse.json({
      bookings: enrichedBookings,
      total: filteredBookings.length,
      page,
      limit,
      totalPages: Math.ceil(filteredBookings.length / limit),
    });
  }),
  
  http.get('/api/bookings/:id', async ({ params }) => {
    await delay();
    const { id } = params;
    const booking = mockBookings.find(b => b.id === id);
    
    if (!booking) {
      return HttpResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Get related data
    const service = mockServices.find(s => s.id === booking.serviceId);
    const provider = mockProviders.find(p => p.id === booking.providerId);
    const customer = mockUsers.find(u => u.id === booking.customerId);
    
    // Remove sensitive customer data
    const { password: _, ...customerWithoutPassword } = customer || {};
    
    return HttpResponse.json({
      booking,
      service,
      provider,
      customer: customerWithoutPassword,
    });
  }),
  
  http.post('/api/bookings', async ({ request }) => {
    await delay();
    const data = await request.json();
    
    // Validate required fields
    if (!data.customerId || !data.providerId || !data.serviceId || !data.date || !data.startTime) {
      return HttpResponse.json(
        { message: 'Missing required booking information' },
        { status: 400 }
      );
    }
    
    // Check if service exists
    const service = mockServices.find(s => s.id === data.serviceId);
    if (!service) {
      return HttpResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Calculate end time based on service duration
    const [hours, minutes] = data.startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0);
    const endDate = new Date(startDate.getTime() + service.duration * 60000);
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    
    // Check if slot is available
    const availableSlots = generateAvailableSlots(data.providerId, data.date);
    const isSlotAvailable = availableSlots.some(slot => slot.start === data.startTime);
    
    if (!isSlotAvailable) {
      return HttpResponse.json(
        { message: 'Selected time slot is not available' },
        { status: 400 }
      );
    }
    
    // Create new booking
    const newBooking: Booking = {
      id: `${mockBookings.length + 1}`,
      customerId: data.customerId,
      providerId: data.providerId,
      serviceId: data.serviceId,
      date: data.date,
      startTime: data.startTime,
      endTime,
      status: 'pending',
      totalPrice: service.price,
      currency: service.currency,
      notes: data.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockBookings.push(newBooking);
    
    return HttpResponse.json({
      booking: newBooking,
      service,
    }, { status: 201 });
  }),
  
  http.put('/api/bookings/:id', async ({ request, params }) => {
    await delay();
    const { id } = params;
    const data = await request.json();
    
    const bookingIndex = mockBookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) {
      return HttpResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Update booking
    mockBookings[bookingIndex] = {
      ...mockBookings[bookingIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      booking: mockBookings[bookingIndex],
    });
  }),
  
  http.delete('/api/bookings/:id', async ({ params }) => {
    await delay();
    const { id } = params;
    
    const bookingIndex = mockBookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) {
      return HttpResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Instead of deleting, update status to cancelled
    mockBookings[bookingIndex].status = 'cancelled';
    mockBookings[bookingIndex].updatedAt = new Date().toISOString();
    
    return HttpResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  }),
  
  // Availability endpoints
  http.get('/api/availability', async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const providerId = url.searchParams.get('providerId');
    const date = url.searchParams.get('date');
    
    if (!providerId || !date) {
      return HttpResponse.json(
        { message: 'Provider ID and date are required' },
        { status: 400 }
      );
    }
    
    const availableSlots = generateAvailableSlots(providerId, date);
    
    return HttpResponse.json({
      providerId,
      date,
      availableSlots,
    });
  }),
  
  // Review endpoints
  http.get('/api/reviews', async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const providerId = url.searchParams.get('providerId');
    const customerId = url.searchParams.get('customerId');
    const serviceId = url.searchParams.get('serviceId');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    
    let filteredReviews = [...mockReviews];
    
    if (providerId) {
      filteredReviews = filteredReviews.filter(review => review.providerId === providerId);
    }
    
    if (customerId) {
      filteredReviews = filteredReviews.filter(review => review.customerId === customerId);
    }
    
    if (serviceId) {
      filteredReviews = filteredReviews.filter(review => review.serviceId === serviceId);
    }
    
    // Sort by date, most recent first
    filteredReviews.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReviews = filteredReviews.slice(startIndex, endIndex);
    
    // Enrich with customer and service details
    const enrichedReviews = paginatedReviews.map(review => {
      const customer = mockUsers.find(u => u.id === review.customerId);
      const service = mockServices.find(s => s.id === review.serviceId);
      
      // Remove sensitive customer data
      const { password: _, ...customerWithoutPassword } = customer || {};
      
      return {
        ...review,
        customer: customerWithoutPassword,
        service,
      };
    });
    
    return HttpResponse.json({
      reviews: enrichedReviews,
      total: filteredReviews.length,
      page,
      limit,
      totalPages: Math.ceil(filteredReviews.length / limit),
    });
  }),
  
  http.post('/api/reviews', async ({ request }) => {
    await delay();
    const data = await request.json();
    
    // Validate required fields
    if (!data.bookingId || !data.customerId || !data.providerId || !data.serviceId || !data.rating) {
      return HttpResponse.json(
        { message: 'Missing required review information' },
        { status: 400 }
      );
    }
    
    // Check if booking exists and is completed
    const booking = mockBookings.find(b => b.id === data.bookingId);
    if (!booking) {
      return HttpResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }
    
    if (booking.status !== 'completed') {
      return HttpResponse.json(
        { message: 'Can only review completed bookings' },
        { status: 400 }
      );
    }
    
    // Check if review already exists for this booking
    const existingReview = mockReviews.find(r => r.bookingId === data.bookingId);
    if (existingReview) {
      return HttpResponse.json(
        { message: 'Review already exists for this booking' },
        { status: 400 }
      );
    }
    
    // Create new review
    const newReview: Review = {
      id: `${mockReviews.length + 1}`,
      bookingId: data.bookingId,
      customerId: data.customerId,
      providerId: data.providerId,
      serviceId: data.serviceId,
      rating: data.rating,
      comment: data.comment || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockReviews.push(newReview);
    
    // Update provider rating
    const providerReviews = mockReviews.filter(r => r.providerId === data.providerId);
    const providerIndex = mockProviders.findIndex(p => p.id === data.providerId);
    
    if (providerIndex !== -1) {
      const totalRating = providerReviews.reduce((sum, review) => sum + review.rating, 0);
      mockProviders[providerIndex].rating = totalRating / providerReviews.length;
      mockProviders[providerIndex].reviewCount = providerReviews.length;
    }
    
    return HttpResponse.json({
      review: newReview,
    }, { status: 201 });
  }),
  
  http.put('/api/reviews/:id', async ({ request, params }) => {
    await delay();
    const { id } = params;
    const data = await request.json();
    
    const reviewIndex = mockReviews.findIndex(r => r.id === id);
    if (reviewIndex === -1) {
      return HttpResponse.json(
        { message: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Update review
    mockReviews[reviewIndex] = {
      ...mockReviews[reviewIndex],
      rating: data.rating || mockReviews[reviewIndex].rating,
      comment: data.comment || mockReviews[reviewIndex].comment,
      updatedAt: new Date().toISOString(),
    };
    
    // Update provider rating
    const providerId = mockReviews[reviewIndex].providerId;
    const providerReviews = mockReviews.filter(r => r.providerId === providerId);
    const providerIndex = mockProviders.findIndex(p => p.id === providerId);
    
    if (providerIndex !== -1) {
      const totalRating = providerReviews.reduce((sum, review) => sum + review.rating, 0);
      mockProviders[providerIndex].rating = totalRating / providerReviews.length;
    }
    
    return HttpResponse.json({
      review: mockReviews[reviewIndex],
    });
  }),
  
  http.delete('/api/reviews/:id', async ({ params }) => {
    await delay();
    const { id } = params;
    
    const reviewIndex = mockReviews.findIndex(r => r.id === id);
    if (reviewIndex === -1) {
      return HttpResponse.json(
        { message: 'Review not found' },
        { status: 404 }
      );
    }
    
    const providerId = mockReviews[reviewIndex].providerId;
    
    // Remove review
    mockReviews.splice(reviewIndex, 1);
    
    // Update provider rating
    const providerReviews = mockReviews.filter(r => r.providerId === providerId);
    const providerIndex = mockProviders.findIndex(p => p.id === providerId);
    
    if (providerIndex !== -1) {
      if (providerReviews.length > 0) {
        const totalRating = providerReviews.reduce((sum, review) => sum + review.rating, 0);
        mockProviders[providerIndex].rating = totalRating / providerReviews.length;
      }
      mockProviders[providerIndex].reviewCount = providerReviews.length;
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  }),
  
  // User profile endpoints
  http.get('/api/users/:id', async ({ params }) => {
    await delay();
    const { id } = params;
    const user = mockUsers.find(u => u.id === id);
    
    if (!user) {
      return HttpResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    // Get additional data based on user role
    if (user.role === 'provider') {
      const provider = mockProviders.find(p => p.userId === id);
      return HttpResponse.json({
        user: userWithoutPassword,
        provider,
      });
    }
    
    return HttpResponse.json({
      user: userWithoutPassword,
    });
  }),
  
  http.put('/api/users/:id', async ({ request, params }) => {
    await delay();
    const { id } = params;
    const data = await request.json();
    
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return HttpResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...data,
      // Don't update these fields from direct request
      id: mockUsers[userIndex].id,
      email: data.email || mockUsers[userIndex].email,
      password: mockUsers[userIndex].password,
      role: mockUsers[userIndex].role,
      createdAt: mockUsers[userIndex].createdAt,
    };
    
    const { password: _, ...userWithoutPassword } = mockUsers[userIndex];
    
    return HttpResponse.json({
      user: userWithoutPassword,
    });
  }),
  
  // Favorites endpoints
  http.get('/api/users/:id/favorites', async ({ params }) => {
    await delay();
    const { id } = params;
    const user = mockUsers.find(u => u.id === id);
    
    if (!user) {
      return HttpResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get favorite providers
    const favoriteProviders = mockProviders.filter(
      provider => user.favorites.includes(provider.id)
    );
    
    return HttpResponse.json({
      favorites: favoriteProviders,
    });
  }),
  
  http.post('/api/users/:id/favorites', async ({ request, params }) => {
    await delay();
    const { id } = params;
    const { providerId } = await request.json();
    
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return HttpResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if provider exists
    const provider = mockProviders.find(p => p.id === providerId);
    if (!provider) {
      return HttpResponse.json(
        { message: 'Provider not found' },
        { status: 404 }
      );
    }
    
    // Add to favorites if not already there
    if (!mockUsers[userIndex].favorites.includes(providerId)) {
      mockUsers[userIndex].favorites.push(providerId);
    }
    
    return HttpResponse.json({
      success: true,
      favorites: mockUsers[userIndex].favorites,
    });
  }),
  
  http.delete('/api/users/:userId/favorites/:providerId', async ({ params }) => {
    await delay();
    const { userId, providerId } = params;
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return HttpResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove from favorites
    mockUsers[userIndex].favorites = mockUsers[userIndex].favorites.filter(
      id => id !== providerId
    );
    
    return HttpResponse.json({
      success: true,
      favorites: mockUsers[userIndex].favorites,
    });
  }),
  
  // Categories endpoint
  http.get('/api/categories', async () => {
    await delay();
    
    // Extract unique categories from services
    const serviceCategories = [...new Set(mockServices.map(service => service.category))];
    
    // Extract unique categories from providers
    const providerCategories = mockProviders.flatMap(provider => provider.category);
    const uniqueProviderCategories = [...new Set(providerCategories)];
    
    // Combine and deduplicate
    const allCategories = [...new Set([...serviceCategories, ...uniqueProviderCategories])];
    
    // Format for both languages
    const formattedCategories = allCategories.map(category => ({
      id: category,
      name: {
        en: category.charAt(0).toUpperCase() + category.slice(1),
        ar: translateCategoryToArabic(category),
      },
    }));
    
    return HttpResponse.json({
      categories: formattedCategories,
    });
  }),
];

// Helper function to translate categories to Arabic
function translateCategoryToArabic(category: string): string {
  const translations: Record<string, string> = {
    hair: 'شعر',
    makeup: 'مكياج',
    nails: 'أظافر',
    skincare: 'عناية بالبشرة',
    spa: 'سبا',
    massage: 'مساج',
    facial: 'عناية بالوجه',
    hammam: 'حمام',
    haircut: 'قص شعر',
    barber: 'حلاقة',
    shave: 'حلاقة',
    men: 'رجال',
  };
  
  return translations[category] || category;
}
