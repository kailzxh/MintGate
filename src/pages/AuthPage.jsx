// src/pages/AuthPage.jsx
import { useState } from "react";
import SignIn from "./Login";
import SignUp from "./SignUp";

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-center mb-4">
          <button
            className={`px-4 py-2 font-semibold rounded-l-2xl ${
              isSignIn ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setIsSignIn(true)}
          >
            Sign In
          </button>
          <button
            className={`px-4 py-2 font-semibold rounded-r-2xl ${
              !isSignIn ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setIsSignIn(false)}
          >
            Sign Up
          </button>
        </div>

        {isSignIn ? <SignIn /> : <SignUp />}
      </div>
    </div>
  );
}
