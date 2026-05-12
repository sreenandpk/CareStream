# Stage 1: Building the code
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build the Next.js app
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api/
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Stage 2: Running the code
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV production
# 🚀 PERFORMANCE: Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# 🌐 NETWORK: Accept connections from outside the container
ENV HOSTNAME "0.0.0.0"
ENV PORT 3000

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Port for Next.js
EXPOSE 3000

# Next.js standalone server
CMD ["node", "server.js"]
