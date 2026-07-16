# The Lost and Found Project — Ministry Platform

Starter web application for The Lost and Found Project ministry platform. Deployed via Vercel + GitHub integration.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (authentication, database, storage) — not yet connected
- Vercel (deployment target)

## Getting Started

### Prerequisites

- Node.js 18.18 or later
- npm (comes with Node.js)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/The-Lost-and-Found-Project/lost-and-found-platform.git
   cd lost-and-found-platform
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Copy the example environment file:

   ```
   cp .env.example .env.local
   ```

4. Start the development server:

   ```
   npm run dev
   ```

5. Open http://localhost:3000 in your browser.

## Project Structure

- `app/` — App Router pages and layouts
- `app/login`, `app/dashboard`, `app/prayer`, `app/studies`, `app/mentoring`, `app/events`, `app/admin` — placeholder routes
- `components/` — shared UI components, including the site header

## Status

This is an early starter scaffold. Supabase integration, database schema, and authentication have not been added yet. No API keys or secrets are included in this repository.

## Deployment

This project is designed to deploy on Vercel. Connect this GitHub repository to a Vercel project and deploy the main branch. Environment variables will need to be configured in Vercel once Supabase is connected in a later step.
