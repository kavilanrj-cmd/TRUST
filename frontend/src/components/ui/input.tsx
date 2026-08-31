import React from "react";

interface InputProps {
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
}

export const Input = ({
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  className,
}: InputProps) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={className}
    />
  );
};

Input.displayName = "Input";