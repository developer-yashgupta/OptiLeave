import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm';
import { LeaveBalance } from '@/types/leave';

describe('LeaveRequestForm', () => {
  const mockOnSubmit = jest.fn();
  const mockBalance: LeaveBalance = {
    annual: 20,
    sick: 10,
    maternity: 90,
    paternity: 10,
    bereavement: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<LeaveRequestForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/leave type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit leave request/i })).toBeInTheDocument();
    });

    it('should render leave type options', () => {
      render(<LeaveRequestForm onSubmit={mockOnSubmit} />);

      const select = screen.getByLabelText(/leave type/i) as HTMLSelectElement;
      const options = Array.from(select.options).map((opt) => opt.value);

      expect(options).toContain('ANNUAL');
      expect(options).toContain('SICK');
      expect(options).toContain('MATERNITY');
      expect(options).toContain('PATERNITY');
      expect(options).toContain('BEREAVEMENT');
    });

    it('should display leave balance when provided', () => {
      render(<LeaveRequestForm onSubmit={mockOnSubmit} balance={mockBalance} />);

      expect(screen.getByText(/available balance/i)).toBeInTheDocument();
      expect(screen.getByText('20 days')).toBeInTheDocument(); // Default is ANNUAL
    });

    it('should not display leave balance when not provided', () => {
      render(<LeaveRequestForm onSubmit={mockOnSubmit} />);

      expect(screen.queryByText(/available balance/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require all fields', () => {
      render(<LeaveRequestForm onSubmit={mockOnSubmit} />);

      const leaveTypeInput = screen.getByLabelText(/leave type/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const reasonInput = screen.getByLabelText(/reason/i);

      expect(leaveTypeInput).toHaveAttribute('required');
      expect(startDateInput).toHaveAttribute('required');
      expect(endDateInput).toHaveAttribute('required');
      expect(reasonInput).toHaveAttribute('required');
    });

    it('should show error when end date is before start date', async () => {
      render(<LeaveRequestForm onSubmit={mockOnSubmit} />);

      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const reasonInput = screen.getByLabelText(/reason/i);
      const submitButton = screen.getByRole('button', { name: /submit leave request/i });

      fireEvent.change(startDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-01' } });
      fireEvent.change(reasonInput, { target: { value: 'Test reason' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when reason is empty', async () => {
      render(<LeaveRequestForm onSubmit={mockOnSubmit} />);

      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const reasonInput = screen.getByLabelText(/reason/i);
      const submitButton = screen.getByRole('button', { name: /submit leave request/i });

      // Remove required attribute to test custom validation
      reasonInput.removeAttribute('required');

      fireEvent.change(startDateInput, { target: { value: '2024-12-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-05' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/reason is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear error when field is corrected', async () => {
      render(<LeaveRequestForm onSubmit={mockOnSubmit} />);

      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const reasonInput = screen.getByLabelText(/reason/i);
      const submitButton = screen.getByRole('button', { name: /submit leave request/i });

      // Submit with invalid dates
      fireEvent.change(startDateInput, { target: { value: '2024-12-31' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-01' } });
      fireEvent.change(reasonInput, { target: { value: 'Test reason' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
      });

      // Correct the end date
      fireEvent.change(endDateInput, { target: { value: '2025-01-05' } });

      await waitFor(() => {
        expect(screen.queryByText(/end date must be after start date/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data when valid', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      render(<LeaveRequestForm onSubmit={mockOnSubmit} />);

      const leaveTypeInput = screen.getByLabelText(/leave type/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const reasonInput = screen.getByLabelText(/reason/i);
      const submitButton = screen.getByRole('button', { name: /submit leave request/i });

      fireEvent.change(leaveTypeInput, { target: { value: 'SICK' } });
      fireEvent.change(startDateInput, { target: { value: '2024-12-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-05' } });
      fireEvent.change(reasonInput, { target: { value: 'Medical appointment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          leaveType: 'SICK',
          startDate: '2024-12-01',
          endDate: '2024-12-05',
          reason: 'Medical appointment',
        });
      });
    });

    it('should reset form after successful submission', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      render(<LeaveRequestForm onSubmit={mockOnSubmit} />);

      const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
      const endDateInput = screen.getByLabelText(/end date/i) as HTMLInputElement;
      const reasonInput = screen.getByLabelText(/reason/i) as HTMLTextAreaElement;
      const submitButton = screen.getByRole('button', { name: /submit leave request/i });

      fireEvent.change(startDateInput, { target: { value: '2024-12-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-05' } });
      fireEvent.change(reasonInput, { target: { value: 'Test reason' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      expect(startDateInput.value).toBe('');
      expect(endDateInput.value).toBe('');
      expect(reasonInput.value).toBe('');
    });

    it('should show loading state during submission', async () => {
      render(<LeaveRequestForm onSubmit={mockOnSubmit} isLoading={true} />);

      const submitButton = screen.getByRole('button', { name: /submitting/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Submitting...');
    });

    it('should disable form fields during submission', () => {
      render(<LeaveRequestForm onSubmit={mockOnSubmit} isLoading={true} />);

      const leaveTypeInput = screen.getByLabelText(/leave type/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const reasonInput = screen.getByLabelText(/reason/i);

      expect(leaveTypeInput).toBeDisabled();
      expect(startDateInput).toBeDisabled();
      expect(endDateInput).toBeDisabled();
      expect(reasonInput).toBeDisabled();
    });
  });

  describe('Leave Balance Display', () => {
    it('should update balance display when leave type changes', () => {
      render(<LeaveRequestForm onSubmit={mockOnSubmit} balance={mockBalance} />);

      const leaveTypeInput = screen.getByLabelText(/leave type/i);

      // Default is ANNUAL (20 days)
      expect(screen.getByText('20 days')).toBeInTheDocument();

      // Change to SICK (10 days)
      fireEvent.change(leaveTypeInput, { target: { value: 'SICK' } });
      expect(screen.getByText('10 days')).toBeInTheDocument();

      // Change to MATERNITY (90 days)
      fireEvent.change(leaveTypeInput, { target: { value: 'MATERNITY' } });
      expect(screen.getByText('90 days')).toBeInTheDocument();
    });
  });
});
