# Make Commands Reference

Comprehensive list of all available make commands for the Manufacturing Execution System.

## 🚀 Quick Start Commands

### Initial Setup
```bash
make setup              # Complete initial setup (install deps, setup DB, etc.)
make help              # Show available commands with descriptions
```

### Starting Services
```bash
make up                # Start core services (DB, Redis, Keycloak, OpenFGA)
make up-all            # Start all services including monitoring
make down              # Stop all services
```

## 🖥️ Development Commands

### Backend Development
```bash
make backend-dev       # Start backend in development mode (port 3000)
make backend-build     # Build backend for production
make backend-install   # Install backend dependencies
make backend-lint      # Run ESLint on backend code
make backend-format    # Format backend code with Prettier
make shell-backend     # Open shell in backend container
```

### Frontend Development
```bash
make admin-dev         # Start admin portal (port 3001)
make user-dev          # Start user portal (port 3002)
make frontend-build    # Build all frontend apps
make frontend-install  # Install frontend dependencies
make frontend-lint     # Lint all frontend code
make frontend-format   # Format frontend code
make frontend-type-check # Run TypeScript type checking
```

### UI Component Library
```bash
make ui-storybook      # Start Storybook for UI components (port 6006)
make ui-storybook-build # Build Storybook static files
make ui-build          # Build UI component library
make frontend-lint-ui  # Lint UI component library
```

## 🧪 Testing Commands

### Backend Testing
```bash
make backend-test      # Run all backend tests
make backend-test-watch # Run backend tests in watch mode
make backend-test-e2e  # Run end-to-end tests
make backend-test-integration # Run integration tests
make backend-test-integration-cov # Integration tests with coverage
make backend-test-integration-watch # Integration tests in watch mode
make backend-test-auth # Run authentication tests
```

### Frontend Testing
```bash
make frontend-test     # Run all frontend tests
make frontend-test-watch # Run frontend tests in watch mode
make frontend-test-coverage # Run tests with coverage report
make frontend-test-ui  # Test UI components
make frontend-test-button # Test Button component specifically
make frontend-test-badge # Test Badge component specifically
make frontend-test-hooks # Test React hooks
```

### Combined Testing
```bash
make test-all          # Run all tests (backend + frontend)
make perf-test         # Run performance tests with k6
```

## 🗄️ Database Commands

```bash
make db-migrate        # Run database migrations
make db-rollback       # Rollback last migration
make db-seed           # Seed database with sample data
make db-reset          # Reset database (drop, create, migrate, seed)
make shell-db          # Open PostgreSQL shell
make backup-db         # Create database backup
make restore-db        # Restore database from backup
```

## 🔐 Authentication & Authorization

### Keycloak
```bash
make keycloak-init     # Initialize Keycloak with realm and clients
make keycloak-setup    # Complete Keycloak setup
make keycloak-create-realm # Create MES realm
```

### OpenFGA
```bash
make fga-init          # Initialize OpenFGA
make openfga-setup     # Complete OpenFGA setup
make openfga-migrate   # Run OpenFGA migrations
make openfga-seed      # Seed OpenFGA with initial data
```

## 📊 Monitoring & Debugging

```bash
make logs              # Show logs for all services
make logs-backend      # Show backend logs
make logs-db           # Show database logs
make logs-keycloak     # Show Keycloak logs
make logs-redis        # Show Redis logs
make ps                # Show running containers
make health            # Check health of all services
make info              # Show system information
```

## 🏭 Production Commands

```bash
make prod-build        # Build for production
make prod-up           # Start production services
make prod-down         # Stop production services
```

## 🧹 Maintenance Commands

```bash
make clean             # Clean build artifacts and dependencies
make clean-volumes     # Clean Docker volumes
make reset             # Complete reset (clean + fresh setup)
make restart           # Restart all services
make shell-redis       # Open Redis CLI
```

## 🔒 Code Quality

```bash
make lint-all          # Lint all code (backend + frontend)
make format-all        # Format all code
make security-scan     # Run security vulnerability scan
```

## 📝 Common Workflows

### Fresh Development Setup
```bash
make clean
make setup
make up
make keycloak-init
make fga-init
make db-migrate
make db-seed
make backend-dev    # In terminal 1
make admin-dev      # In terminal 2
make user-dev       # In terminal 3
```

### Running Tests Before Commit
```bash
make lint-all
make frontend-type-check
make test-all
```

### Debugging Issues
```bash
make ps             # Check what's running
make health         # Check service health
make logs           # View all logs
make logs-backend   # View specific service logs
```

### Database Development
```bash
make shell-db       # Access PostgreSQL
make db-migrate     # Apply new migrations
make db-seed        # Add test data
make backup-db      # Backup before major changes
```

### UI Component Development
```bash
make ui-storybook   # Develop components in isolation
make frontend-test-ui # Test components
make ui-build       # Build library
```

## 🔧 Environment Variables

The make commands use these default ports:
- Backend API: 3000
- Admin Portal: 3001
- User Portal: 3002
- PostgreSQL: 5432
- Redis: 6379
- Keycloak: 8080
- OpenFGA: 8081
- Storybook: 6006

## 💡 Tips

1. **Use `make help`** to see a quick reference of available commands
2. **Check service status** with `make ps` before starting development
3. **View logs** with `make logs-[service]` when debugging
4. **Run tests** with `make test-all` before committing
5. **Format code** with `make format-all` to maintain consistency
6. **Use watch mode** for TDD: `make backend-test-watch` or `make frontend-test-watch`

## 🐛 Troubleshooting

### Services won't start
```bash
make down
make clean-volumes
make up
```

### Database connection issues
```bash
make logs-db
make shell-db  # Check if DB is accessible
make db-reset  # Reset if corrupted
```

### Port already in use
```bash
make ps  # Check what's running
make down  # Stop all services
# Or change ports in .env file
```

### Authentication issues
```bash
make keycloak-init  # Reinitialize Keycloak
make fga-init      # Reinitialize OpenFGA
```