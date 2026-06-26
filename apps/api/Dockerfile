# Build stage
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci

COPY . .

RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

# Production stage
FROM node:18-alpine AS runner

RUN apk add --no-cache openssl1.1-compat

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci --only=production
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY --from=builder /usr/src/app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist
COPY --from=builder /usr/src/app/apps/api/prisma ./apps/api/prisma

EXPOSE 8000

CMD [ "npm", "start", "--workspace=apps/api" ]
