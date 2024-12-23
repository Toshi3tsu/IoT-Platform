import React from "react";
import clsx from "clsx"; // クラス名の条件付き適用を簡略化するライブラリ（任意）

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "ghost"; // variantプロパティを追加
}

export function Button({ children, variant = "default", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "px-4 py-2 rounded",
        {
          "bg-blue-500 text-white hover:bg-blue-600": variant === "default",
          "bg-transparent text-blue-500 hover:bg-gray-100": variant === "ghost",
        },
        className // 外部から渡されたclassNameをマージ
      )}
    >
      {children}
    </button>
  );
}