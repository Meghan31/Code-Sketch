import clsx from 'clsx';
import './Avatar.scss';

const Avatar = ({ username, size = 'md', showStatus = false, className }) => {
	const getInitials = () => {
		if (!username || typeof username !== 'string') return '?';
		const trimmed = username.trim();
		if (!trimmed) return '?';
		const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
		if (words.length === 0) return '?';
		if (words.length === 1) return words[0][0].toUpperCase();
		return (words[0][0] + words[words.length - 1][0]).toUpperCase();
	};

	const getColor = () => {
		if (!username) return { bg: '#27272a', text: '#a1a1aa' };
		let hash = 0;
		for (let i = 0; i < username.length; i++) {
			hash = (hash << 5) - hash + username.charCodeAt(i);
			hash = hash & hash;
		}
		const hue = Math.abs(hash % 360);
		return {
			bg: `hsl(${hue}, 45%, 22%)`,
			text: `hsl(${hue}, 50%, 72%)`,
		};
	};

	const { bg, text } = getColor();

	return (
		<div
			className={clsx('avatar', `avatar--${size}`, className)}
			title={username}
		>
			<div className="avatar__circle" style={{ background: bg, color: text }}>
				{getInitials()}
			</div>
			{showStatus && <span className="avatar__status" />}
		</div>
	);
};

export default Avatar;
