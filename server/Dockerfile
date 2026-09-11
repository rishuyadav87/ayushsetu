FROM node:20-slim

# Install OpenSSL and CA certificates needed by Prisma Query Engine
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma Client for the system
RUN npx prisma generate

EXPOSE 5000

CMD ["sh", "-c", "node src/initDb.js && npx prisma db push --skip-generate && node prisma/seed.js && node src/app.js"]
