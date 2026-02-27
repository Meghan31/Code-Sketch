import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
	it('renders children as label text', () => {
		render(<Button>Click me</Button>);
		expect(screen.getByText('Click me')).toBeInTheDocument();
	});

	it('renders as a <button> element', () => {
		render(<Button>Submit</Button>);
		expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
	});

	it('applies the primary variant class by default', () => {
		render(<Button>Primary</Button>);
		expect(screen.getByRole('button')).toHaveClass('btn--primary');
	});

	it('applies a custom variant class', () => {
		render(<Button variant="secondary">Secondary</Button>);
		expect(screen.getByRole('button')).toHaveClass('btn--secondary');
	});

	it('applies size class', () => {
		render(<Button size="sm">Small</Button>);
		expect(screen.getByRole('button')).toHaveClass('btn--sm');
	});

	it('calls onClick handler when clicked', async () => {
		const user = userEvent.setup();
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click</Button>);
		await user.click(screen.getByRole('button'));
		expect(handleClick).toHaveBeenCalledOnce();
	});

	it('is disabled when the disabled prop is true', () => {
		render(<Button disabled>Disabled</Button>);
		expect(screen.getByRole('button')).toBeDisabled();
	});

	it('does not call onClick when disabled', async () => {
		const user = userEvent.setup();
		const handleClick = vi.fn();
		render(
			<Button disabled onClick={handleClick}>
				Disabled
			</Button>,
		);
		await user.click(screen.getByRole('button'));
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('shows a spinner icon and is disabled when loading', () => {
		render(<Button loading>Save</Button>);
		const btn = screen.getByRole('button');
		expect(btn).toBeDisabled();
		expect(btn).toHaveClass('btn--loading');
	});

	it('hides iconLeft when loading', () => {
		const icon = <span data-testid="left-icon" />;
		render(<Button loading iconLeft={icon}>Load</Button>);
		expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
	});

	it('renders iconLeft when not loading', () => {
		const icon = <span data-testid="left-icon" />;
		render(<Button iconLeft={icon}>With Icon</Button>);
		expect(screen.getByTestId('left-icon')).toBeInTheDocument();
	});

	it('renders iconRight when not loading', () => {
		const icon = <span data-testid="right-icon" />;
		render(<Button iconRight={icon}>With Icon</Button>);
		expect(screen.getByTestId('right-icon')).toBeInTheDocument();
	});

	it('hides iconRight when loading', () => {
		const icon = <span data-testid="right-icon" />;
		render(<Button loading iconRight={icon}>Load</Button>);
		expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
	});

	it('forwards extra props to the underlying button', () => {
		render(<Button type="submit" data-testid="my-btn">Go</Button>);
		expect(screen.getByTestId('my-btn')).toHaveAttribute('type', 'submit');
	});

	it('merges custom className', () => {
		render(<Button className="custom-class">Styled</Button>);
		expect(screen.getByRole('button')).toHaveClass('custom-class');
	});
});
