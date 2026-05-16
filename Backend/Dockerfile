# Stage 1: Build dependencies
FROM python:3.12-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies needed for building
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    netcat-traditional \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies into a local directory
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Final runtime image
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
# 🚀 PATH: Include local bin for --user installs
ENV PATH=/root/.local/bin:$PATH

# Install runtime dependencies + curl
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    nginx \
    certbot \
    python3-certbot-nginx \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Copy project files
COPY . .

# Copy the start script and nginx config
COPY start.sh /app/start.sh
COPY nginx.conf /etc/nginx/sites-available/default

# 🛠️ FIX: Strip Windows line endings (\r) and make executable
RUN apt-get update && apt-get install -y sed && \
    sed -i 's/\r$//' /app/start.sh && \
    chmod +x /app/start.sh

# Ports for Nginx (80, 443) and Daphne (8000)
EXPOSE 80 443 8000

# Launch everything
CMD ["./start.sh"]
