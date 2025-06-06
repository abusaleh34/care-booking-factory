# BeautyBook – Beauty & Wellness Booking Platform

BeautyBook is a full-featured, bilingual (Arabic / English) web application that connects customers with beauty & wellness service providers.  
The goal is to offer a seamless booking experience through a modern, responsive UI and a clean, scalable code-base.

---

## ✨ Core Features

| Phase | Highlights | Status |
|-------|------------|--------|
| 1 – Foundation | Next.js 14 + TypeScript, Tailwind CSS (RTL/LTR), shadcn/ui, folder structure, routing, i18n scaffold | ✅ Completed |
| 2 – Authentication | Email + password login/register, OTP flow (mocked), social login placeholders, protected route/HOC, AuthContext | ✅ Completed |
| 3 – Customer Portal | Home with hero & categories, provider search (filters, pagination), profile page skeleton, booking flow UI, reviews | ⏳ In progress |
| 4 – Provider Portal | Dashboard shell, service CRUD, calendar view, earnings, chat placeholder | ⏳ Planned |
| 5 – UX / Responsive | Mobile-first, skeletons, transitions, full RTL support, accessibility audit | ⏳ Planned |
| 6 – Enhancements | Wishlist, notifications, settings, map integration | ⏳ Planned |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS v3 + `tailwindcss-animate`
- **Component Library**: [shadcn/ui](https://ui.shadcn.com)
- **State & Data**: React Context, Zustand (local), React Query (remote)
- **API Mocking**: Mock Service Worker (MSW)
- **i18n**: `i18next`, `react-i18next`, `next-i18next`
- **Icons**: Lucide
- **Testing** *(planned)*: Vitest + React Testing Library
- **Lint / Format**: ESLint, Prettier

---

## 🗂️ Project Structure (abridged)

```
.
├─ app/                  # Next .js “app” router
│  ├─ (auth)/            # Public auth pages (login, register …)
│  ├─ (customer)/        # Customer-only routes
│  ├─ provider/          # Service-provider dashboard
│  └─ layout.tsx         # Root layout + Providers wrapper
├─ components/
│  ├─ ui/                # shadcn/ui components (button, card …)
│  ├─ customer/          # Customer-specific composite components
│  └─ provider/          # Provider-specific composite components
├─ hooks/                # Custom React hooks
├─ contexts/             # React Context providers
├─ lib/                  # Utilities (e.g. `lib/utils.ts`)
├─ services/             # API abstraction (wrapped around fetch/MSW)
├─ mocks/                # MSW handlers & worker initialiser
├─ public/locales/       # i18n JSON translations (en, ar)
└─ tailwind.config.ts
```

---

## ⚡ Setup & Installation

1. **Clone**  
   `git clone https://github.com/<your-org>/beautybook.git`

2. **Install deps**  
   `npm install`

3. **Start dev server** (with MSW auto-started)  
   `npm run dev`  
   App will be available at `http://localhost:3000`.

---

## 📜 NPM Scripts

| Command               | Description                                  |
|-----------------------|----------------------------------------------|
| `npm run dev`         | Next.js dev server (Turbopack) + MSW worker  |
| `npm run build`       | Production build                             |
| `npm run start`       | Start compiled production server             |
| `npm run lint`        | ESLint check                                 |
| `npm run format`      | Prettier write                               |
| `npm run test`*       | Unit tests *(coming in Phase 5)*             |

---

## 🔗 Mock API Endpoints (MSW)

### Auth
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/verify-otp
POST /api/auth/forgot-password
```

### Providers & Services
```
GET  /api/providers            ?page &limit &search &category &featured
GET  /api/providers/:id
GET  /api/services             ?providerId &category &search
GET  /api/services/:id
GET  /api/categories
```

### Bookings
```
GET  /api/bookings             ?customerId &providerId &status
GET  /api/bookings/:id
POST /api/bookings
PUT  /api/bookings/:id
DELETE /api/bookings/:id       (soft-cancel)
```

### Reviews
```
GET  /api/reviews              ?providerId &customerId &serviceId
POST /api/reviews
PUT  /api/reviews/:id
DELETE /api/reviews/:id
```

### Users & Favorites
```
GET    /api/users/:id
PUT    /api/users/:id
GET    /api/users/:id/favorites
POST   /api/users/:id/favorites          { providerId }
DELETE /api/users/:userId/favorites/:providerId
```

*(See `mocks/handlers.ts` for full schema & mock data.)*

---

## 🌐 Internationalisation (i18n)

| Aspect            | Details |
|-------------------|---------|
| Supported langs   | `en` (LTR), `ar` (RTL) |
| Detection order   | Path → Cookie → Browser |
| Directory         | `public/locales/<lng>/<ns>.json` |
| Namespaces        | `common`, `auth`, `customer`, `provider`, `booking`, `services`, `reviews`, `profile` |
| RTL handling      | `document.dir` is toggled automatically in `app/providers.tsx` |

---

## 🤝 Contributing

1. **Fork the repo** & create your branch:  
   `git checkout -b feature/my-awesome-feature`
2. **Commit** with conventional commits `feat:`, `fix:` …  
   `git commit -am "feat: add calendar view"`
3. **Push** the branch and create a Pull Request.  
4. PRs must pass **linting** and, once available, **unit tests**.  
5. For UI components, add stories in future Storybook setup *(Phase 5)*.  
6. Be nice, write docs, and keep components accessible & RTL-ready. 🎉

---

## 📄 License

MIT © 2025 BeautyBook Team
