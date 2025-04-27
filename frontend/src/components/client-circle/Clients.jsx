import PropTypes from 'prop-types';

const Client = ({ username }) => {
	const getInitials = () => {
		// If username is provided in props
		if (username) {
			// Split by spaces and get first letter of each word
			const nameParts = username.split(' ');

			// If there's at least one part
			if (nameParts.length >= 1) {
				// If only one part or first part is empty, return first letter of the first non-empty part
				if (nameParts.length === 1 || !nameParts[0]) {
					const firstNonEmpty = nameParts.find((part) => part.length > 0);
					return firstNonEmpty ? firstNonEmpty[0].toUpperCase() : '?';
				}

				// Otherwise, return first letter of first part and first letter of last part
				const firstInitial = nameParts[0][0] || '?';
				const secondInitial =
					nameParts[1] && nameParts[1][0] ? nameParts[1][0] : '';

				return (firstInitial + secondInitial).toUpperCase();
			}
		}
		return '?'; // Default if no username or parsing fails
	};

	// Generate a consistent color based on username
	const getUserColor = () => {
		if (!username) return '#6c757d'; // Default gray

		// Simple hash function for username to generate color
		let hash = 0;
		for (let i = 0; i < username.length; i++) {
			hash = username.charCodeAt(i) + ((hash << 5) - hash);
		}

		// Convert hash to RGB color
		const hue = Math.abs(hash % 360);
		return `hsl(${hue}, 70%, 80%)`; // Lighter pastel colors
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
			>
				{username}
			</span>
		</div>
	);
};

// Define prop types outside the component function
Client.propTypes = {
	username: PropTypes.string.isRequired,
};

export default Client;
