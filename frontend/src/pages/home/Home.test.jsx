import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../context/AuthContext', () => ({
	useAuth: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
	default: { error: vi.fn(), success: vi.fn() },
}));

// uuid — return predictable IDs
vi.mock('uuid', () => ({
	v4: vi.fn().mockReturnValue('test-room-uuid-1234'),
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Home from './Home';

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
	const actual = await vi.importActual('react-router-dom');
	return { ...actual, useNavigate: vi.fn() };
});

const renderHome = (locationState = {}) =>
	render(
		<MemoryRouter initialEntries={[{ pathname: '/', state: locationState }]}>
			<Home />
		</MemoryRouter>,
	);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Home page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useNavigate.mockReturnValue(mockNavigate);
		useAuth.mockReturnValue({
			user: {
				email: 'test@example.com',
				user_metadata: { full_name: 'Test User' },
			},
			signOut: vi.fn(),
		});
		// Mock clipboard — configurable:true lets @testing-library/user-event redefine it
		Object.defineProperty(navigator, 'clipboard', {
			writable: true,
			configurable: true,
			value: { writeText: vi.fn().mockResolvedValue(undefined) },
		});
		// Mock fetch (not called unless joinRoom is triggered with a UUID)
		globalThis.fetch = vi.fn();
	});

	it("displays the user's email in the header", () => {
		renderHome();
		expect(screen.getByText('test@example.com')).toBeInTheDocument();
	});

	it('pre-populates the name field with the user full_name', () => {
		renderHome();
		expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
	});

	it('renders the CodeSketch brand heading', () => {
		renderHome();
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
	});

	it('renders the "Create New Room" button', () => {
		renderHome();
		expect(
			screen.getByRole('button', { name: /create new room/i }),
		).toBeInTheDocument();
	});

	it('shows a toast from location state on mount', async () => {
		renderHome({ toastMessage: 'You were redirected' });
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('You were redirected');
		});
	});

	it('shows an error toast when creating a room with a short username', async () => {
		const user = userEvent.setup();
		renderHome();
		const nameInput = screen.getByPlaceholderText('Enter your name');
		await user.clear(nameInput);
		await user.type(nameInput, 'a');
		await user.click(screen.getByRole('button', { name: /create new room/i }));
		expect(toast.error).toHaveBeenCalledWith(
			'Please enter your name (at least 2 characters)',
		);
	});

	it('navigates to /editor/:id when creating a room with a valid username', async () => {
		const user = userEvent.setup();
		renderHome();
		await user.click(screen.getByRole('button', { name: /create new room/i }));
		expect(mockNavigate).toHaveBeenCalledWith('/editor/test-room-uuid-1234', {
			state: { username: 'Test User' },
		});
	});

	it('shows "Join Room" button only after a room ID is typed', async () => {
		const user = userEvent.setup();
		renderHome();
		expect(screen.queryByRole('button', { name: /join room/i })).not.toBeInTheDocument();
		await user.type(
			screen.getByPlaceholderText(/paste a room id/i),
			'550e8400-e29b-41d4-a716-446655440000',
		);
		expect(
			screen.getByRole('button', { name: /join room/i }),
		).toBeInTheDocument();
	});

	it('shows an error toast for an invalid UUID when joining', async () => {
		const user = userEvent.setup();
		renderHome();
		await user.type(screen.getByPlaceholderText(/paste a room id/i), 'bad-id');
		await user.click(screen.getByRole('button', { name: /join room/i }));
		expect(toast.error).toHaveBeenCalledWith('Invalid Room ID format');
	});

	it('shows an error toast when joining with empty username', async () => {
		const user = userEvent.setup();
		useAuth.mockReturnValue({
			user: { email: 'test@example.com', user_metadata: {} },
			signOut: vi.fn(),
		});
		renderHome();
		const nameInput = screen.getByPlaceholderText('Enter your name');
		await user.clear(nameInput);
		await user.type(
			screen.getByPlaceholderText(/paste a room id/i),
			'550e8400-e29b-41d4-a716-446655440000',
		);
		await user.click(screen.getByRole('button', { name: /join room/i }));
		expect(toast.error).toHaveBeenCalledWith('Room ID & username are required');
	});

	it('navigates to editor when joining a valid, existing room', async () => {
		const user = userEvent.setup();
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ exists: true }),
		});
		renderHome();
		await user.type(
			screen.getByPlaceholderText(/paste a room id/i),
			'550e8400-e29b-41d4-a716-446655440000',
		);
		await user.click(screen.getByRole('button', { name: /join room/i }));
		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith(
				'/editor/550e8400-e29b-41d4-a716-446655440000',
				expect.objectContaining({ state: { username: 'Test User' } }),
			);
		});
	});

	it('shows an error toast when the room does not exist', async () => {
		const user = userEvent.setup();
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ exists: false }),
		});
		renderHome();
		await user.type(
			screen.getByPlaceholderText(/paste a room id/i),
			'550e8400-e29b-41d4-a716-446655440000',
		);
		await user.click(screen.getByRole('button', { name: /join room/i }));
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				'Room does not exist. Check the ID or create a new room.',
			);
		});
	});

	it('calls signOut when the Sign out button is clicked', async () => {
		const user = userEvent.setup();
		const signOut = vi.fn();
		useAuth.mockReturnValue({
			user: { email: 'test@example.com', user_metadata: {} },
			signOut,
		});
		renderHome();
		await user.click(screen.getByRole('button', { name: /sign out/i }));
		expect(signOut).toHaveBeenCalledOnce();
	});
});
