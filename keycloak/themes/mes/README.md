# Unimore MES Keycloak Theme

## Overview

Custom Keycloak theme for the Manufacturing Execution System based on the Unimore Trading design system.

## Design Features

### Color Palette
- **Primary**: Ocean Blue (#056389)
- **Secondary**: Deep Navy (#00253a)
- **Accent**: Light Blue (#0678a7)
- **Background**: Off-white (#F5FBFE)

### Typography
- **Font**: Poppins (Google Fonts)
- **Letter Spacing**: 0.025em for body text (1.5px at 16px)
- **Font Weights**: 300-700

### Visual Elements
- Gradient backgrounds (Navy to Blue)
- Custom shadows using Navy color
- Smooth animations and transitions
- Hover effects with lift animation
- Ripple effect on buttons
- Custom "U" logo icon

## Theme Structure

```
mes/
├── login/
│   ├── resources/
│   │   └── css/
│   │       └── login.css      # Main styles with Unimore design
│   ├── messages/
│   │   └── messages_en.properties  # Custom text/labels
│   ├── login.ftl              # Login page template
│   └── theme.properties       # Theme configuration
└── README.md
```

## Key Features

### Login Page
- Clean, modern card design with top accent bar
- Animated form fields with slide-up effect
- Custom styled inputs with hover/focus states
- Primary button with Unimore blue gradient
- Animated underlines on links
- Responsive design for mobile/tablet

### Accessibility
- High contrast colors (WCAG AA compliant)
- Focus indicators on all interactive elements
- Proper ARIA labels
- Keyboard navigation support

### Animations
- Fade-in effect for login card
- Slide-up animation for form fields
- Button hover lift effect
- Ripple effect on button click
- Smooth transitions (300ms cubic-bezier)

## Installation

1. Theme files are automatically mounted via Docker:
```yaml
volumes:
  - ./keycloak/themes/mes:/opt/keycloak/themes/mes:ro
```

2. Restart Keycloak to apply changes:
```bash
docker-compose restart keycloak
```

## Configuration

### To use the theme:

1. Access Keycloak Admin Console: http://localhost:8080
2. Navigate to Realm Settings > Themes
3. Set Login Theme to "mes"
4. Save changes

### To customize:

1. Edit CSS in `resources/css/login.css`
2. Update messages in `messages/messages_en.properties`
3. Modify templates in `*.ftl` files
4. Restart Keycloak to see changes

## CSS Variables

The theme uses CSS custom properties for easy customization:

```css
/* Brand Colors */
--unimore-navy: #00253a;
--unimore-blue: #056389;
--unimore-blue-light: #0678a7;
--unimore-white-off: #F5FBFE;

/* Shadows */
--shadow-md: 0 4px 6px -1px rgba(0, 37, 58, 0.1);
--shadow-hover: 0 10px 20px rgba(5, 99, 137, 0.2);
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome)

## Development Tips

### Testing Changes
1. Make CSS changes in `login.css`
2. Clear browser cache (Ctrl+Shift+R)
3. Refresh login page

### Debug Mode
Add `?debug=true` to URL to see additional information

### Custom Messages
Edit `messages_en.properties` to change text labels

## Responsive Breakpoints

- Mobile: < 480px
- Tablet: 481px - 768px
- Desktop: > 768px

## Known Issues

- Clear browser cache after theme updates
- Some Keycloak default styles may override custom styles
- Theme caching may require container restart

## Resources

- [Keycloak Theme Documentation](https://www.keycloak.org/docs/latest/server_development/#_themes)
- [Unimore Design System](../../../frontend/DESIGN_SYSTEM.md)
- [Poppins Font](https://fonts.google.com/specimen/Poppins)