import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import ProfilePage from '../page'
import { prisma } from '@/app/_lib/prisma/prisma'

// Mock dependencies
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

vi.mock('@/app/_lib/prisma/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))

vi.mock('../profile-client', () => ({
  ProfileClient: ({ user }: any) => (
    <div data-testid="profile-client">
      <span data-testid="user-email">{user.email}</span>
      <span data-testid="user-access-level">{user.accessLevel}</span>
    </div>
  )
}))

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to home when user is not authenticated', async () => {
    // Mock no session
    vi.mocked(getServerSession).mockResolvedValue(null)

    await ProfilePage()

    expect(redirect).toHaveBeenCalledWith('/')
  })

  it('redirects to home when session has no email', async () => {
    // Mock session without email
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Test User' }
    } as any)

    await ProfilePage()

    expect(redirect).toHaveBeenCalledWith('/')
  })

  it('renders profile with existing user data', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: new Date('2023-01-01'),
      image: 'https://example.com/image.jpg',
      accessLevel: 'premium',
      stripeCustomerId: 'cus_test123',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02')
    }

    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any)

    // Mock user found in database
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

    const result = await ProfilePage()

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        accessLevel: true,
        stripeCustomerId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Render the result to test the component
    render(result)
    
    expect(screen.getByTestId('profile-client')).toBeDefined()
    expect(screen.getByTestId('user-email').textContent).toBe('test@example.com')
    expect(screen.getByTestId('user-access-level').textContent).toBe('premium')
  })

  it('creates new user when not found in database', async () => {
    const mockNewUser = {
      id: '2',
      name: 'New User',
      email: 'new@example.com',
      emailVerified: null,
      image: 'https://example.com/new.jpg',
      accessLevel: 'free',
      stripeCustomerId: null,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }

    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { 
        email: 'new@example.com',
        name: 'New User',
        image: 'https://example.com/new.jpg'
      }
    } as any)

    // Mock user not found, then created
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(mockNewUser)

    const result = await ProfilePage()

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'new@example.com',
        name: 'New User',
        image: 'https://example.com/new.jpg',
        accessLevel: 'free'
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        accessLevel: true,
        stripeCustomerId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Render the result to test the component
    render(result)
    
    expect(screen.getByTestId('profile-client')).toBeDefined()
    expect(screen.getByTestId('user-email').textContent).toBe('new@example.com')
    expect(screen.getByTestId('user-access-level').textContent).toBe('free')
  })
})
