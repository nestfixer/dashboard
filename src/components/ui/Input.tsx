import React from "react"

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    const baseClass = `w-full px-3 py-2 border ${
      error ? "border-red-300" : "border-gray-300"
    } rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`

    const input = (
      <input ref={ref} className={`${baseClass} ${className}`} {...props} />
    )

    if (label || error) {
      return (
        <div>
          {label && (
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {label}
            </label>
          )}
          {input}
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>
      )
    }

    return input
  }
)
Input.displayName = "Input"

export default Input
