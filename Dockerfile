FROM node:20-slim

# Install yt-dlp and its dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source
COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "run", "start"]
