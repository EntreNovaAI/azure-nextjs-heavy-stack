import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/app/_lib/prisma/prisma'
import Stripe from 'stripe'

// Mock dependencies
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}))

vi.mock('@/app/_lib/prisma/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))

// Mock Stripe with a factory function to avoid hoisting issues
vi.mock('stripe', () => {
  const mockSubscriptions = {
    list: vi.fn(),
    update: vi.fn()
  }
  
  return {
    default: vi.fn().mockImplementation(() => ({
      subscriptions: mockSubscriptions
    })),
    errors: {
      StripeError: class StripeError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'StripeError'
        }
      }
    }
  }
})

describe('Unsubscribe API Route', () => {
  let mockRequest: NextRequest
  let mockStripe: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Get the mocked Stripe instance
    mockStripe = new (vi.mocked(Stripe))()
    
    // Create mock request
    mockRequest = {
      json: vi.fn(),
    } as any
  })

  it('returns 401 when user is not authenticated', async () => {
    // Mock no session
    vi.mocked(getServerSession).mockResolvedValue(null)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('returns 401 when session has no email', async () => {
    // Mock session without email
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Test User' }
    } as any)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('returns 400 for invalid Stripe customer ID', async () => {
    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any)

    // Mock invalid request body
    vi.mocked(mockRequest.json).mockResolvedValue({
      stripeCustomerId: 'invalid_id'
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid Stripe customer ID')
  })

  it('returns 403 when customer ID does not belong to user', async () => {
    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any)

    // Mock request body
    vi.mocked(mockRequest.json).mockResolvedValue({
      stripeCustomerId: 'cus_test123'
    })

    // Mock user not found with this customer ID
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Unauthorized: Customer ID does not match authenticated user')
  })

  it('returns 400 when user is already on free plan', async () => {
    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any)

    // Mock request body
    vi.mocked(mockRequest.json).mockResolvedValue({
      stripeCustomerId: 'cus_test123'
    })

    // Mock user found but already on free plan
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      accessLevel: 'free',
      stripeCustomerId: 'cus_test123'
    } as any)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('You are already on the free plan')
  })

  it('successfully unsubscribes user with active subscriptions', async () => {
    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any)

    // Mock request body
    vi.mocked(mockRequest.json).mockResolvedValue({
      stripeCustomerId: 'cus_test123'
    })

    // Mock user found with premium plan
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      accessLevel: 'premium',
      stripeCustomerId: 'cus_test123'
    }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    // Mock active subscriptions
    const mockSubscriptions = {
      data: [
        { id: 'sub_test123' },
        { id: 'sub_test456' }
      ]
    }
    mockStripe.subscriptions.list.mockResolvedValue(mockSubscriptions)

    // Mock subscription cancellation
    mockStripe.subscriptions.update
      .mockResolvedValueOnce({ id: 'sub_test123', cancel_at_period_end: true })
      .mockResolvedValueOnce({ id: 'sub_test456', cancel_at_period_end: true })

    // Mock user update
    const updatedUser = { ...mockUser, accessLevel: 'free' }
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Successfully unsubscribed')
    expect(data.cancelledSubscriptions).toEqual(['sub_test123', 'sub_test456'])
    expect(data.newAccessLevel).toBe('free')

    // Verify Stripe calls
    expect(mockStripe.subscriptions.list).toHaveBeenCalledWith({
      customer: 'cus_test123',
      status: 'active'
    })
    expect(mockStripe.subscriptions.update).toHaveBeenCalledTimes(2)

    // Verify database update
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { 
        accessLevel: 'free',
        updatedAt: expect.any(Date)
      }
    })
  })

  it('updates user to free even when no active subscriptions found', async () => {
    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any)

    // Mock request body
    vi.mocked(mockRequest.json).mockResolvedValue({
      stripeCustomerId: 'cus_test123'
    })

    // Mock user found with basic plan
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      accessLevel: 'basic',
      stripeCustomerId: 'cus_test123'
    }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    // Mock no active subscriptions
    mockStripe.subscriptions.list.mockResolvedValue({ data: [] })

    // Mock user update
    const updatedUser = { ...mockUser, accessLevel: 'free' }
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Successfully unsubscribed')
    expect(data.cancelledSubscriptions).toEqual([])
    expect(data.newAccessLevel).toBe('free')

    // Verify database update still happens
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { 
        accessLevel: 'free',
        updatedAt: expect.any(Date)
      }
    })
  })

  it('handles Stripe errors gracefully', async () => {
    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any)

    // Mock request body
    vi.mocked(mockRequest.json).mockResolvedValue({
      stripeCustomerId: 'cus_test123'
    })

    // Mock user found
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      accessLevel: 'premium',
      stripeCustomerId: 'cus_test123'
    } as any)

    // Mock Stripe error
    const stripeError = new Error('Stripe API error')
    stripeError.name = 'StripeError'
    mockStripe.subscriptions.list.mockRejectedValue(stripeError)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Stripe error occurred')
  })
})
