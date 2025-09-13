# Keycloak Theme Testing Guide

## Access URLs

### Admin Console
- URL: http://localhost:8080/admin
- Default admin: admin / admin

### Login Page (Master Realm)
- URL: http://localhost:8080/realms/master/account
- This will redirect to the login page

## How to Apply the Theme

1. **Access Admin Console**
   ```
   http://localhost:8080/admin
   Username: admin
   Password: admin
   ```

2. **Navigate to Realm Settings**
   - Select the realm (e.g., "master" or create a new one)
   - Go to "Realm Settings" in the left menu
   - Click on "Themes" tab

3. **Apply the MES Theme**
   - Find "Login Theme" dropdown
   - Select "mes" from the list
   - Click "Save"

4. **Test the Theme**
   - Log out from admin console
   - Visit: http://localhost:8080/realms/master/account
   - You should see the login page with:
     - Unimore colors (Ocean Blue #056389, Deep Navy #00253a)
     - Poppins font
     - Gradient background
     - Custom styled form inputs
     - Blue primary button
     - Smooth animations

## Theme Features to Test

### Visual Elements
- [ ] Gradient background (Navy to Blue)
- [ ] White card with top blue accent bar
- [ ] Poppins font loading correctly
- [ ] Custom "U" logo (if visible)
- [ ] Proper spacing and padding

### Form Elements
- [ ] Input fields with border on focus (blue)
- [ ] Hover effects on inputs
- [ ] Button with blue background
- [ ] Button hover lift effect
- [ ] Checkbox styling

### Animations
- [ ] Card fade-in on load
- [ ] Form fields slide-up animation
- [ ] Button hover effects
- [ ] Link underline animation on hover

### Responsive Design
- [ ] Mobile view (< 480px)
- [ ] Tablet view (481-768px)
- [ ] Desktop view (> 768px)

## Troubleshooting

### Theme Not Showing
1. Clear browser cache (Ctrl+Shift+R)
2. Check Docker logs: `docker logs mes-keycloak`
3. Restart Keycloak: `docker-compose restart keycloak`
4. Verify theme files are mounted: `docker exec mes-keycloak ls /opt/keycloak/themes/mes`

### CSS Not Loading
1. Check browser console for 404 errors
2. Verify CSS file path in theme
3. Clear browser cache
4. Try incognito/private mode

### Font Not Loading
- Google Fonts import is in the CSS file
- Internet connection required for Poppins font
- Falls back to system fonts if unavailable

## Quick Commands

```bash
# Restart Keycloak
docker-compose restart keycloak

# View logs
docker logs mes-keycloak --tail 50

# Check theme files in container
docker exec mes-keycloak ls -la /opt/keycloak/themes/mes/

# Test login page is accessible
curl -I http://localhost:8080/realms/master/account
```

## Development Workflow

1. Edit CSS file: `keycloak/themes/mes/login/resources/css/login.css`
2. Restart Keycloak: `docker-compose restart keycloak`
3. Clear browser cache
4. Refresh login page

## Known Limitations

- Custom FTL templates may conflict with Keycloak updates
- Currently using parent theme templates with custom CSS
- Some Keycloak default styles may override custom styles
- Theme caching requires container restart for changes