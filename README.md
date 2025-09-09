# Manufacturing Execution System (MES)

## 📋 Overview

A comprehensive production management platform designed to streamline manufacturing workflows from sales orders to product delivery. This system provides real-time visibility into production processes, inventory management, and workforce coordination.

## 🏗️ Architecture

- **Backend**: NestJS with TypeScript
- **Frontend**: Next.js 15 with App Router
- **Database**: PostgreSQL 15 with TypeORM
- **Cache**: Redis 7
- **Authentication**: Keycloak
- **Authorization**: OpenFGA
- **Queue**: Bull with Redis
- **Real-time**: WebSockets

## 📁 Project Structure

```
manufacturing-execution-system/
├── backend/                 # NestJS backend application
├── frontend/               
│   ├── admin-portal/       # Admin/Supervisor interface
│   ├── user-portal/        # Worker/Sales interface
│   └── packages/           # Shared packages
│       ├── ui/            # Shared UI components
│       ├── auth/          # Authentication utilities
│       ├── api/           # API client
│       ├── permissions/    # Permission utilities
│       └── config/        # Shared configuration
├── docs/                   # Documentation
├── k6/                     # Performance tests
├── nginx/                  # Reverse proxy config
└── scripts/               # Utility scripts
```

## 🚀 Quick Start

```bash
# Initial setup
make setup

# Start all services
make up

# Initialize auth services
make keycloak-init
make fga-init

# Run applications
make backend-dev    # http://localhost:3000
make admin-dev      # http://localhost:3001
make user-dev       # http://localhost:3002
```

## 📊 Key Features

- **Multi-tenant Architecture**: Isolated data per organization
- **Role-Based Access Control**: Admin, Executive, Sales, Worker roles
- **Real-time Updates**: WebSocket-powered live dashboards
- **Production Workflow**: Order → Task → Production → Delivery
- **Inventory Management**: Stock tracking, forecasting, alerts
- **Worker Management**: Shifts, skills, time tracking
- **Analytics & Reporting**: Custom reports, KPI dashboards

## 🔐 Security

- JWT-based authentication with Keycloak
- Fine-grained permissions with OpenFGA
- Data encryption at rest and in transit
- Audit logging for all critical operations

## 📚 Documentation

- [API Documentation](docs/api/README.md)
- [Development Setup](docs/development/README.md)
- [Deployment Guide](docs/deployment/README.md)
- [Architecture Overview](docs/architecture/README.md)

## 📝 License

Proprietary - All Rights Reserved