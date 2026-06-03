# SaaS Foundation

A production-minded SaaS starter built with Next.js, TypeScript, Prisma, PostgreSQL, NextAuth, and Stripe.

This project demonstrates the core building blocks of a modern subscription-based SaaS application: authentication, protected workspaces, database-backed user data, billing, webhooks, subscription status handling, rate limiting, automated tests, CI checks, and polished application states.

## Project Purpose

SaaS Foundation was built as a portfolio project to demonstrate practical full-stack product engineering.

The goal is not only to show that the app works, but also to show professional development habits:

- clean feature branches
- focused pull requests
- automated tests
- CI validation
- typed business logic
- safe environment variable handling
- protected server actions
- subscription lifecycle handling
- production-style user experience

## Features

### Authentication

- Custom sign-in and create-account page
- Separate Sign In and Create Account modes
- Credentials-based authentication with NextAuth
- Password hashing with bcrypt
- Protected dashboard route
- Prevents accidental account creation during sign-in

### Workspace Dashboard

- Authenticated user dashboard
- Database-backed workspace notes
- Create and delete notes
- Ownership protection for note deletion
- Empty-state UI for new users
- Free vs Pro note limits

### Billing

- Stripe Checkout subscription flow
- Stripe Customer Portal access
- Stripe webhook route
- Checkout-session sync after successful Stripe redirect
- Subscription created, updated, and deleted event handling
- Cancellation status tracking
- Pro status display on the dashboard

### Abuse Protection

- Database-backed rate limiting
- Rate limits for sign in
- Rate limits for create account
- Rate limits for note creation
- Rate limits for note deletion
- Rate limits for Stripe checkout
- Rate limits for Stripe billing portal access

### User Experience

- Custom loading page
- Dashboard loading state
- Custom error page
- Custom not-found page
- Custom delete confirmation modal
- Toast notifications for user actions

### Engineering Quality

- TypeScript
- Prisma schema validation
- Automated tests with Vitest
- GitHub Actions CI workflow
- Production build checks
- Environment example file
- Server-only Prisma client protection

## Tech Stack

- Next.js
- React
- TypeScript
- Prisma
- PostgreSQL
- NextAuth
- Stripe
- Tailwind CSS
- Vitest
- GitHub Actions
- Vercel-ready architecture

## Scripts

    npm run dev
    npm run build
    npm run start
    npm run lint
    npm test

## Environment Variables

Create a local `.env` file using `.env.example` as a template.

Required variables:

    DATABASE_URL=
    NEXTAUTH_URL=
    NEXTAUTH_SECRET=
    STRIPE_SECRET_KEY=
    STRIPE_WEBHOOK_SECRET=
    STRIPE_PRICE_ID=

Never commit your real `.env` file.

## Run Locally

Install dependencies:

    npm install

Generate Prisma client:

    npx prisma generate

Push schema to the database:

    npx prisma db push

Start the development server:

    npm run dev

Open:

    http://localhost:3000

## Stripe Local Webhook Testing

Start the app:

    npm run dev

In a second terminal, forward Stripe webhook events:

    stripe listen --forward-to localhost:3000/api/webhook/stripe

Copy the generated `whsec_...` value into:

    STRIPE_WEBHOOK_SECRET=

Restart the dev server after changing environment variables.

## Testing

Run automated tests:

    npm test

Run Prisma validation:

    npx prisma validate

Run production build:

    npm run build

## CI

This project includes a GitHub Actions workflow that runs on pull requests and pushes to `master`.

The workflow checks:

- dependency installation
- Prisma schema validation
- Prisma client generation
- automated tests
- production build

## Screenshots

Screenshots are stored in the `screenshots` folder.

Recommended screenshot set:

- Landing page
- Sign In / Create Account page
- Free dashboard
- Pro dashboard with billing section
- Delete confirmation modal
- Stripe Customer Portal

## Current Status

Completed:

- Authentication
- Protected dashboard
- Database-backed notes
- Stripe Checkout
- Stripe Customer Portal
- Stripe webhooks
- Subscription cancellation tracking
- Rate limiting
- Automated tests
- CI workflow
- Loading/error/not-found pages
- Custom delete confirmation modal

Planned improvements:

- Password reset flow
- Email verification flow
- More test coverage for auth and server actions
- Audit logging
- Admin dashboard
- Deployment screenshots

## Author

Akanksha Chavda
GitHub: AC0731

## Deployment Notes

Deployment and production setup notes are available in `docs/DEPLOYMENT.md`.
