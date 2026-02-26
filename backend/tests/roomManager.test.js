import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RoomManager } from '../utils/roomManager.js';

describe('RoomManager', () => {
	let manager;

	beforeEach(() => {
		manager = new RoomManager({
			roomTTL: 500,
			cleanupInterval: 1000,
			autoStartCleanup: false,
		});
	});

	afterEach(async () => {
		await manager.shutdown();
	});

	it('tracks rooms and client counts', () => {
		const room = manager.addClient('rooms', 'socket-1', 'alice');
		expect(manager.roomExists('rooms')).toBe(true);
		expect(room.clients.size).toBe(1);
		expect(manager.getStats()).toEqual({ totalRooms: 1, totalClients: 1 });
	});

	it('removes rooms when the last client disconnects', () => {
		manager.addClient('single', 'socket-1', 'alice');
		const removalResult = manager.removeClient('single', 'socket-1');
		expect(removalResult).toBeNull();
		expect(manager.roomExists('single')).toBe(false);
		expect(manager.getStats().totalClients).toBe(0);
	});

	it('cleans up inactive rooms after TTL', () => {
		manager.addClient('stale', 'socket-1', 'bob');
		manager.roomActivity.set('stale', Date.now() - manager.ROOM_TTL - 1);
		const cleaned = manager.cleanupInactiveRooms();
		expect(cleaned).toBe(1);
		expect(manager.roomExists('stale')).toBe(false);
	});

	it('reports metadata via getRoomInfo', () => {
		const roomId = 'info-room';
		manager.addClient(
			roomId,
			'socket-1',
			'carol',
			'user-123',
			'carol@example.com',
		);
		const info = manager.getRoomInfo(roomId);
		expect(info).toMatchObject({
			roomId,
			createdBy: 'user-123',
			creatorEmail: 'carol@example.com',
			activeClients: 1,
		});
		expect(info?.participants || []).toContain('user-123');
	});
});
