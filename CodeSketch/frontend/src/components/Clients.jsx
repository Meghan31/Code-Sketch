const Client = (user) => {
	const fn = () => {
		const list = user.username.split(' ');
		console.log(list);
		return list[0][0] + list[1][0];
	};
	const initials = fn();
	return (
		<div
			className="client"
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				padding: '3px',
			}}
		>
			<div
				className="avatar"
				style={{
					backgroundColor: 'silver',
					width: '50px',
					height: '50px',
					borderRadius: '30%',
					alignItems: 'center',
					justifyContent: 'center',
					textAlign: 'center',
					display: 'flex',
				}}
			>
				<p
					style={{
						fontSize: '20px',
						fontFamily: 'sans-serif',
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
				}}
			>
				{user.username}
			</span>
		</div>
	);
};

export default Client;
