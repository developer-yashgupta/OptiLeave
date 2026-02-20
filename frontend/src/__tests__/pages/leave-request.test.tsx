import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeaveRequestPage from '@/app/leave/request/page';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api-client');

jest.mock('@/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('LeaveRequestPage', () => {
  const mockPush = jest.fn();
  const mockBalance = {
    id: '1',
    userId: 'user-1',
    annual: 20,
    sick: 10,
    maternity: 90,
    paternity: 10,
    bereavement: 5,
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    mockedApiClient.get = jest.fn().mockResolvedValue({ data: mockBalance });
    mockedApiClient.post = jest.fn().mockResolvedValue({ data: {} });
  });

  describe('Page Rendering', () => {
    it('should render page title and description', async () => {
      render(<LeaveRequestPage />);

      await waitFor(() => {
        expect(screen.getByText('Request Leave')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Submit a new leave request. Your manager will be notified for approval./i)
      ).toBeInTheDocument();
    });

    it('should show loading state while fetching balance', () => {
      render(<LeaveRequestPage />);

      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });

    it('should fetch and display leave balance', async () => {
      render(<LeaveRequestPage />);

      await waitFor(() => {
        expect(mockedApiClient.get).toHaveBeenCalledWith('/api/leave/balance');
      });

      await waitFor(() => {
        expect(screen.getByText('20 days')).toBeInTheDocument();
      });
    });

    it('should show error message if balance fetch fails', async () => {
      mockedApiClient.get = jest.fn().mockRejectedValue(new Error('Network error'));

      render(<LeaveRequestPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load leave balance/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit leave request successfully', async () => {
      render(<LeaveRequestPage />);

      // Wait for balance to load
      await waitFor(() => {
        expect(screen.getByText('20 days')).toBeInTheDocument();
      });

      // Fill form
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const reasonInput = screen.getByLabelText(/reason/i);
      const submitButton = screen.getByRole('button', { name: /submit leave request/i });

      fireEvent.change(startDateInput, { target: { value: '2025-03-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-03-05' } });
      fireEvent.change(reasonInput, { target: { value: 'Family vacation' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedApiClient.post).toHaveBeenCalledWith('/api/leave/request', {
          leaveType: 'ANNUAL',
          startDate: '2025-03-01',
          endDate: '2025-03-05',
          reason: 'Family vacation',
        });
      });
    });

    it('should show success message after submission', async () => {
      render(<LeaveRequestPage />);

      await waitFor(() => {
        expect(screen.getByText('20 days')).toBeInTheDocument();
      });

      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const reasonInput = screen.getByLabelText(/reason/i);
      const submitButton = screen.getByRole('button', { name: /submit leave request/i });

      fireEvent.change(startDateInput, { target: { value: '2025-03-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-03-05' } });
      fireEvent.change(reasonInput, { target: { value: 'Family vacation' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Leave request submitted successfully!/i)).toBeInTheDocument();
      });
    });

    it('should redirect to history page after successful submission', async () => {
      jest.useFakeTimers();

      render(<LeaveRequestPage />);

      await waitFor(() => {
        expect(screen.getByText('20 days')).toBeInTheDocument();
      });

      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const reasonInput = screen.getByLabelText(/reason/i);
      const submitButton = screen.getByRole('button', { name: /submit leave request/i });

      fireEvent.change(startDateInput, { target: { value: '2025-03-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-03-05' } });
      fireEvent.change(reasonInput, { target: { value: 'Family vacation' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Leave request submitted successfully!/i)).toBeInTheDocument();
      });

      // Fast-forward time
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/leave/history');
      });

      jest.useRealTimers();
    });

    it('should show error message on submission failure', async () => {
      mockedApiClient.post = jest.fn().mockRejectedValue({
        response: { data: { error: 'Insufficient leave balance' } },
      });

      render(<LeaveRequestPage />);

      await waitFor(() => {
        expect(screen.getByText('20 days')).toBeInTheDocument();
      });

      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const reasonInput = screen.getByLabelText(/reason/i);
      const submitButton = screen.getByRole('button', { name: /submit leave request/i });

      fireEvent.change(startDateInput, { target: { value: '2025-03-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-03-05' } });
      fireEvent.change(reasonInput, { target: { value: 'Family vacation' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Insufficient leave balance/i)).toBeInTheDocument();
      });
    });

    it('should refresh balance after successful submission', async () => {
      const updatedBalance = { ...mockBalance, annual: 15 };
      mockedApiClient.get = jest
        .fn()
        .mockResolvedValueOnce({ data: mockBalance })
        .mockResolvedValueOnce({ data: updatedBalance });

      render(<LeaveRequestPage />);

      await waitFor(() => {
        expect(screen.getByText('20 days')).toBeInTheDocument();
      });

      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const reasonInput = screen.getByLabelText(/reason/i);
      const submitButton = screen.getByRole('button', { name: /submit leave request/i });

      fireEvent.change(startDateInput, { target: { value: '2025-03-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-03-05' } });
      fireEvent.change(reasonInput, { target: { value: 'Family vacation' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedApiClient.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Navigation', () => {
    it('should have back to dashboard button', async () => {
      render(<LeaveRequestPage />);

      await waitFor(() => {
        expect(screen.getByText('20 days')).toBeInTheDocument();
      });

      const backButton = screen.getByText(/Back to Dashboard/i);
      expect(backButton).toBeInTheDocument();

      fireEvent.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
