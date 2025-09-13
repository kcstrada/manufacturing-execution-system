# Keycloak Configuration

This directory contains all Keycloak configuration files for the Manufacturing Execution System.

## Directory Structure

```
keycloak/
├── realms/           # Realm configuration files
│   └── mes-realm.json
├── themes/           # Custom Keycloak themes
│   └── mes/         # MES custom theme
├── users/           # User seeder files
│   └── initial-users.json
├── scripts/         # Utility scripts
│   ├── init-keycloak.sh
│   ├── backup-realm.sh
│   └── update-users.sh
└── extensions/      # Custom Keycloak extensions (if needed)
```

## Quick Start

### 1. Start Keycloak with Docker Compose

The docker-compose.yml is configured to automatically:
- Import the MES realm configuration
- Mount the custom theme
- Set up initial admin credentials

```bash
# Start Keycloak and dependencies
docker-compose up -d keycloak

# View logs
docker-compose logs -f keycloak
```

### 2. Access Keycloak Admin Console

- URL: http://localhost:8080
- Admin Username: admin
- Admin Password: admin (change in production!)

### 3. Access MES Realm

The MES realm is automatically imported with:
- Custom roles for manufacturing operations
- Client configurations for backend and frontend applications
- Initial test users

## Configuration Files

### mes-realm.json

Contains the complete realm configuration including:
- **Roles**: super_admin, admin, production_manager, quality_manager, etc.
- **Clients**: mes-backend, mes-admin-portal, mes-user-portal
- **Security settings**: Token lifespans, password policies, etc.

### initial-users.json

Contains 10 test users with different roles:
- admin@mes.local (super_admin)
- john.smith@mes.local (production_manager)
- jane.doe@mes.local (quality_manager)
- And others...

Default password for all test users: `Password123!` (marked as temporary)

### Custom Theme

The MES theme provides:
- Manufacturing-themed login page
- Custom CSS with industrial design
- Animated gear icon
- Gradient backgrounds

## Scripts

### init-keycloak.sh
Initializes Keycloak with the MES realm and users. Run automatically on container start.

### backup-realm.sh
Creates a backup of the current realm configuration:
```bash
docker exec mes-keycloak /opt/keycloak/scripts/backup-realm.sh
```

### update-users.sh
Updates or adds users from the initial-users.json file:
```bash
docker exec mes-keycloak /opt/keycloak/scripts/update-users.sh
```

## Environment Variables

Key environment variables (set in .env file):
```env
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_PORT=8080
KEYCLOAK_REALM=mes
KEYCLOAK_CLIENT_ID=mes-backend
KEYCLOAK_CLIENT_SECRET=your-secret-here
```

## Client Configurations

### Backend Client (mes-backend)
- Type: Confidential
- Protocol: openid-connect
- Authentication: Client ID and Secret

### Admin Portal Client (mes-admin-portal)
- Type: Public
- Protocol: openid-connect
- Redirect URIs: http://localhost:3001/*

### User Portal Client (mes-user-portal)
- Type: Public
- Protocol: openid-connect
- Redirect URIs: http://localhost:3002/*

## Security Considerations

For production deployment:
1. Change all default passwords
2. Use strong client secrets
3. Configure proper redirect URIs
4. Enable HTTPS
5. Set up proper password policies
6. Configure brute force protection
7. Enable user federation if needed (LDAP/AD)

## Troubleshooting

### Realm not importing
- Check docker logs: `docker-compose logs keycloak`
- Ensure PostgreSQL is running and healthy
- Verify file permissions on mounted volumes

### Theme not showing
- Clear browser cache
- Check theme is properly mounted in docker-compose
- Verify theme files are in correct structure

### Users not created
- Run update-users.sh script manually
- Check Keycloak logs for errors
- Verify JSON syntax in initial-users.json

## Customization

### Adding New Users
1. Edit `users/initial-users.json`
2. Run `docker exec mes-keycloak /opt/keycloak/scripts/update-users.sh`

### Modifying Theme
1. Edit files in `themes/mes/`
2. Restart Keycloak: `docker-compose restart keycloak`
3. Clear browser cache

### Updating Realm Configuration
1. Make changes in Keycloak Admin Console
2. Export realm: `docker exec mes-keycloak /opt/keycloak/scripts/backup-realm.sh`
3. Copy backup to `realms/mes-realm.json`