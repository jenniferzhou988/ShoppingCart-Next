'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthState, logout, isAuthenticated, getCurrentUser, type AuthState } from "../lib/auth-client";

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>({ token: null, user: null, isAuthenticated: false });

  useEffect(() => {
    // Check auth state on component mount
    setAuthState(getAuthState());
  }, []);

  const handleLogout = () => {
    logout();
    setAuthState({ token: null, user: null, isAuthenticated: false });
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Image
              className="mx-auto mb-8 dark:invert"
              src="/next.svg"
              alt="ShoppingCart logo"
              width={120}
              height={25}
              priority
            />
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-4">
              Welcome to ShoppingCart
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-8">
              Discover amazing products across various categories. Shop with confidence and enjoy fast, secure delivery.
            </p>

            {authState.isAuthenticated ? (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                  <p className="text-lg text-gray-700 mb-4">
                    Welcome back, <span className="font-semibold text-blue-600">{authState.user?.email}</span>!
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    You are logged in as a <span className="font-medium">{authState.user?.role}</span>.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/products"
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors text-center"
                    >
                      Browse Products
                    </Link>
                    {authState.user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors text-center"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/products"
                    className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors text-center font-medium"
                  >
                    Start Shopping
                  </Link>
                  <Link
                    href="/register"
                    className="bg-white text-blue-600 border border-blue-600 px-8 py-3 rounded-md hover:bg-blue-50 transition-colors text-center font-medium"
                  >
                    Create Account
                  </Link>
                </div>
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose ShoppingCart?</h2>
            <p className="text-xl text-gray-600">Experience the best online shopping with our premium features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Get your orders delivered quickly and securely to your doorstep.</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Products</h3>
              <p className="text-gray-600">Shop from a curated selection of high-quality products you can trust.</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Shopping</h3>
              <p className="text-gray-600">Your personal information and payments are always protected.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
