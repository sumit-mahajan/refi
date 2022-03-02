import styles from './textfield.module.scss';
import Box from '../Box'
import { forwardRef, useImperativeHandle, useState } from 'react';

// We need to wrap component in `forwardRef` in order to gain
// access to the ref object that is assigned using the `ref` prop.
// This ref is passed as the second parameter to the function component
export const TextField = forwardRef(({ fieldName, placeholder, type, name, validate, className }, ref) => {
    const [error, setError] = useState("");

    // The component instance will be extended
    // with whatever you return from the callback passed
    // as the second argument
    useImperativeHandle(ref, () => ({
        getError(param) {
            const err = validate(param)
            if (err) {
                setError(err)
                return true;
            }
            return false;
        }
    }));

    return (
        <div className={className}>
            <div className="flex-betn-ctr">
                <label
                    htmlFor={name}
                    className={styles.fieldName}
                    style={{ color: error !== "" ? 'red' : '' }}
                >
                    {fieldName}
                </label>
                {error !== "" && <p className={styles.errorText}>{error}</p>}
            </div>
            <Box height="10" />
            <input
                id={name}
                className={styles.textbox}
                type={type}
                placeholder={placeholder}
                name={name}
                onChange={() => { setError("") }}
                style={{ borderColor: error !== "" ? 'red' : '' }}
            />
        </div>
    );
});

export const TextArea = forwardRef(({ fieldName, placeholder, name, validate, className }, ref) => {
    const [error, setError] = useState("");

    useImperativeHandle(ref, () => ({
        getError(param) {
            const err = validate(param)
            if (err) {
                setError(err)
                return true;
            }
            return false;
        }
    }));

    return (
        <div className={className}>
            <div className="flex-betn-ctr">
                <label
                    htmlFor={name}
                    className={styles.fieldName}
                    style={{ color: error !== "" ? 'red' : '' }}
                >
                    {fieldName}
                </label>
                {error !== "" && <p className={styles.errorText}>{error}</p>}
            </div>
            <Box height="10" />
            <textarea
                id={name}
                placeholder={placeholder}
                name={name}
                className={styles.textarea}
                onChange={() => { setError("") }}
                style={{ borderColor: error !== "" ? 'red' : '' }}
            />
        </div>
    );
});