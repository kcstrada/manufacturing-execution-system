# ===============================
# Manufacturing Execution System Application Makefile
# ===============================

# Environment Configuration
ENV_FILE=.env
DOCKER_COMPOSE=docker compose --env-file $(ENV_FILE)
DOCKER_COMPOSE_PROD=docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file $(ENV_FILE)

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Manufacturing Execution System - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# ===============================
# 🚀 Quick Start Commands
# ===============================

.PHONY: setup
setup: ## Initial project setup
	@echo "$(YELLOW)Setting up Manufacturing Execution System...$(NC)"
	@if [ ! -f .env ]; then cp .env.example .env; echo "$(GREEN)✅ Created .env file$(NC)"; fi
	@$(DOCKER_COMPOSE) pull
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@make backend-install
	@make frontend-install
	@echo "$(GREEN)✅ Setup complete! Run 'make up' to start services$(NC)"

.PHONY: up
up: ## Start all infrastructure services (Postgres, Redis, Keycloak, OpenFGA)
	@echo "$(BLUE)🚀 Starting infrastructure services...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis keycloak openfga
	@echo "$(GREEN)✅ Infrastructure services started!$(NC)"
	@echo "$(YELLOW)📊 pgAdmin: http://localhost:5050$(NC)"
	@echo "$(YELLOW)🔐 Keycloak Admin: http://localhost:8080$(NC)"
	@echo "$(YELLOW)🛡️ OpenFGA Playground: http://localhost:8081/playground$(NC)"
	@echo ""
	@echo "$(BLUE)Run 'make backend-dev' to start the backend$(NC)"
	@echo "$(BLUE)Run 'make admin-dev' to start the admin portal$(NC)"
	@echo "$(BLUE)Run 'make user-dev' to start the user portal$(NC)"

.PHONY: up-all
up-all: ## Start all services including applications
	@echo "$(BLUE)🚀 Starting all services...$(NC)"
	@$(DOCKER_COMPOSE) --profile app --profile dev up -d
	@echo "$(GREEN)✅ All services started!$(NC)"
	@echo "$(YELLOW)📊 Admin Portal: http://localhost:3001$(NC)"
	@echo "$(YELLOW)👤 User Portal: http://localhost:3002$(NC)"
	@echo "$(YELLOW)🔐 Keycloak Admin: http://localhost:8080$(NC)"
	@echo "$(YELLOW)📚 API Docs: http://localhost:3000/api/docs$(NC)"

.PHONY: down
down: ## Stop all services
	@echo "$(RED)🛑 Stopping all services...$(NC)"
	@$(DOCKER_COMPOSE) --profile app --profile dev --profile nginx down
	@echo "$(GREEN)✅ All services stopped$(NC)"

.PHONY: restart
restart: down up ## Restart all services
	@echo "$(GREEN)✅ Services restarted$(NC)"

# ===============================
# 🛠️ Backend Commands
# ===============================

.PHONY: backend-install
backend-install: ## Install backend dependencies
	@echo "$(BLUE)📦 Installing backend dependencies...$(NC)"
	@cd backend && npm install
	@echo "$(GREEN)✅ Backend dependencies installed$(NC)"

.PHONY: backend-dev
backend-dev: ## Run backend in development mode
	@echo "$(BLUE)🚀 Starting backend in development mode...$(NC)"
	@cd backend && npm run start:dev

.PHONY: backend-build
backend-build: ## Build backend for production
	@echo "$(BLUE)🏗️ Building backend...$(NC)"
	@cd backend && npm run build
	@echo "$(GREEN)✅ Backend built successfully$(NC)"

.PHONY: backend-test
backend-test: ## Run backend tests
	@echo "$(BLUE)🧪 Running backend tests...$(NC)"
	@cd backend && npm run test

.PHONY: backend-test-e2e
backend-test-e2e: ## Run backend e2e tests
	@echo "$(BLUE)🧪 Running backend e2e tests...$(NC)"
	@cd backend && npm run test:e2e

.PHONY: backend-test-integration
backend-test-integration: ## Run backend integration tests
	@echo "$(BLUE)🧪 Running backend integration tests...$(NC)"
	@cd backend && npm run test:integration

.PHONY: backend-test-auth
backend-test-auth: ## Run authentication integration tests
	@echo "$(BLUE)🔐 Running authentication integration tests...$(NC)"
	@cd backend && npm run test:auth

.PHONY: backend-test-integration-watch
backend-test-integration-watch: ## Run integration tests in watch mode
	@echo "$(BLUE)👀 Running integration tests in watch mode...$(NC)"
	@cd backend && npm run test:integration:watch

.PHONY: backend-test-integration-cov
backend-test-integration-cov: ## Run integration tests with coverage
	@echo "$(BLUE)📊 Running integration tests with coverage...$(NC)"
	@cd backend && npm run test:integration:cov
	@echo ""
	@echo "$(YELLOW)📈 Coverage Summary:$(NC)"
	@cat backend/coverage-e2e/lcov-report/index.html | grep -A 4 "percentage" | head -5 || true
	@echo ""
	@echo "$(GREEN)✅ Full coverage report: backend/coverage-e2e/lcov-report/index.html$(NC)"
	@echo "$(BLUE)💡 Open with: open backend/coverage-e2e/lcov-report/index.html$(NC)"

.PHONY: backend-test-integration-cov-quick
backend-test-integration-cov-quick: ## Run only passing integration tests with coverage
	@echo "$(BLUE)🚀 Running passing integration tests with coverage...$(NC)"
	@cd backend && npx jest --config ./test/jest-integration.json --coverage --passWithNoTests test/health test/tenants || true
	@echo ""
	@echo "$(GREEN)✅ Quick coverage report generated in backend/coverage-e2e/$(NC)"

.PHONY: backend-test-watch
backend-test-watch: ## Run backend tests in watch mode
	@cd backend && npm run test:watch

.PHONY: backend-lint
backend-lint: ## Lint backend code
	@echo "$(BLUE)🔍 Linting backend code...$(NC)"
	@cd backend && npm run lint

.PHONY: backend-format
backend-format: ## Format backend code
	@echo "$(BLUE)✨ Formatting backend code...$(NC)"
	@cd backend && npm run format

.PHONY: db-migrate
db-migrate: ## Run database migrations
	@echo "$(BLUE)🗄️ Running database migrations...$(NC)"
	@cd backend && npm run migration:run
	@echo "$(GREEN)✅ Migrations completed$(NC)"

.PHONY: db-rollback
db-rollback: ## Rollback last database migration
	@echo "$(YELLOW)⏪ Rolling back last migration...$(NC)"
	@cd backend && npm run migration:revert
	@echo "$(GREEN)✅ Migration rolled back$(NC)"

.PHONY: db-seed
db-seed: ## Seed database with initial data
	@echo "$(BLUE)🌱 Seeding database...$(NC)"
	@cd backend && npm run seed
	@echo "$(GREEN)✅ Database seeded$(NC)"

.PHONY: db-reset
db-reset: ## Reset database (drop + migrate + seed)
	@echo "$(RED)🔄 Resetting database...$(NC)"
	@cd backend && npm run db:reset
	@echo "$(GREEN)✅ Database reset complete$(NC)"

# ===============================
# 🎨 Frontend Commands
# ===============================

.PHONY: frontend-install
frontend-install: ## Install all frontend dependencies
	@echo "$(BLUE)📦 Installing frontend dependencies...$(NC)"
	@cd frontend && npm install
	@echo "$(GREEN)✅ Frontend dependencies installed$(NC)"

.PHONY: admin-dev
admin-dev: ## Run Admin Portal in development mode
	@echo "$(BLUE)🚀 Starting Admin Portal...$(NC)"
	@cd frontend/admin-portal && npm run dev

.PHONY: user-dev
user-dev: ## Run User Portal in development mode
	@echo "$(BLUE)🚀 Starting User Portal...$(NC)"
	@cd frontend/user-portal && npm run dev

.PHONY: frontend-build
frontend-build: ## Build all frontend applications
	@echo "$(BLUE)🏗️ Building frontend applications...$(NC)"
	@cd frontend && npm run build
	@echo "$(GREEN)✅ Frontend built successfully$(NC)"

.PHONY: frontend-test
frontend-test: ## Run frontend tests
	@echo "$(BLUE)🧪 Running frontend tests...$(NC)"
	@cd frontend && npm run test

.PHONY: frontend-test-ui
frontend-test-ui: ## Run UI package tests
	@echo "$(BLUE)🧪 Running UI package tests...$(NC)"
	@cd frontend/packages/ui && npm test -- --run

.PHONY: frontend-test-watch
frontend-test-watch: ## Run frontend tests in watch mode
	@echo "$(BLUE)👀 Starting test watch mode...$(NC)"
	@cd frontend/packages/ui && npm test

.PHONY: frontend-test-coverage
frontend-test-coverage: ## Run frontend tests with coverage
	@echo "$(BLUE)📊 Running tests with coverage...$(NC)"
	@cd frontend/packages/ui && npm run test:coverage

.PHONY: frontend-test-button
frontend-test-button: ## Test Button component
	@echo "$(BLUE)🧪 Testing Button component...$(NC)"
	@cd frontend/packages/ui && npm test src/components/forms/Button.test.tsx -- --run

.PHONY: frontend-test-badge
frontend-test-badge: ## Test Badge component
	@echo "$(BLUE)🧪 Testing Badge component...$(NC)"
	@cd frontend/packages/ui && npm test src/components/data-display/Badge.test.tsx -- --run

.PHONY: frontend-test-hooks
frontend-test-hooks: ## Test React hooks
	@echo "$(BLUE)🧪 Testing hooks...$(NC)"
	@cd frontend/packages/ui && npm test src/hooks -- --run

.PHONY: frontend-lint
frontend-lint: ## Lint frontend code
	@echo "$(BLUE)🔍 Linting frontend code...$(NC)"
	@cd frontend && npm run lint

.PHONY: frontend-lint-ui
frontend-lint-ui: ## Lint UI package
	@echo "$(BLUE)🔍 Linting UI package...$(NC)"
	@cd frontend/packages/ui && npm run lint:check

.PHONY: frontend-format
frontend-format: ## Format frontend code
	@echo "$(BLUE)✨ Formatting frontend code...$(NC)"
	@cd frontend && npm run format

.PHONY: frontend-type-check
frontend-type-check: ## Run TypeScript type checking
	@echo "$(BLUE)📝 Running TypeScript type checking...$(NC)"
	@cd frontend/packages/ui && npm run type-check

.PHONY: ui-storybook
ui-storybook: ## Start Storybook for UI components
	@echo "$(BLUE)📚 Starting Storybook...$(NC)"
	@cd frontend/packages/ui && npm run storybook

.PHONY: ui-storybook-build
ui-storybook-build: ## Build Storybook static files
	@echo "$(BLUE)🏗️ Building Storybook...$(NC)"
	@cd frontend/packages/ui && npm run build-storybook

.PHONY: ui-build
ui-build: ## Build UI package
	@echo "$(BLUE)🏗️ Building UI package...$(NC)"
	@cd frontend/packages/ui && npm run build

# ===============================
# 🔐 Identity & Authorization
# ===============================

.PHONY: keycloak-setup
keycloak-setup: ## Configure Keycloak realm, clients, and roles
	@echo "$(BLUE)🔐 Setting up Keycloak...$(NC)"
	@./scripts/keycloak-setup.sh
	@echo "$(YELLOW)Access Keycloak Admin at: http://localhost:8080$(NC)"
	@echo "$(YELLOW)Realm: mes$(NC)"

.PHONY: keycloak-init
keycloak-init: keycloak-setup ## Alias for keycloak-setup

.PHONY: keycloak-create-realm
keycloak-create-realm: ## Create MES realm in Keycloak
	@echo "$(BLUE)🏰 Creating MES realm...$(NC)"
	@cd scripts && ./keycloak-setup.sh
	@echo "$(GREEN)✅ MES realm created$(NC)"

.PHONY: openfga-setup
openfga-setup: ## Setup OpenFGA store and authorization model
	@echo "$(BLUE)🛡️ Setting up OpenFGA...$(NC)"
	@./scripts/openfga/setup-openfga.sh
	@echo "$(GREEN)✅ OpenFGA setup complete!$(NC)"

.PHONY: openfga-seed
openfga-seed: ## Seed OpenFGA with sample authorization data
	@echo "$(BLUE)🌱 Seeding OpenFGA data...$(NC)"
	@./scripts/openfga/seed-data.sh
	@echo "$(GREEN)✅ OpenFGA data seeded$(NC)"

.PHONY: openfga-migrate
openfga-migrate: ## Run OpenFGA database migrations
	@echo "$(BLUE)🔄 Running OpenFGA migrations...$(NC)"
	@docker exec mes-openfga /openfga migrate
	@echo "$(GREEN)✅ OpenFGA migrations complete$(NC)"

.PHONY: fga-init
fga-init: openfga-migrate openfga-setup openfga-seed ## Complete OpenFGA initialization

# ===============================
# 📊 Monitoring & Debugging
# ===============================

.PHONY: logs
logs: ## Follow logs from all services
	@$(DOCKER_COMPOSE) --profile app --profile dev logs -f

.PHONY: logs-backend
logs-backend: ## Follow backend logs only
	@$(DOCKER_COMPOSE) logs -f backend

.PHONY: logs-db
logs-db: ## Follow database logs
	@$(DOCKER_COMPOSE) logs -f postgres

.PHONY: logs-keycloak
logs-keycloak: ## Follow Keycloak logs
	@$(DOCKER_COMPOSE) logs -f keycloak

.PHONY: logs-redis
logs-redis: ## Follow Redis logs
	@$(DOCKER_COMPOSE) logs -f redis

.PHONY: health
health: ## Check health of all services
	@echo "$(BLUE)🔍 Checking service health...$(NC)"
	@echo "$(YELLOW)PostgreSQL:$(NC)"
	@$(DOCKER_COMPOSE) exec postgres pg_isready -U postgres -d manufacturing_execution_system_db || echo "$(RED)❌ PostgreSQL unhealthy$(NC)"
	@echo "$(YELLOW)Redis:$(NC)"
	@$(DOCKER_COMPOSE) exec redis redis-cli ping || echo "$(RED)❌ Redis unhealthy$(NC)"
	@echo "$(YELLOW)Keycloak:$(NC)"
	@curl -s http://localhost:8080/health || echo "$(RED)❌ Keycloak unhealthy$(NC)"
	@echo "$(YELLOW)OpenFGA:$(NC)"
	@curl -s http://localhost:8081/healthz || echo "$(RED)❌ OpenFGA unhealthy$(NC)"
	@echo "$(GREEN)✅ Health check complete$(NC)"

.PHONY: ps
ps: ## Show running services
	@$(DOCKER_COMPOSE) --profile app --profile dev ps

# ===============================
# 🧹 Cleanup & Utilities
# ===============================

.PHONY: clean
clean: ## Clean up containers, volumes, and node_modules
	@echo "$(RED)🧹 Cleaning up...$(NC)"
	@$(DOCKER_COMPOSE) --profile app --profile dev --profile nginx down -v --remove-orphans
	@docker system prune -f
	@rm -rf backend/node_modules frontend/node_modules
	@rm -rf backend/dist frontend/admin-portal/.next frontend/user-portal/.next
	@rm -rf frontend/packages/*/node_modules
	@echo "$(GREEN)✅ Cleanup complete!$(NC)"

.PHONY: clean-volumes
clean-volumes: ## Remove all Docker volumes
	@echo "$(RED)🗑️ Removing Docker volumes...$(NC)"
	@$(DOCKER_COMPOSE) down -v
	@echo "$(GREEN)✅ Volumes removed$(NC)"

.PHONY: reset
reset: clean setup ## Complete reset (clean + setup)
	@echo "$(GREEN)✅ Project reset complete!$(NC)"

# ===============================
# 🚢 Production & Deployment
# ===============================

.PHONY: prod-build
prod-build: ## Build production images
	@echo "$(BLUE)🏗️ Building production images...$(NC)"
	@$(DOCKER_COMPOSE_PROD) build
	@echo "$(GREEN)✅ Production images built$(NC)"

.PHONY: prod-up
prod-up: ## Start production environment
	@echo "$(BLUE)🚀 Starting production environment...$(NC)"
	@$(DOCKER_COMPOSE_PROD) --profile app --profile nginx up -d
	@echo "$(GREEN)✅ Production environment started$(NC)"

.PHONY: prod-down
prod-down: ## Stop production environment
	@echo "$(RED)🛑 Stopping production environment...$(NC)"
	@$(DOCKER_COMPOSE_PROD) --profile app --profile nginx down
	@echo "$(GREEN)✅ Production environment stopped$(NC)"

.PHONY: backup-db
backup-db: ## Backup database
	@echo "$(BLUE)💾 Creating database backup...$(NC)"
	@mkdir -p backups
	@docker exec -t $$($(DOCKER_COMPOSE) ps -q postgres) pg_dump -U postgres -d manufacturing_execution_system_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Database backup created in backups/$(NC)"

.PHONY: restore-db
restore-db: ## Restore database from backup (usage: make restore-db FILE=backup_file.sql)
	@echo "$(BLUE)📥 Restoring database from backup...$(NC)"
	@docker exec -i $$($(DOCKER_COMPOSE) ps -q postgres) psql -U postgres -d manufacturing_execution_system_db < $(FILE)
	@echo "$(GREEN)✅ Database restored$(NC)"

# ===============================
# 📈 Performance & Quality
# ===============================

.PHONY: test-all
test-all: backend-test frontend-test ## Run all tests
	@echo "$(GREEN)✅ All tests completed!$(NC)"

.PHONY: lint-all
lint-all: backend-lint frontend-lint ## Lint all code
	@echo "$(GREEN)✅ All code linted!$(NC)"

.PHONY: format-all
format-all: backend-format frontend-format ## Format all code
	@echo "$(GREEN)✅ All code formatted!$(NC)"

.PHONY: perf-test
perf-test: ## Run performance tests with k6
	@echo "$(BLUE)⚡ Running performance tests...$(NC)"
	@k6 run k6/load-test.js

.PHONY: security-scan
security-scan: ## Run security vulnerability scan
	@echo "$(BLUE)🔒 Running security scan...$(NC)"
	@cd backend && npm audit
	@cd frontend && npm audit
	@echo "$(GREEN)✅ Security scan complete$(NC)"

# ===============================
# 🔧 Development Utilities
# ===============================

.PHONY: shell-backend
shell-backend: ## Open shell in backend container
	@$(DOCKER_COMPOSE) exec backend /bin/sh

.PHONY: shell-db
shell-db: ## Open PostgreSQL shell
	@$(DOCKER_COMPOSE) exec postgres psql -U postgres -d manufacturing_execution_system_db

.PHONY: shell-redis
shell-redis: ## Open Redis CLI
	@$(DOCKER_COMPOSE) exec redis redis-cli -a redis_password

.PHONY: info
info: ## Show project information
	@echo "$(BLUE)===============================$(NC)"
	@echo "$(BLUE)Manufacturing Execution System$(NC)"
	@echo "$(BLUE)===============================$(NC)"
	@echo ""
	@echo "$(YELLOW)📋 Services:$(NC)"
	@echo "  Backend API:    http://localhost:3000"
	@echo "  Admin Portal:   http://localhost:3001"
	@echo "  User Portal:    http://localhost:3002"
	@echo "  Keycloak:       http://localhost:8080"
	@echo "  OpenFGA:        http://localhost:8081"
	@echo "  pgAdmin:        http://localhost:5050"
	@echo "  Redis Commander: http://localhost:8083"
	@echo ""
	@echo "$(YELLOW)📚 Documentation:$(NC)"
	@echo "  API Docs:       http://localhost:3000/api/docs"
	@echo "  README:         ./README.md"
	@echo ""
	@echo "$(YELLOW)🔑 Default Credentials:$(NC)"
	@echo "  Keycloak:       admin / admin"
	@echo "  pgAdmin:        admin@mes.local / admin"
	@echo "  Redis Commander: admin / admin"
	@echo ""
	@echo "$(GREEN)Run 'make help' for all available commands$(NC)"