#!/bin/bash

# User Invitation System E2E Test Runner
#
# This script provides a convenient way to run invitation system tests
# with proper setup, execution, and cleanup.

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if server is running
check_server() {
    print_status "Checking if development server is running..."

    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        print_success "Development server is running on http://localhost:3001"
        return 0
    else
        print_error "Development server is not running on http://localhost:3001"
        print_status "Please start the server with: npm run dev"
        return 1
    fi
}

# Function to start server if not running
start_server() {
    print_status "Starting development server..."
    npm run dev &
    SERVER_PID=$!

    # Wait for server to start
    for i in {1..30}; do
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            print_success "Development server started successfully"
            return 0
        fi
        sleep 2
    done

    print_error "Failed to start development server"
    return 1
}

# Function to stop server
stop_server() {
    if [ ! -z "$SERVER_PID" ]; then
        print_status "Stopping development server..."
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
        print_success "Development server stopped"
    fi
}

# Function to run tests
run_tests() {
    local mode=$1
    local browser=$2
    local specific_test=$3

    print_status "Running invitation system tests..."

    case $mode in
        "ui")
            print_status "Running tests in UI mode..."
            npm run test:e2e:invitations:ui
            ;;
        "debug")
            print_status "Running tests in debug mode..."
            npm run test:e2e:invitations:debug
            ;;
        "headed")
            print_status "Running tests in headed mode..."
            npm run test:e2e:invitations:headed
            ;;
        "specific")
            if [ -z "$specific_test" ]; then
                print_error "No specific test provided"
                return 1
            fi
            print_status "Running specific test: $specific_test"
            npx playwright test --config=playwright-invitations.config.ts -g "$specific_test"
            ;;
        "browser")
            if [ -z "$browser" ]; then
                print_error "No browser specified"
                return 1
            fi
            print_status "Running tests on $browser..."
            npx playwright test --config=playwright-invitations.config.ts --project="$browser"
            ;;
        *)
            print_status "Running tests in standard mode..."
            npm run test:e2e:invitations
            ;;
    esac
}

# Function to show help
show_help() {
    echo "User Invitation System E2E Test Runner"
    echo
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -u, --ui             Run tests in UI mode"
    echo "  -d, --debug          Run tests in debug mode"
    echo "  -H, --headed         Run tests in headed mode"
    echo "  -s, --start-server   Start development server automatically"
    echo "  -c, --cleanup        Clean up test artifacts before running"
    echo "  -b, --browser BROWSER Run tests on specific browser (chromium, firefox, webkit)"
    echo "  -t, --test TEST      Run specific test by name"
    echo "  --no-server-check    Skip server availability check"
    echo
    echo "Examples:"
    echo "  $0                   # Run all invitation tests"
    echo "  $0 -u                # Run tests with UI"
    echo "  $0 -d                # Run tests in debug mode"
    echo "  $0 -b chromium       # Run tests on Chrome only"
    echo "  $0 -t \"should send invitation\"  # Run specific test"
    echo "  $0 -s -u             # Start server and run tests with UI"
    echo
}

# Function to cleanup test artifacts
cleanup_artifacts() {
    print_status "Cleaning up test artifacts..."

    if [ -d "playwright-report-invitations" ]; then
        rm -rf playwright-report-invitations
        print_success "Removed previous test reports"
    fi

    if [ -d "test-results" ]; then
        rm -rf test-results
        print_success "Removed previous test results"
    fi
}

# Parse command line arguments
MODE="standard"
BROWSER=""
SPECIFIC_TEST=""
START_SERVER=false
CHECK_SERVER=true
CLEANUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -u|--ui)
            MODE="ui"
            shift
            ;;
        -d|--debug)
            MODE="debug"
            shift
            ;;
        -H|--headed)
            MODE="headed"
            shift
            ;;
        -s|--start-server)
            START_SERVER=true
            shift
            ;;
        -c|--cleanup)
            CLEANUP=true
            shift
            ;;
        -b|--browser)
            MODE="browser"
            BROWSER="$2"
            shift 2
            ;;
        -t|--test)
            MODE="specific"
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        --no-server-check)
            CHECK_SERVER=false
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
print_status "Starting User Invitation System E2E Tests"

# Cleanup if requested
if [ "$CLEANUP" = true ]; then
    cleanup_artifacts
fi

# Server management
SERVER_PID=""
if [ "$START_SERVER" = true ]; then
    start_server || exit 1
elif [ "$CHECK_SERVER" = true ]; then
    check_server || exit 1
fi

# Trap to ensure cleanup on script exit
trap 'stop_server' EXIT

# Run the tests
if run_tests "$MODE" "$BROWSER" "$SPECIFIC_TEST"; then
    print_success "All invitation tests completed successfully!"

    # Show report location
    if [ -d "playwright-report-invitations" ]; then
        print_status "Test report available at: playwright-report-invitations/index.html"
    fi

    exit 0
else
    print_error "Some tests failed. Check the output above for details."

    # Show artifacts location
    if [ -d "test-results" ]; then
        print_status "Test artifacts (screenshots, videos) available at: test-results/"
    fi

    exit 1
fi