# URL Rewrite Configuration

Since this is a React SPA (Single Page Application), URL rewriting needs to be handled at the server level and through React Router configuration.

## 1. Apache .htaccess (if using Apache server)

Create a `.htaccess` file in your `public` directory:

```apache
RewriteEngine On

# Handle client-side routing for React SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Optional: Redirect old URLs to new SEO-friendly ones
RewriteRule ^event/([a-f0-9-]{36})$ /event/$1 [R=301,L]
RewriteRule ^venue/(.+)$ /venue/$1 [R=301,L]
RewriteRule ^user/([a-f0-9-]{36})$ /user/$1 [R=301,L]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Enable browser caching
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

## 2. Nginx Configuration (if using Nginx)

Add to your Nginx server block:

```nginx
server {
    listen 80;
    server_name portland.events www.portland.events;
    root /var/www/portland.events;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Browser caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

## 3. Vite Build Configuration

The app is already configured with React Router for client-side routing. The SEO-friendly URLs are now implemented with:

- Events: `/event/event-title-slug-id`
- Venues: `/venue/venue-name-slug-id` 
- Users: `/user/user-name-slug-id`

These URLs are automatically generated using the `createEventUrl`, `createVenueUrl`, and `createUserUrl` functions in `/src/lib/seo.ts`.

## 4. Deployment Considerations

### Netlify
Add a `_redirects` file to your `public` directory:
```
/*    /index.html   200
```

### Vercel
The `vercel.json` configuration:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### GitHub Pages
GitHub Pages doesn't support server-side rewrites, so you'd need to use hash routing or deploy elsewhere.

The React app now handles:
- SEO-friendly URL generation
- Legacy URL support (old IDs still work)
- Proper meta tag updates for social sharing
- Mobile-optimized responsive design