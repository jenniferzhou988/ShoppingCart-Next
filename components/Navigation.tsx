'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAuthState, logout, type AuthState } from '../lib/auth-client';

interface ProductCategory {
  id: number;
  productCategoryName: string;
  description: string | null;
  productCategoryLinks: any[];
}

export default function Navigation() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({ token: null, user: null, isAuthenticated: false });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/product-category');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Initialize auth state
  useEffect(() => {
    setAuthState(getAuthState());
  }, []);

  const handleLogout = () => {
    logout();
    setAuthState({ token: null, user: null, isAuthenticated: false });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCategoriesOpen && !(event.target as Element).closest('.categories-dropdown')) {
        setIsCategoriesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoriesOpen]);

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                ShoppingCart
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (error) {
    console.error('Error loading categories:', error);
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              ShoppingCart
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/shopping-cart"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Shopping Cart
            </Link>

            {/* Product Categories Dropdown */}
            <div className="relative categories-dropdown">
              <button
                onMouseEnter={() => setIsCategoriesOpen(true)}
                onMouseLeave={() => setIsCategoriesOpen(false)}
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
                aria-haspopup="true"
                aria-expanded={isCategoriesOpen}
              >
                <span>Categories</span>
                <svg
                  className={`h-4 w-4 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isCategoriesOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                  onMouseEnter={() => setIsCategoriesOpen(true)}
                  onMouseLeave={() => setIsCategoriesOpen(false)}
                >
                  <div className="py-1">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/category/${category.id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 capitalize transition-colors"
                        title={category.description || category.productCategoryName}
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        {category.productCategoryName}
                      </Link>
                    ))}
                    {categories.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No categories available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Links */}
            {authState.isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/shopping-cart"
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Shopping Cart
              </Link>

              {/* Mobile Product Categories Section */}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="flex items-center justify-between w-full text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
                  aria-expanded={isCategoriesOpen}
                >
                  <span>Categories</span>
                  <svg
                    className={`h-5 w-5 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isCategoriesOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/category/${category.id}`}
                        className="block text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium capitalize"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsCategoriesOpen(false);
                        }}
                        title={category.description || category.productCategoryName}
                      >
                        {category.productCategoryName}
                      </Link>
                    ))}
                    {categories.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No categories available
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-2 mt-2">
                {authState.isAuthenticated ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="block bg-blue-600 text-white px-3 py-2 text-base font-medium rounded-md mt-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}