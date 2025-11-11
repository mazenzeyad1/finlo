# --- Frontend (Angular + Vite) ---
FROM node:20-alpine

WORKDIR /app

# Copy ONLY package.json first to avoid stale lock pinning old vite
COPY package.json ./
RUN npm install --no-audit --no-fund

# Now copy the rest of the source
COPY . .

EXPOSE 4200
CMD ["npm", "start"]
