# TrueFit API

A comprehensive job applicant selection system with intelligent candidate ranking and assessment management.

## What It Does

TrueFit API is a recruitment platform that helps companies:

-   **Manage Jobs & Applicants**: Create job postings, track applicants, and manage applications
-   **Assessment System**: Create custom assessment templates with multiple question types
-   **Smart Ranking**: Automatically rank candidates based on assessment scores and configurable criteria
-   **Multi-Company Support**: Manage multiple companies, branches, and user roles
-   **Analytics**: Track performance, scoring statistics, and recruitment metrics

## Quick Start

### Run with Docker (Recommended)

```bash
docker-compose up --build
```

This will automatically:

-   Start PostgreSQL database
-   Run migrations and seed data
-   Create test companies, jobs, and candidates with rankings
-   Launch the API server at http://localhost:4000

### Access Points

-   **API**: http://localhost:4000
-   **Swagger UI**: http://localhost:4000/docs
-   **Health Check**: http://localhost:4000/health

**Swagger Credentials**: `admin` / `admin`

### Test User

-   **Email**: `user@example.com`
-   **Password**: `string`
-   **Role**: ADMIN

## Configuration Options

### Disable Mass Seeding

If you want to run without the demo data:

```bash
RUN_MASS_TEST=false docker-compose up --build
```

Or create a `docker-compose.override.yml`:

```yaml
version: "3.8"
services:
    backend:
        environment:
            RUN_MASS_TEST: "false"
```

### Environment Variables

Key variables in `docker-compose.yml`:

```
PORT=4000
DATABASE_URL=postgres://postgres:supersecret@postgres:5432/true-fit
RUN_MASS_TEST=true    # Set to false to skip demo data
SWAGGER_USERNAME=admin
SWAGGER_PASSWORD=admin
```

## Tech Stack

-   **Backend**: Node.js, Fastify, TypeScript
-   **Database**: PostgreSQL 15 with Prisma ORM
-   **Authentication**: JWT-based auth
-   **Documentation**: Swagger/OpenAPI
-   **Container**: Docker & Docker Compose

## Demo Data

When `RUN_MASS_TEST=true` (default), the system creates:

-   5 Companies with branches
-   20 Job postings
-   2 Assessment templates
-   10 Applicants with completed assessments
-   Full candidate rankings and scoring

## API Overview

The API provides endpoints for:

-   **Companies & Branches** (`/api/v1/companies`, `/api/v1/branches`)
-   **Jobs & Applications** (`/api/v1/jobs`, `/api/v1/applicants`)
-   **Assessments** (`/api/v1/assessment-templates`, `/api/v1/applicant-assessments`)
-   **Ranking System** (`/api/v1/jobs/:id/candidates`, `/api/v1/rankings`)
-   **Scoring Configuration** (`/api/v1/scoring-configs`)

Full API documentation available at `/docs` when running.

## Development

For local development without Docker:

```bash
# Install dependencies
yarn install

# Setup database
npx prisma migrate dev
npx prisma generate

# Run development server
yarn dev
```

## Scripts

-   `yarn build` - Build for production
-   `yarn dev` - Development server with hot reload
-   `yarn test` - Run test suite
-   `yarn seed` - Seed database with sample data
