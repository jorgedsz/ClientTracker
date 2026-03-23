FROM node:18-slim

# Install Chromium dependencies for whatsapp-web.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libglib2.0-0 \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    libxshmfence1 \
    libdrm2 \
    libxkbcommon0 \
    fonts-liberation \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Tell puppeteer to use system chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install server dependencies
COPY server/package*.json server/
RUN cd server && npm install

# Install client dependencies
COPY client/package*.json client/
RUN cd client && npm install

# Copy all source code
COPY . .

# Generate Prisma client
RUN cd server && npx prisma generate

# Build frontend
RUN cd client && npm run build

EXPOSE ${PORT:-5001}

CMD cd server && npx prisma migrate deploy && node src/index.js
