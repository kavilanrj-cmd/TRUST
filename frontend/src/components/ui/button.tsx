import React from "react";

type ButtonType = "button" | "reset" | "submit";

interface ButtonProps {
  type?: ButtonType;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const Button = ({
  type = "button",
  children,
  disabled,
  className,
}: ButtonProps) => {
  return <button type={type} disabled={disabled} className={className}>{children}</button>;
};

Button.displayName = "Button";