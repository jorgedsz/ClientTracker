FROM node:18-slim

# Install Chromium and all dependencies for whatsapp-web.js
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

# Find and set the actual chromium path
RUN CHROMIUM_PATH=$(which chromium || which chromium-browser || find / -name "chromium" -type f 2>/dev/null | head -1) \
    && echo "CHROMIUM_PATH=$CHROMIUM_PATH" \
    && echo "$CHROMIUM_PATH" > /etc/chromium-path

# Tell puppeteer to skip download and use system chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=""

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

# Read chromium path at runtime and start
CMD export PUPPETEER_EXECUTABLE_PATH=$(cat /etc/chromium-path) && cd server && npx prisma migrate deploy && node src/index.js
