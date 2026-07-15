# Marketverse

A production-ready multi-vendor e-commerce platform inspired by Shopify.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19 (configurable), TypeScript, Tailwind CSS, Framer Motion, shadcn/ui pattern components
- **Backend:** NestJS 10, TypeScript, Prisma, PostgreSQL, Redis, Stripe, Elasticsearch (optional), OpenAI (optional)
- **DevOps:** Docker, Docker Compose, GitHub Actions

## Quick Start

```bash
cp .env.example .env
# Update .env with your secrets
docker-compose up -d postgres redis elasticsearch
npm install
npm run db:generate -w apps/api
npm run db:migrate -w apps/api
npm run db:seed -w apps/api
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront and [http://localhost:4000/api/v1](http://localhost:4000/api/v1) for the API.

## Architecture

```
marketverse/
├── apps/
│   ├── api/          # NestJS REST API
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared TypeScript types & constants
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Scripts

| Command                    | Description                     |
| -------------------------- | ------------------------------- |
| `npm run dev`              | Start API and web concurrently  |
| `npm run build`            | Build shared, API, and web        |
| `npm run lint`             | Lint API and web                |
| `npm run test`             | Run API unit tests                |
| `npm run db:migrate -w apps/api` | Run Prisma migrations     |
| `npm run db:seed -w apps/api`    | Seed sample data            |

## Features

- JWT + refresh token authentication
- Google & GitHub OAuth (configure credentials)
- Role-based access control (Customer, Vendor, Admin)
- Vendor store onboarding and product management
- Product catalog with categories, filters, search
- Cart, wishlist, coupons, orders, reviews
- Stripe payment intents and webhooks
- Redis caching and real-time notifications
- AI product descriptions and sales insights (OpenAI optional)
- Elasticsearch smart search (optional)
- Docker & CI/CD ready

## License

MIT
