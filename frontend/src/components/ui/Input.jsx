import clsx from 'clsx';
import { forwardRef } from 'react';
import './Input.scss';

const Input = forwardRef(
	({ label, error, className, id, suffix, ...props }, ref) => {
		const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

		return (
			<div
				className={clsx(
					'input-group',
					error && 'input-group--error',
					className,
				)}
			>
				{label && (
					<label htmlFor={inputId} className="input-group__label">
						{label}
					</label>
				)}
				<div className="input-group__wrapper">
					<input
						ref={ref}
						id={inputId}
						className="input-group__input"
						{...props}
					/>
					{suffix && <div className="input-group__suffix">{suffix}</div>}
				</div>
				{error && <span className="input-group__error">{error}</span>}
			</div>
		);
	},
);

Input.displayName = 'Input';

export default Input;
