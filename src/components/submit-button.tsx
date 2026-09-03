"use client";

import { useFormStatus } from "react-dom";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  disabled,
  ...props
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button disabled={disabled || pending} {...props}>
      {pending ? pendingLabel : children}
    </button>
  );
}
