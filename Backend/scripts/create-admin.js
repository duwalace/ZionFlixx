import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'eduardowalace2@gmail.com';
    const password = '123456';

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Se existe, atualizar para admin
      const passwordHash = await bcrypt.hash(password, 10);
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          role: 'admin'
        },
        select: {
          id: true,
          email: true,
          role: true
        }
      });
      console.log('✅ Usuário atualizado para admin:', updatedUser);
    } else {
      // Criar novo usuário admin
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'admin'
        },
        select: {
          id: true,
          email: true,
          role: true
        }
      });
      console.log('✅ Usuário admin criado com sucesso:', user);
    }
  } catch (error) {
    console.error('❌ Erro ao criar/atualizar admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

