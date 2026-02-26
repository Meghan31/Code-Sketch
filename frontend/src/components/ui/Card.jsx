import clsx from 'clsx';
import './Card.scss';

const Card = ({ children, className, header, footer, ...props }) => {
	return (
		<div className={clsx('card', className)} {...props}>
			{header && <div className="card__header">{header}</div>}
			<div className="card__body">{children}</div>
			{footer && <div className="card__footer">{footer}</div>}
		</div>
	);
};

export default Card;
