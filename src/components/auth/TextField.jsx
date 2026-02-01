import './textfield.css'

export default function TextField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  inputMode,
  rightSlot,
  name,
}) {
  return (
    <div className="tf">
      <label className="tf-label" htmlFor={name}>{label}</label>

      <div className={`tf-wrap ${error ? 'tf-wrap--error' : ''}`}>
        <input
          id={name}
          name={name}
          className="tf-input"
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
        />
        {rightSlot ? <div className="tf-right">{rightSlot}</div> : null}
      </div>

      {error ? <div className="tf-error" role="alert">{error}</div> : <div className="tf-helper" />}
    </div>
  )
}
