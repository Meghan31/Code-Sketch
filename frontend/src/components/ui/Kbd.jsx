import clsx from 'clsx';
import './Kbd.scss';

const Kbd = ({ children, className }) => {
	return <kbd className={clsx('kbd', className)}>{children}</kbd>;
};

// Renders "⌘ + Enter" style shortcut from array like ['⌘', 'Enter']
export const KbdShortcut = ({ keys, className }) => {
	return (
		<span className={clsx('kbd-shortcut', className)}>
			{keys.map((key, i) => (
				<span key={i}>
					<Kbd>{key}</Kbd>
					{i < keys.length - 1 && <span className="kbd-shortcut__sep">+</span>}
				</span>
			))}
		</span>
	);
};

export default Kbd;
