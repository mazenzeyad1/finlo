# --- Backend (NestJS + Prisma) ---
# Use Debian-based image to ensure Prisma engine dependencies (OpenSSL, libc) are available
FROM node:20

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install --silent || true

# Copy the rest
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "start:dev"]
