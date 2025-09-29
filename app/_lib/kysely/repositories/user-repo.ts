import { db } from '@/app/_lib/kysely'
import type { NewUser, User, UserUpdate } from '@/app/_lib/kysely/types'
import { createId } from '@paralleldrive/cuid2'

// Common projection used across routes
const userSelect = [
  'id',
  'name',
  'email',
  'accessLevel',
  'stripeCustomerId',
  'createdAt',
  'updatedAt',
  'image',
] as const

export async function getUserByEmail(email: string): Promise<Pick<User, typeof userSelect[number]> | null> {
  const row = await db
    .selectFrom('User')
    .select(userSelect as unknown as any)
    .where('email', '=', email)
    .executeTakeFirst()

  return row as any ?? null
}

export async function getUserById(id: string): Promise<User | null> {
  return await db.selectFrom('User').selectAll().where('id', '=', id).executeTakeFirst() ?? null
}

export async function findUserByStripeCustomerId(customerId: string): Promise<User | null> {
  return await db
    .selectFrom('User')
    .selectAll()
    .where('stripeCustomerId', '=', customerId)
    .executeTakeFirst() ?? null
}

export async function createUser(data: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pick<User, typeof userSelect[number]>> {
  const now = new Date()
  const id = createId() // Generate cuid like Prisma does
  
  // SQL Server doesn't support RETURNING, so we insert then select
  await db
    .insertInto('User')
    .values({
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    } as any)
    .execute()

  // Select the created user by id
  const user = await db
    .selectFrom('User')
    .select(userSelect as unknown as any)
    .where('id', '=', id)
    .executeTakeFirst()

  if (!user) {
    throw new Error('Failed to create user')
  }

  return user as any
}

export async function updateUserById(id: string, data: Partial<UserUpdate>): Promise<Pick<User, typeof userSelect[number]>> {
  // SQL Server doesn't support RETURNING, so we update then select
  await db
    .updateTable('User')
    .set({ ...data, updatedAt: new Date() } as any)
    .where('id', '=', id)
    .execute()

  // Select the updated user
  const user = await db
    .selectFrom('User')
    .select(userSelect as unknown as any)
    .where('id', '=', id)
    .executeTakeFirst()

  if (!user) {
    throw new Error('User not found after update')
  }

  return user as any
}

export async function updateUserByEmail(email: string, data: Partial<UserUpdate>): Promise<Pick<User, typeof userSelect[number]>> {
  // SQL Server doesn't support RETURNING, so we update then select
  await db
    .updateTable('User')
    .set({ ...data, updatedAt: new Date() } as any)
    .where('email', '=', email)
    .execute()

  // Select the updated user
  const user = await db
    .selectFrom('User')
    .select(userSelect as unknown as any)
    .where('email', '=', email)
    .executeTakeFirst()

  if (!user) {
    throw new Error('User not found after update')
  }

  return user as any
}

export async function linkStripeIdToUserId(userId: string, stripeCustomerId: string): Promise<void> {
  await db
    .updateTable('User')
    .set({ stripeCustomerId, updatedAt: new Date() })
    .where('id', '=', userId)
    .execute()
}

export async function getUserByEmailAndStripeId(email: string, stripeCustomerId: string): Promise<User | null> {
  return await db
    .selectFrom('User')
    .selectAll()
    .where('email', '=', email)
    .where('stripeCustomerId', '=', stripeCustomerId)
    .executeTakeFirst() ?? null
}

export async function setAccessLevelById(userId: string, accessLevel: string): Promise<void> {
  await db
    .updateTable('User')
    .set({ accessLevel, updatedAt: new Date() })
    .where('id', '=', userId)
    .execute()
}


