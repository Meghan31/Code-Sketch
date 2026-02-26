import PropTypes from 'prop-types';

const Client = ({ username }) => {
	const getInitials = () => {
		if (!username || typeof username !== 'string') return '?';

		const trimmed = username.trim();
		if (!trimmed) return '?';

		const words = trimmed.split(/\s+/).filter((word) => word.length > 0);

		if (words.length === 0) return '?';
		if (words.length === 1) return words[0][0].toUpperCase();

		// First letter of first word + first letter of last word
		return (words[0][0] + words[words.length - 1][0]).toUpperCase();
	};

	const getUserColor = () => {
		if (!username) return '#6c757d';

		// Better hash function for more color variation
		let hash = 0;
		for (let i = 0; i < username.length; i++) {
			hash = (hash << 5) - hash + username.charCodeAt(i);
			hash = hash & hash; // Convert to 32-bit integer
		}

		const hue = Math.abs(hash % 360);
		const saturation = 65 + (Math.abs(hash) % 20); // 65-85%
		const lightness = 70 + (Math.abs(hash >> 8) % 15); // 70-85%

		return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	};

	const initials = getInitials();
	const userColor = getUserColor();

	return (
		<div
			className="client"
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				padding: '3px',
				margin: '8px',
			}}
		>
			<div
				className="avatar"
				style={{
					backgroundColor: userColor,
					width: '50px',
					height: '50px',
					borderRadius: '30%',
					alignItems: 'center',
					justifyContent: 'center',
					textAlign: 'center',
					display: 'flex',
					boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
				}}
			>
				<p
					style={{
						fontSize: '20px',
						fontFamily: 'sans-serif',
						fontWeight: 'bold',
						margin: 0,
						color: '#333',
					}}
				>
					{initials}
				</p>
			</div>

			<span
				style={{
					marginTop: '5px',
					marginBottom: '10px',
					fontSize: '15px',
					fontWeight: 'bold',
					fontFamily: 'sans-serif',
					maxWidth: '80px',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
				}}
				title={username}
			>
				{username}
			</span>
		</div>
	);
};

Client.propTypes = {
	username: PropTypes.string.isRequired,
};

export default Client;
