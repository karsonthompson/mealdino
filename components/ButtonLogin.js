"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

const ButtonLogin = ({ session, extraStyle = "" }) => {
  if (session) {
    return (
      <Link
        href="/dashboard"
        className={`btn btn-primary ${extraStyle}`}
      >
        Welcome back {session.user.name || "friend"}
      </Link>
    );
  }

  return (
    <button
      className={`btn btn-primary ${extraStyle ? extraStyle : ""}`}
      onClick={() => {
        signIn(undefined, { callbackUrl: "/dashboard" });
      }}
    >
      Get started
    </button>
  );
};

export default ButtonLogin;
