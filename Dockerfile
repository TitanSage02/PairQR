FROM node:20-slim
WORKDIR /app

# Copy project files
COPY package.json package-lock.json* ./
COPY tsconfig.json drizzle.config.ts ./
COPY shared ./shared
COPY server ./server
COPY scripts ./scripts

# Install dependencies 
RUN npm cache clean --force
RUN rm -rf node_modules package-lock.json
RUN npm install --legacy-peer-deps

# Build server
RUN npm run build:server


ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

RUN chmod +x ./scripts/start.sh
CMD ["./scripts/start.sh"]
