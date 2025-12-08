import fs from 'fs';
import path from 'path';

// Conteúdo correto do schema
const schemaContent = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id           Int    @id @default(autoincrement())
  email        String @unique
  passwordHash String
}

model Title {
  id          Int    @id @default(autoincrement())
  name        String
  description String
  coverUrl    String
  hlsPath     String
  duration    Int
}

model Progress {
  id       Int @id @default(autoincrement())
  userId   Int
  titleId  Int
  position Int
  @@unique([userId, titleId])
}
`;

// Cria a pasta prisma se não existir
if (!fs.existsSync('prisma')) {
    fs.mkdirSync('prisma');
    console.log('Pasta prisma criada.');
}

// Cria o arquivo schema.prisma
fs.writeFileSync('prisma/schema.prisma', schemaContent);
console.log('Arquivo prisma/schema.prisma criado com sucesso!');