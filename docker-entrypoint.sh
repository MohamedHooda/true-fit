#!/bin/bash

set -e

echo "🚀 TrueFit API Docker Container Starting..."
echo "=========================================="

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo "⏳ Waiting for PostgreSQL to be ready..."
    
    while ! nc -z postgres 5432; do
        echo "   PostgreSQL is not ready yet. Waiting 2 seconds..."
        sleep 2
    done
    
    echo "✅ PostgreSQL is ready!"
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running Prisma migrations..."
    
    npx prisma migrate deploy
    
    echo "✅ Migrations completed!"
}

# Function to seed database if needed
seed_database() {
    echo "🌱 Checking if database needs seeding..."
    
    # Run seed script only if there are no companies (indicating empty database)
    if npx ts-node -e "
        import { PrismaClient } from '@prisma/client';
        const prisma = new PrismaClient();
        prisma.company.count().then(count => {
            if (count === 0) {
                console.log('Database is empty, seeding...');
                process.exit(1);
            } else {
                console.log('Database already has data, skipping seed');
                process.exit(0);
            }
        }).catch(() => process.exit(1));
    " 2>/dev/null; then
        echo "✅ Database already seeded!"
    else
        echo "🌱 Seeding database..."
        npx ts-node scripts/seed.ts
        echo "✅ Database seeded!"
    fi
}

# Function to ensure test user exists
ensure_test_user() {
    echo "👤 Ensuring test user exists..."
    
    npx ts-node scripts/ensure-test-user.ts
    
    if [ $? -eq 0 ]; then
        echo "✅ Test user is ready!"
    else
        echo "❌ Failed to ensure test user exists"
        exit 1
    fi
}

# Function to run mass applicant test
run_mass_test() {
    echo "🎯 Running mass applicant test with dynamic environment creation..."
    
    # Wait a moment for the server to be fully ready
    sleep 5
    
    # Run the test which will create company, job, template, and applicants
    npx ts-node scripts/mass-applicant-test-axios.ts --create
    
    if [ $? -eq 0 ]; then
        echo "✅ Mass applicant test completed successfully!"
        echo "🎉 Test environment created with ranking system working!"
    else
        echo "❌ Mass applicant test failed"
        exit 1
    fi
}

# Function to start the main application
start_application() {
    echo "🏁 Starting TrueFit API server..."
    
    # Generate Prisma client for runtime environment
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    echo "✅ Prisma client generated!"
    
    # Use pre-built files from Docker build stage
    node dist/server.js
}

# Main execution flow
main() {
    # Wait for dependencies
    wait_for_postgres
    
    # Setup database
    run_migrations
    # seed_database  # Skipped - will use mass applicant test to populate data
    
    # Check if we should run the test scenario
    if [ "$RUN_MASS_TEST" = "true" ]; then
        echo "🎯 Mass test mode enabled - will create complete test environment!"
        echo "📊 Target applicant count: ${DEMO_APPLICANT_COUNT:-10}"
        echo ""
        
        # Start the application in the background
        start_application &
        APP_PID=$!
        
        # Wait for the application to be ready
        echo "⏳ Waiting for application to be ready..."
        while ! curl -f http://localhost:4000/health >/dev/null 2>&1; do
            echo "   Application not ready yet. Waiting 2 seconds..."
            sleep 2
        done
        
        echo "✅ Application is ready!"
        echo ""
        
        # Setup test user and run tests
        ensure_test_user
        run_mass_test
        
        # Keep the application running
        echo ""
        echo "🎉 TrueFit API is now running with complete test data!"
        echo "🌐 Access Swagger UI at: http://localhost:4000/docs"
        echo "🔑 Swagger credentials: admin / admin"
        echo "📊 Test data includes: Company, Job, Assessment Template, ${DEMO_APPLICANT_COUNT:-10} Applicants with Rankings"
        echo "🏃 Press Ctrl+C to stop."
        wait $APP_PID
        
    else
        # Normal startup - just start the application
        start_application
    fi
}

# Trap SIGTERM and SIGINT
trap 'echo "🛑 Shutting down..."; exit 0' SIGTERM SIGINT

# Run main function
main "$@"
