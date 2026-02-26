import { getSupabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to verify JWT token from Supabase
 */
export const verifyAuth = async (socket, next) => {
	try {
		const token = socket.handshake.auth?.token;

		if (!token) {
			logger.warn(`[Auth] No token provided for socket ${socket.id}`);
			return next(new Error('Authentication token required'));
		}

		const supabase = getSupabase();

		if (!supabase) {
			logger.error('[Auth] Supabase client not configured');
			return next(new Error('Authentication service unavailable'));
		}

		// Verify the JWT token with Supabase
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);

		if (error || !user) {
			logger.warn(
				`[Auth] Invalid token for socket ${socket.id}: ${error?.message}`
			);
			return next(new Error('Invalid or expired token'));
		}

		// Attach user information to socket
		socket.user = {
			id: user.id,
			email: user.email,
			metadata: user.user_metadata,
		};

		logger.info(`[Auth] User authenticated: ${user.email} (${socket.id})`);
		next();
	} catch (error) {
		logger.error(`[Auth] Error verifying token:`, error);
		next(new Error('Authentication failed'));
	}
};
