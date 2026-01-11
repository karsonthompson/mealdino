"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import ButtonLogout from "./ButtonLogout";

const ButtonLogin = ({ session, extraStyle = "" }) => {
  if (session) {
    return (
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
        <span className="text-gray-300 text-sm sm:text-base">
          Welcome, <span className="text-green-400 break-words">{session.user.email || session.user.name || "friend"}</span>
        </span>
        <ButtonLogout extraStyle={extraStyle} />
      </div>
    );
  }

  return (
    <button
      className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors font-medium ${extraStyle ? extraStyle : ""}`}
      onClick={() => {
        signIn(undefined, { callbackUrl: "/dashboard" });
      }}
    >
      Get started
    </button>
  );
};

export default ButtonLogin;
