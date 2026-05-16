#!/bin/bash

# 1. Run Migrations
echo "🚀 Running Database Migrations..."
python manage.py migrate --noinput
python manage.py init_admin
mkdir -p logs
touch logs/audit.log
chmod -R 666 logs/

# 2. Handle SSL with Certbot
SUBDOMAIN="carestream-cloud"
DOMAIN="$SUBDOMAIN.duckdns.org"
EMAIL="sreenandpk3@gmail.com"
TOKEN="65dae4c9-1260-4568-8da8-7e4764db41fb"

echo "🌐 Fetching Public IP..."
PUBLIC_IP=$(curl -s https://checkip.amazonaws.com)
echo "🦆 Updating DuckDNS for $DOMAIN with IP $PUBLIC_IP..."
curl -v "https://www.duckdns.org/update?domains=$SUBDOMAIN&token=$TOKEN&ip=$PUBLIC_IP"

echo "⏳ Waiting 60 seconds for DNS propagation..."
sleep 60

# Create dummy certificates if they don't exist
mkdir -p /etc/letsencrypt/live/$DOMAIN
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "⚠️ Generating dummy certificates..."
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
        -out "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
        -subj "/CN=localhost"
fi

# Attempt to get real certificate with Retries
MAX_RETRIES=5
RETRY_COUNT=0
SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "📜 Attempting to issue real certificate (Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
    
    service nginx stop
    pkill -9 nginx || true
    echo "⌛ Waiting for Port 80 to release..."
    sleep 5

    # 🛡️ SMART CERTBOT: Only remove if we don't have a valid fullchain yet
    if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ] || [ -f "/etc/letsencrypt/live/$DOMAIN/privkey.pem" -a "$(openssl x509 -noout -issuer -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem 2>/dev/null | grep -c "localhost")" -eq 1 ]; then
        echo "🧹 Clearing dummy/old lineage to prepare for real certificate..."
        rm -rf /etc/letsencrypt/live/$DOMAIN
        rm -rf /etc/letsencrypt/archive/$DOMAIN
        rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf
    fi

    certbot certonly --standalone \
        -d $DOMAIN \
        --cert-name $DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        --force-renewal
    
    if [ $? -eq 0 ]; then
        SUCCESS=true
        echo "✅ Certbot succeeded!"
        break
    else
        echo "⚠️ Certbot failed. This is usually due to DNS propagation delay."
        # Restore dummy certs if Certbot wiped them
        if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
             echo "♻️ Restoring fallback certificates..."
             mkdir -p /etc/letsencrypt/live/$DOMAIN
             openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
                -keyout "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
                -out "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
                -subj "/CN=localhost"
        fi
        echo "⏳ Waiting 90s before retrying (Attempt $((RETRY_COUNT + 1)) finished)..."
        RETRY_COUNT=$((RETRY_COUNT + 1))
        sleep 90
    fi
done

if [ "$SUCCESS" = false ]; then
    echo "❌ All Certbot attempts failed. Using dummies for now. The site will show 'Not Secure' but will function."
fi

# 3. Start Nginx (FORCE RELOAD)
echo "🌐 Forcing Nginx to pick up Real SSL Certificates..."
nginx -t
pkill -9 nginx || true
service nginx start

# 4. Start Celery (Worker + Beat)
echo "⚙️ Starting Background Workers..."
celery -A config worker -l info --pool=solo &
celery -A config beat -l info &

# 5. Start Daphne (Main App)
echo "🚀 Starting Daphne Server on Port 8000..."
exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
