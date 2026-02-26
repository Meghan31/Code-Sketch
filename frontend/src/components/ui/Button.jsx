import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';
import './Button.scss';

const Button = forwardRef(
	(
		{
			children,
			variant = 'primary',
			size = 'md',
			loading = false,
			disabled = false,
			iconLeft,
			iconRight,
			className,
			...props
		},
		ref,
	) => {
		return (
			<button
				ref={ref}
				className={clsx(
					'btn',
					`btn--${variant}`,
					`btn--${size}`,
					loading && 'btn--loading',
					className,
				)}
				disabled={disabled || loading}
				{...props}
			>
				{loading ? (
					<Loader2 className="btn__spinner" size={16} />
				) : (
					iconLeft && (
						<span className="btn__icon btn__icon--left">{iconLeft}</span>
					)
				)}
				<span className="btn__label">{children}</span>
				{iconRight && !loading && (
					<span className="btn__icon btn__icon--right">{iconRight}</span>
				)}
			</button>
		);
	},
);

Button.displayName = 'Button';

export default Button;
