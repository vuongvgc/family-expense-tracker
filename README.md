# Family Expense Tracker

A family-centric expense tracking application built with Next.js 15, Prisma, and Auth.js.

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: Vercel Postgres
- **ORM**: Prisma
- **Authentication**: Auth.js v5 (Credentials Provider)
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Validation**: Zod + React Hook Form

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: Your Vercel Postgres connection string
- `AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `AUTH_URL`: Your app URL (http://localhost:3000 for development)

### 3. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📋 Key Features

### Family-Centric Architecture

- Users belong to **ONE** `FamilyGroup`
- All family members see **ALL** transactions in their family
- Each transaction tracks **who created it** for accountability

### Registration Flow

Users can either:
1. **Create New Family**: Become the Admin with a unique invite code
2. **Join Existing Family**: Use an invite code to join as a Member

### Authentication

- Email/Password authentication via Auth.js
- Session includes `familyGroupId` and `role` for efficient queries
- Protected routes via middleware

## 🗄️ Database Schema

### Models

- **FamilyGroup**: Contains `name` and unique `inviteCode`
- **User**: Linked to one `FamilyGroup`, has `role` (ADMIN/MEMBER)
- **Transaction**: Belongs to `FamilyGroup`, created by `User`

## 📁 Project Structure

```
├── app/
│   ├── api/auth/
│   │   ├── register/route.ts    # Registration API
│   │   └── [...nextauth]/route.ts
│   ├── dashboard/page.tsx       # Main dashboard
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx
├── components/ui/               # shadcn/ui components
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   └── utils.ts
├── prisma/
│   └── schema.prisma           # Database schema
├── auth.ts                     # Auth.js configuration
└── middleware.ts               # Route protection
```

## 🔐 Authentication Flow

1. User registers via `/register` (creates/joins family)
2. User logs in via `/login`
3. Session stores: `id`, `familyGroupId`, `role`
4. All queries filtered by `familyGroupId` from session

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

## 🚧 Next Steps (Implementation Roadmap)

- [ ] Dashboard with family balance summary
- [ ] Transaction list with creator attribution
- [ ] Add/Edit/Delete transaction forms
- [ ] Expense charts by category
- [ ] Family settings (view invite code, manage members)
- [ ] Date range filtering
- [ ] Export to CSV

## 📝 License

MIT

---

Built with ❤️ for families who manage money together
