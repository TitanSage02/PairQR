FROM node:20-slim
WORKDIR /app

# Copy project files
COPY package.json package-lock.json* ./
COPY tsconfig.json drizzle.config.ts ./
COPY shared ./shared
COPY client ./client
COPY server ./server
COPY scripts ./scripts

# Install dependencies 
RUN npm cache clean --force
RUN rm -rf node_modules package-lock.json
RUN npm install --legacy-peer-deps

# Build client and server
RUN npm run build

# Reduce to production deps
# Keep dev deps for drizzle-kit migrations at container start

ENV NODE_ENV=production
ENV PORT=9000
EXPOSE 9000

RUN chmod +x ./scripts/start.sh
CMD ["./scripts/start.sh"]
