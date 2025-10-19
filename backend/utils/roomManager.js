import { logger } from './logger.js';

class RoomManager {
	constructor() {
		this.rooms = new Map();
		this.roomActivity = new Map();
		this.ROOM_TTL = 3600000; // 1 hour in milliseconds
		this.CLEANUP_INTERVAL = 300000; // 5 minutes
		this.cleanupIntervalId = null; //    Store interval ID
		this.MAX_ROOMS = 1000; //    Prevent memory exhaustion
		this.MAX_CLIENTS_PER_ROOM = 50; //    Limit clients per room

		this.startCleanupInterval();
	}

	getOrCreateRoom(roomId) {
		if (!this.rooms.has(roomId)) {
			//  Check max rooms limit
			if (this.rooms.size >= this.MAX_ROOMS) {
				throw new Error(`Maximum number of rooms (${this.MAX_ROOMS}) reached`);
			}

			this.rooms.set(roomId, {
				clients: new Map(),
				code: '',
				language: 'cpp',
				createdAt: Date.now(),
			});
			this.updateActivity(roomId);
			logger.info(`Room created: ${roomId}`);
		}
		return this.rooms.get(roomId);
	}

	updateActivity(roomId) {
		this.roomActivity.set(roomId, Date.now());
	}

	addClient(roomId, socketId, username) {
		const room = this.getOrCreateRoom(roomId);

		//  Check max clients limit
		if (room.clients.size >= this.MAX_CLIENTS_PER_ROOM) {
			throw new Error(
				`Room is full (max ${this.MAX_CLIENTS_PER_ROOM} clients)`
			);
		}

		room.clients.set(socketId, username);
		this.updateActivity(roomId);
		logger.info(`Client ${username} (${socketId}) joined room ${roomId}`);
		return room;
	}

	removeClient(roomId, socketId) {
		if (!this.rooms.has(roomId)) return null;

		const room = this.rooms.get(roomId);
		const username = room.clients.get(socketId);
		room.clients.delete(socketId);

		if (room.clients.size === 0) {
			this.rooms.delete(roomId);
			this.roomActivity.delete(roomId);
			logger.info(`Room ${roomId} deleted (empty)`);
			return null;
		}

		this.updateActivity(roomId);
		return { room, username };
	}

	updateCode(roomId, code) {
		const room = this.rooms.get(roomId);
		if (room) {
			room.code = code;
			this.updateActivity(roomId);
		}
	}

	updateLanguage(roomId, language) {
		const room = this.rooms.get(roomId);
		if (room) {
			room.language = language;
			this.updateActivity(roomId);
		}
	}

	getClients(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) return [];

		return Array.from(room.clients, ([id, name]) => ({
			socketId: id,
			username: name,
		}));
	}

	cleanupInactiveRooms() {
		const now = Date.now();
		let cleanedCount = 0;

		this.roomActivity.forEach((lastActivity, roomId) => {
			if (now - lastActivity > this.ROOM_TTL) {
				this.rooms.delete(roomId);
				this.roomActivity.delete(roomId);
				cleanedCount++;
				logger.info(
					`Room ${roomId} cleaned up (inactive for ${
						this.ROOM_TTL / 60000
					} minutes)`
				);
			}
		});

		if (cleanedCount > 0) {
			logger.info(`Cleaned up ${cleanedCount} inactive rooms`);
		}

		return cleanedCount;
	}

	startCleanupInterval() {
		//  Store interval ID
		this.cleanupIntervalId = setInterval(() => {
			this.cleanupInactiveRooms();
		}, this.CLEANUP_INTERVAL);

		logger.info('Room cleanup interval started');
	}

	getStats() {
		return {
			totalRooms: this.rooms.size,
			totalClients: Array.from(this.rooms.values()).reduce(
				(sum, room) => sum + room.clients.size,
				0
			),
		};
	}

	async shutdown() {
		logger.info('RoomManager shutting down...');

		// Clear the interval
		if (this.cleanupIntervalId) {
			clearInterval(this.cleanupIntervalId);
			this.cleanupIntervalId = null;
			logger.info('Cleanup interval cleared');
		}

		this.rooms.clear();
		this.roomActivity.clear();
		logger.info('RoomManager shutdown complete');
	}
}

export const roomManager = new RoomManager();
