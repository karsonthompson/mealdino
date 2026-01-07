"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

const ButtonLogin = ({ session, extraStyle = "" }) => {
  if (session) {
    return (
      <Link
        href="/dashboard"
        className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors font-medium ${extraStyle}`}
      >
        Welcome back {session.user.name || "friend"}
      </Link>
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
