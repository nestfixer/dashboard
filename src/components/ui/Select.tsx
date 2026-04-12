import React from "react"

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  children: React.ReactNode
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, children, className = "", ...props }, ref) => {
    const select = (
      <div className="relative">
        <select
          ref={ref}
          className={`appearance-none w-full pl-3 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 cursor-pointer ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <svg
            className="w-3.5 h-3.5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    )

    if (label) {
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {label}
          </label>
          {select}
        </div>
      )
    }

    return select
  }
)
Select.displayName = "Select"

export default Select
