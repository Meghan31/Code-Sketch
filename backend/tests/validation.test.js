import { describe, expect, it } from 'vitest';
import { schemas, validate } from '../middleware/validation.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('validate()', () => {
	it('returns the validated value on success', () => {
		const result = validate(schemas.join, { roomId: VALID_UUID, username: 'alice' });
		expect(result).toEqual({ roomId: VALID_UUID, username: 'alice' });
	});

	it('throws an Error with joined messages on failure', () => {
		expect(() => validate(schemas.join, {})).toThrow(Error);
	});

	it('strips unknown fields', () => {
		const result = validate(schemas.join, {
			roomId: VALID_UUID,
			username: 'alice',
			extra: 'field',
		});
		expect(result).not.toHaveProperty('extra');
	});
});

describe('schemas.join', () => {
	it('accepts a valid payload', () => {
		expect(() =>
			validate(schemas.join, { roomId: VALID_UUID, username: 'alice' }),
		).not.toThrow();
	});

	it('rejects a non-UUID roomId', () => {
		expect(() =>
			validate(schemas.join, { roomId: 'not-a-uuid', username: 'alice' }),
		).toThrow('Invalid room ID format');
	});

	it('rejects a missing roomId', () => {
		expect(() => validate(schemas.join, { username: 'alice' })).toThrow(
			'Room ID is required',
		);
	});

	it('rejects username shorter than 2 characters', () => {
		expect(() =>
			validate(schemas.join, { roomId: VALID_UUID, username: 'a' }),
		).toThrow('Username must be at least 2 characters');
	});

	it('rejects username longer than 30 characters', () => {
		expect(() =>
			validate(schemas.join, { roomId: VALID_UUID, username: 'a'.repeat(31) }),
		).toThrow('Username cannot exceed 30 characters');
	});

	it('rejects username with special characters', () => {
		expect(() =>
			validate(schemas.join, { roomId: VALID_UUID, username: 'user@name' }),
		).toThrow('Username can only contain letters');
	});

	it('accepts username with letters, numbers, spaces, underscores', () => {
		expect(() =>
			validate(schemas.join, { roomId: VALID_UUID, username: 'user_name 123' }),
		).not.toThrow();
	});

	it('rejects a missing username', () => {
		expect(() => validate(schemas.join, { roomId: VALID_UUID })).toThrow(
			'Username is required',
		);
	});
});

describe('schemas.codeChange', () => {
	it('accepts an empty string for code', () => {
		const result = validate(schemas.codeChange, { roomId: VALID_UUID, code: '' });
		expect(result.code).toBe('');
	});

	it('accepts code up to 100 000 characters', () => {
		expect(() =>
			validate(schemas.codeChange, {
				roomId: VALID_UUID,
				code: 'x'.repeat(100000),
			}),
		).not.toThrow();
	});

	it('rejects code that exceeds 100 000 characters', () => {
		expect(() =>
			validate(schemas.codeChange, {
				roomId: VALID_UUID,
				code: 'x'.repeat(100001),
			}),
		).toThrow('Code cannot exceed 100KB');
	});

	it('rejects a missing roomId', () => {
		expect(() => validate(schemas.codeChange, { code: 'hello' })).toThrow();
	});
});

describe('schemas.languageChange', () => {
	it.each(['cpp', 'c', 'javascript', 'java', 'python'])(
		'accepts %s as a valid language',
		(language) => {
			expect(() =>
				validate(schemas.languageChange, { roomId: VALID_UUID, language }),
			).not.toThrow();
		},
	);

	it('rejects an unsupported language', () => {
		expect(() =>
			validate(schemas.languageChange, { roomId: VALID_UUID, language: 'rust' }),
		).toThrow('Invalid programming language');
	});

	it('rejects a missing language', () => {
		expect(() =>
			validate(schemas.languageChange, { roomId: VALID_UUID }),
		).toThrow();
	});
});

describe('schemas.inputChange', () => {
	it('accepts an empty stdin', () => {
		const result = validate(schemas.inputChange, {
			roomId: VALID_UUID,
			stdin: '',
		});
		expect(result.stdin).toBe('');
	});

	it('accepts stdin within the 10 000-character limit', () => {
		expect(() =>
			validate(schemas.inputChange, {
				roomId: VALID_UUID,
				stdin: 'x'.repeat(10000),
			}),
		).not.toThrow();
	});

	it('rejects stdin exceeding 10 000 characters', () => {
		expect(() =>
			validate(schemas.inputChange, {
				roomId: VALID_UUID,
				stdin: 'x'.repeat(10001),
			}),
		).toThrow();
	});
});

describe('schemas.executeCode', () => {
	it('accepts a valid execute payload with stdin', () => {
		expect(() =>
			validate(schemas.executeCode, {
				roomId: VALID_UUID,
				code: 'print("hi")',
				language: 'python',
				stdin: 'input',
			}),
		).not.toThrow();
	});

	it('accepts a valid execute payload without stdin (optional)', () => {
		expect(() =>
			validate(schemas.executeCode, {
				roomId: VALID_UUID,
				code: 'int main(){}',
				language: 'cpp',
			}),
		).not.toThrow();
	});

	it('rejects an unsupported language', () => {
		expect(() =>
			validate(schemas.executeCode, {
				roomId: VALID_UUID,
				code: 'code',
				language: 'ruby',
			}),
		).toThrow();
	});

	it('rejects code exceeding 100 000 characters', () => {
		expect(() =>
			validate(schemas.executeCode, {
				roomId: VALID_UUID,
				code: 'x'.repeat(100001),
				language: 'python',
			}),
		).toThrow();
	});
});
