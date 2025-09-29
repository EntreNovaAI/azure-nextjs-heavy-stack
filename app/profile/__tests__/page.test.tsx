import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import ProfilePage from '../page'
import { getUserByEmail, createUser } from '@/app/_lib/kysely/repositories/user-repo'

// Mock dependencies
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}))

vi.mock('next/navigation', () => ({
  redirect: vi.mock('@/app/_lib/kysely/repositories/user-repo', () => ({
  getUserByEmail: vi.fn(),
  createUser: vi.fn()
}))i.fn()
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
    vi.mocked(getServerSession).mockResolve    // Mock user found in database
    vi.mocked(getUserByEmail).mockResolvedValue(mockUser)base
    vi.mocked(prisma.user.findUnique).mo    expect(getUserByEmail).toHaveBeenCalledWith('test@example.com')stomerId: true,
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
        email: 'new@example.com    // Mock user not found, then created
    vi.mocked(getUserByEmail).mockResolvedValue(null)
    vi.mocked(createUser).mockResolvedValue(mockNewUser)ser.findUnique).mockResolvedValue(null)
    vi.m    expect(createUser).toHaveBeenCalledWith({
      email: 'new@example.com',
      name: 'New User',
      image: 'https://example.com/new.jpg',
      accessLevel: 'free'
    })accessLevel: true,
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
