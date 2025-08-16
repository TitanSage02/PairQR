FROM node:20-slim
WORKDIR /app

# Copy shared dependencies first
COPY shared ./shared
COPY scripts ./scripts

# Copy server files
COPY server/package*.json ./
COPY server/tsconfig.json ./
COPY server/*.ts ./

# Install dependencies 
RUN npm cache clean --force
RUN rm -rf node_modules package-lock.json
RUN npm install --legacy-peer-deps

# Build server
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

RUN chmod +x ./scripts/start.sh
CMD ["./scripts/start.sh"]
