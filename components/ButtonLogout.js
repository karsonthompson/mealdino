"use client";

import { signOut } from "next-auth/react";

const ButtonLogout = ({ extraStyle = "" }) => {
  return (
    <button
      className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors font-medium ${extraStyle}`}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sign out
    </button>
  );
};

export default ButtonLogout;

