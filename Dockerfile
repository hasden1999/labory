FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY apps/web/package*.json ./apps/web/

RUN npm install

COPY apps/server/prisma ./apps/server/prisma
RUN cd apps/server && npx prisma generate

COPY . .

RUN cd apps/server && npx prisma db push && npm run db:seed
RUN npm run build:server
RUN npm run build:web

EXPOSE 8080 8000

ENV PORT=8000
ENV NODE_ENV=production

CMD ["npm", "run", "dev"]
