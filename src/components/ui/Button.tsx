"use client"
import Link from "next/link"
import React from "react"

const variants = {
  primary: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50",
  secondary: "px-3 py-1.5 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50",
  danger: "px-3 py-1.5 text-sm text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50",
  ghost: "px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50",
}

type LinkButtonProps = {
  href: string
  variant?: keyof typeof variants
  className?: string
  children?: React.ReactNode
  onClick?: never
  disabled?: never
}

type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: never
  variant?: keyof typeof variants
}

type ButtonProps = LinkButtonProps | ActionButtonProps

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { variant = "primary", className = "", children } = props

    if ("href" in props && props.href) {
      const { href } = props as LinkButtonProps
      return (
        <Link href={href} className={`${variants[variant]} ${className}`}>
          {children}
        </Link>
      )
    }

    const { href: _href, variant: _variant, className: _className, children: _children, ...rest } = props as ActionButtonProps & { href?: never; variant?: keyof typeof variants; className?: string; children?: React.ReactNode }
    return (
      <button
        ref={ref}
        className={`${variants[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export default Button
