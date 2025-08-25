# True Fit API Documentation

## Overview

This document outlines the complete API structure for the True Fit Job Applicants Selection System. The API follows RESTful principles and includes comprehensive endpoints for managing companies, branches, jobs, applicants, assessments, and the matching system.

## Base URL

```
https://api.truefit.loadup.com/v1
```

All endpoints are prefixed with `/api/v1`.

## Authentication

All API requests require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

### Authentication Endpoints

```typescript
POST / auth / login // User login
POST / auth / refresh // Refresh token
POST / auth / logout // Logout
GET / auth / me // Current user info
```

## 1. Core Entity Management

### Companies API

#### Endpoints

```typescript
GET    /companies              // List companies with search & pagination ✅
POST   /companies             // Create company with branches ✅
GET    /companies/:id         // Get company details with branches ✅
PUT    /companies/:id         // Update company ✅
DELETE /companies/:id         // Delete company ✅
GET    /companies/:id/stats   // Company-specific stats
GET    /companies/:id/jobs    // List all jobs across branches
```

#### Query Parameters

-   `search`: Search by company name or description
-   `status`: Filter by status (ACTIVE, INACTIVE)
-   `page`: Page number (default: 1)
-   `limit`: Items per page (default: 20, max: 100)
-   `sort`: Sort field (name, createdAt, etc.)
-   `order`: Sort order (asc, desc)

#### Company Model

```typescript
{
    id: string                  // UUID
    name: string               // Company name
    description?: string       // Optional description
    website?: string          // Company website
    email?: string           // Contact email
    phone?: string          // Contact phone
    address?: string       // Physical address
    status: "ACTIVE" | "INACTIVE"
    settings: {            // Company-specific settings
        allowMultipleApplications: boolean
        defaultScoringConfig: string
        // ... other settings
    }
    createdAt: Date
    updatedAt: Date
}
```

### Branches API

#### Endpoints

```typescript
GET    /branches              // List branches with search & pagination ✅
POST   /branches             // Create branch ✅
GET    /branches/:id         // Get branch details ✅
PUT    /branches/:id         // Update branch ✅
DELETE /branches/:id         // Delete branch ✅
GET    /branches/:id/stats   // Branch-specific stats
GET    /branches/:id/jobs    // List jobs at branch
```

#### Branch Model

```typescript
{
    id: string
    companyId: string
    name: string
    city?: string
    country?: string
    address?: string
    email?: string
    phone?: string
    status: "ACTIVE" | "INACTIVE"
    coordinates: {
        latitude: number
        longitude: number
    }
    operatingHours: {
        monday: { open: string, close: string }
        // ... other days
    }
    createdAt: Date
    updatedAt: Date
}
```

### Jobs API

#### Endpoints

```typescript
GET    /jobs                        // List jobs with advanced search & filters ✅
POST   /jobs                       // Create job ✅
GET    /jobs/:id                   // Get job details ✅
PUT    /jobs/:id                   // Update job ✅
DELETE /jobs/:id                   // Delete job ✅
GET    /jobs/stats                // Get job statistics ✅
GET    /jobs/:id/candidates        // Get ranked candidates
GET    /jobs/:id/top-candidates    // Get top 5 candidates
GET    /jobs/:id/assessment        // Get job's assessment template
PUT    /jobs/:id/scoring-config    // Update job's scoring configuration
```

#### Job Model

```typescript
{
    id: string
    branchId: string
    title: string
    description?: string
    requirements?: string
    status: "DRAFT" | "OPEN" | "CLOSED"
    openPositions?: number
    keywords: string[]           // Required skills/keywords
    minimumScore: number        // Minimum qualifying score
    locationRelevance: boolean  // Consider location in matching
    validUntil: Date          // Job posting expiry
    scoringConfigId?: string  // Custom scoring configuration
    createdAt: Date
    updatedAt: Date
}
```

### Applicants API

#### Endpoints

```typescript
GET    /applicants                      // List applicants with search & filters ✅
POST   /applicants                     // Register new applicant ✅
GET    /applicants/:id                 // Get applicant details ✅
PUT    /applicants/:id                 // Update applicant ✅
DELETE /applicants/:id                 // Delete applicant ✅
GET    /applicants/:id/applications    // List job applications
GET    /applicants/:id/assessments     // List completed assessments
GET    /applicants/:id/matches         // Get matching jobs
```

#### Applicant Model

```typescript
{
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    city?: string
    country?: string
    address?: string
    resumeUrl?: string
    skills: string[]
    preferredLocations: string[]
    availability: Date
    status: "ACTIVE" | "SEARCHING" | "NOT_AVAILABLE"
    createdAt: Date
    updatedAt: Date
}
```

## 2. Assessment System

### Assessment Templates API

#### Endpoints

```typescript
GET    /assessment-templates                  // List templates ✅
POST   /assessment-templates                 // Create template ✅
GET    /assessment-templates/:id             // Get template details ✅
PUT    /assessment-templates/:id             // Update template ✅
DELETE /assessment-templates/:id             // Delete template ✅
POST   /assessment-templates/:id/clone       // Clone template ✅
GET    /assessment-templates/stats           // Get usage statistics ✅
PUT    /assessment-templates/:id/questions   // Update question order
```

#### Assessment Template Model

```typescript
{
    id: string
    name: string
    description?: string
    jobId?: string
    timeLimit: number        // Minutes
    passingScore: number    // Minimum score to pass
    shuffleQuestions: boolean
    questions: AssessmentQuestion[]
    createdAt: Date
    updatedAt: Date
}
```

### Assessment Questions API

#### Endpoints

```typescript
GET    /assessment-questions              // List questions ✅
POST   /assessment-questions             // Create question ✅
GET    /assessment-questions/:id         // Get question details ✅
PUT    /assessment-questions/:id         // Update question ✅
DELETE /assessment-questions/:id         // Delete question ✅
GET    /assessment-questions/:id/answers // Get answer distribution ✅
```

#### Assessment Question Model

```typescript
{
    id: string
    templateId: string
    text: string
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "TEXT"
    options?: string[]      // For multiple choice
    correctAnswer?: string
    explanation: string    // Explanation for correct answer
    weight: number       // Question weight in scoring
    order: number      // Display order
    difficulty: "EASY" | "MEDIUM" | "HARD"
    category: string  // Skill category
    timeEstimate: number  // Seconds
    negativeWeight?: number  // Penalty for wrong answer
    createdAt: Date
}
```

### Applicant Assessments API

#### Endpoints

```typescript
POST   /applicant-assessments                   // Submit assessment ✅
GET    /applicant-assessments/:id               // Get details ✅
GET    /applicant-assessments/:id/score         // Get score ✅
GET    /applicant-assessments/:id/explanation   // Get explanation ✅
GET    /applicant-assessments/stats             // Get statistics ✅
```

#### Applicant Assessment Model

```typescript
{
    id: string
    applicantId: string
    templateId: string
    submittedAt: Date

    // When fetched with details:
    applicant: {
        id: string
        email: string
        firstName: string
        lastName: string
        phone?: string
        city?: string
        country?: string
    }
    template: {
        id: string
        name: string
        description?: string
        job?: {
            id: string
            title: string
            branch: {
                id: string
                name: string
                company: {
                    id: string
                    name: string
                }
            }
        }
    }
    answers: Array<{
        id: string
        answer?: string
        isCorrect: boolean
        question: {
            id: string
            text: string
            type: string
            weight: number
            correctAnswer?: string
        }
    }>
}

// Score Response
{
    score: number
    maxPossibleScore: number
    percentage: number
    breakdown: {
        correctAnswers: {
            count: number
            points: number
        }
        incorrectAnswers: {
            count: number
            points: number
        }
        recencyBonus?: {
            percentage: number
            points: number
        }
    }
    explanation: string[]
}

// Stats Response
{
    totalAssessments: number
    averageScore: number
    medianScore: number
    completionRate: number
    scoreDistribution: Array<{
        range: string
        count: number
        percentage: number
    }>
    correctAnswerRate: number
    questionStats: Array<{
        questionId: string
        text: string
        correctAnswers: number
        totalAnswers: number
        accuracyRate: number
    }>
}
```

## 3. Scoring & Matching System

### Scoring Configuration API

#### Endpoints

```typescript
GET    /scoring-configs              // List configurations ✅
POST   /scoring-configs             // Create configuration ✅
GET    /scoring-configs/:id         // Get details ✅
PUT    /scoring-configs/:id         // Update configuration ✅
DELETE /scoring-configs/:id         // Delete configuration ✅
POST   /scoring-configs/:id/apply   // Apply to job ✅
GET    /scoring-configs/:id/preview // Preview impact ✅
```

#### Scoring Config Model

```typescript
{
    id: string
    negativeMarkingFraction: number    // 0-1, penalty for wrong answers
    recencyWindowDays?: number         // Days to consider for recency boost
    recencyBoostPercent?: number      // 0-100, percentage boost for recent assessments
    isDefault: boolean                // Whether this is the default config
    jobId?: string                   // Optional job-specific override
    createdAt: Date
    updatedAt: Date

    // When fetched with details:
    job?: {
        id: string
        title: string
        branch: {
            id: string
            name: string
            company: {
                id: string
                name: string
            }
        }
    }
}

// Preview Response
{
    currentConfig: {
        score: number
        rank: number
        totalCandidates: number
    }
    newConfig: {
        score: number
        rank: number
        totalCandidates: number
    }
    changes: {
        scoreChange: number
        rankChange: number
        explanation: string[]
    }
}
```

### Matching Engine API

#### Endpoints

```typescript
POST   /matching/jobs/:id/candidates   // Get ranked candidates
POST   /matching/simulate             // Simulate scoring
GET    /matching/explanations/:id     // Get match explanation
```

#### Matching Parameters

```typescript
{
    filters: {
        location?: string[]
        skills?: string[]
        minimumScore?: number
        availability?: Date
    }
    scoring: {
        weights?: Record<string, number>
        bonuses?: Record<string, number>
        penalties?: Record<string, number>
    }
    pagination: {
        page: number
        limit: number
    }
}
```

## 4. Analytics & Statistics

### Statistics API

#### Endpoints

```typescript
GET    /stats/platform              // Platform statistics
GET    /stats/companies/:id         // Company analytics
GET    /stats/jobs/:id/applications // Job analytics
GET    /stats/assessment/performance // Assessment metrics
```

## 5. Error Handling

### Error Response Format

```typescript
{
    error: {
        code: string        // Error code
        message: string    // User-friendly message
        details?: any     // Additional error details
        correlationId: string  // For tracking
    }
}
```

### Common Error Codes

-   `400`: Bad Request
-   `401`: Unauthorized
-   `403`: Forbidden
-   `404`: Not Found
-   `409`: Conflict
-   `422`: Unprocessable Entity
-   `429`: Too Many Requests
-   `500`: Internal Server Error

## 6. Best Practices

### Headers

-   Use `Idempotency-Key` for POST/PUT requests
-   Include `Correlation-ID` for request tracking
-   Support `If-None-Match` for caching
-   Use `Accept-Language` for internationalization

### Pagination

-   Default: 20 items per page
-   Maximum: 100 items per page
-   Include total count in response
-   Use cursor-based pagination for large datasets

### Rate Limiting

-   Per endpoint limits
-   User/IP-based quotas
-   Include rate limit headers:
    -   `X-RateLimit-Limit`
    -   `X-RateLimit-Remaining`
    -   `X-RateLimit-Reset`

### Caching

-   Use ETags for caching
-   Cache-Control headers
-   Redis for application-level caching

### Security

-   JWT-based authentication
-   Role-based access control
-   Input validation
-   SQL injection prevention
-   XSS protection
-   Rate limiting
-   CORS configuration

## 7. Versioning

API versioning is handled through the URL path (/api/v1/). Breaking changes will result in a new API version.

## 8. Candidate Ranking System ✅

### Endpoints

-   `GET /api/v1/jobs/{jobId}/candidates/top` - Get top candidates for a job ✅
-   `POST /api/v1/rankings/calculate` - Trigger ranking recalculation ✅
-   `GET /api/v1/jobs/{jobId}/rankings/status` - Get ranking status ✅
-   `POST /api/v1/rankings/bulk` - Process bulk rankings ✅
-   `POST /api/v1/rankings/invalidate` - Invalidate rankings ✅
-   `POST /api/v1/rankings/schedule-stale` - Schedule stale recalculations ✅
-   `GET /api/v1/jobs/{jobId}/candidates/{applicantId}/rank` - Get specific candidate rank ✅

### Models

#### Candidate Ranking Model

```json
{
    "id": "uuid",
    "jobId": "uuid",
    "applicantId": "uuid",
    "assessmentId": "uuid",
    "rank": 1,
    "score": 85.5,
    "maxPossibleScore": 100,
    "percentage": 85.5,
    "correctAnswers": 17,
    "incorrectAnswers": 3,
    "recencyBonus": 5.25,
    "scoringConfigVersion": "hash",
    "calculatedAt": "2024-08-24T13:45:00Z",
    "isStale": false,
    "applicant": {
        "id": "uuid",
        "email": "john.doe@email.com",
        "firstName": "John",
        "lastName": "Doe"
    },
    "job": {
        "id": "uuid",
        "title": "Senior Developer",
        "branch": {
            "name": "Tech Hub",
            "company": {
                "name": "TechCorp"
            }
        }
    }
}
```

### Query Parameters

#### Top Candidates

-   `limit` (optional): Number of candidates to return (1-100, default: 5)

### Event-Driven Architecture

The ranking system automatically recalculates when:

-   New assessments are submitted
-   Scoring configurations change
-   Jobs are updated
-   Manual triggers are executed

Rankings are stored in the database and served from cache for optimal performance.

## 9. Documentation

Complete OpenAPI/Swagger documentation is available at:

```
/api/v1/docs
```

## 10. Support

For API support, contact:

-   Email: api-support@truefit.loadup.com
-   Documentation: https://docs.truefit.loadup.com
-   Status Page: https://status.truefit.loadup.com
