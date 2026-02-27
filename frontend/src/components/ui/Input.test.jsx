import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Input from './Input';

describe('Input', () => {
	it('renders an <input> element', () => {
		render(<Input />);
		expect(screen.getByRole('textbox')).toBeInTheDocument();
	});

	it('renders a label when the label prop is provided', () => {
		render(<Input label="Email" />);
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByText('Email')).toBeInTheDocument();
	});

	it('associates the label with the input via htmlFor / id', () => {
		render(<Input label="Username" />);
		const input = screen.getByRole('textbox');
		expect(input).toHaveAttribute('id', 'username');
	});

	it('uses the explicit id prop over the derived label id', () => {
		render(<Input label="Username" id="custom-id" />);
		expect(screen.getByRole('textbox')).toHaveAttribute('id', 'custom-id');
	});

	it('renders an error message when the error prop is provided', () => {
		render(<Input error="This field is required" />);
		expect(screen.getByText('This field is required')).toBeInTheDocument();
	});

	it('applies error class to the wrapper when error is present', () => {
		const { container } = render(<Input error="bad" />);
		expect(container.firstChild).toHaveClass('input-group--error');
	});

	it('does not render an error element when error prop is absent', () => {
		render(<Input />);
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('renders a suffix element', () => {
		render(<Input suffix={<button data-testid="suffix-btn">Go</button>} />);
		expect(screen.getByTestId('suffix-btn')).toBeInTheDocument();
	});

	it('forwards value and onChange to the underlying input', async () => {
		const user = userEvent.setup();
		const handleChange = vi.fn();
		render(<Input value="" onChange={handleChange} />);
		await user.type(screen.getByRole('textbox'), 'hello');
		expect(handleChange).toHaveBeenCalled();
	});

	it('forwards extra props (placeholder, type) to the input element', () => {
		render(<Input placeholder="Enter text" type="email" />);
		const input = screen.getByRole('textbox');
		expect(input).toHaveAttribute('placeholder', 'Enter text');
		expect(input).toHaveAttribute('type', 'email');
	});

	it('forwards a ref to the underlying input element', () => {
		const ref = createRef();
		render(<Input ref={ref} />);
		expect(ref.current).toBeInstanceOf(HTMLInputElement);
	});

	it('merges a custom className on the wrapper', () => {
		const { container } = render(<Input className="extra" />);
		expect(container.firstChild).toHaveClass('extra');
	});

	it('does not render a label element when label prop is absent', () => {
		render(<Input placeholder="no label" />);
		expect(screen.queryByRole('label')).not.toBeInTheDocument();
	});
});
