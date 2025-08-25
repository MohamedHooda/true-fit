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

# Function to run production seed
run_mass_test() {
    echo "🎯 Running Production Seed - Complete Test Environment Creation..."
    
    # Wait a moment for the server to be fully ready
    sleep 5
    
    # Run the production seed script which creates a comprehensive environment
    npx ts-node scripts/production-seed.ts
    
    if [ $? -eq 0 ]; then
        echo "✅ Production Seed completed successfully!"
        echo "🎉 Complete production-style environment created with ranking system working!"
    else
        echo "❌ Production Seed failed"
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
        echo "🎯 Production Seed mode enabled - will create complete production-style environment!"
        echo "📊 Creating: 5 companies, 20 jobs, 2 assessment templates, 10 applicants with rankings"
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
        echo "🎉 TrueFit API is now running with complete production-style test data!"
        echo "🌐 Access Swagger UI at: http://localhost:4000/docs"
        echo "🔑 Swagger credentials: admin / admin"
        echo "📊 Data includes: 5 Companies, 20 Jobs, 2 Assessment Templates, 10 Applicants with Full Rankings"
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
