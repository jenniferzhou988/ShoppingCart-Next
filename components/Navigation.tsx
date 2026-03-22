'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAuthState, logout, type AuthState } from '../lib/auth-client';
import { getShoppingCartItems } from '../lib/shopping-cart';

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
  const [cartItemCount, setCartItemCount] = useState(0);

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

  // Initialize auth state and keep in sync
  useEffect(() => {
    const refreshAuth = () => setAuthState(getAuthState());
    refreshAuth();
    globalThis.addEventListener('auth-change', refreshAuth);
    return () => globalThis.removeEventListener('auth-change', refreshAuth);
  }, []);

  // Track cart item count
  useEffect(() => {
    const refreshCart = () => {
      const items = getShoppingCartItems();
      setCartItemCount(items.reduce((sum, i) => sum + i.quantity, 0));
    };
    refreshCart();
    globalThis.addEventListener('cart-change', refreshCart);
    globalThis.addEventListener('storage', refreshCart);
    return () => {
      globalThis.removeEventListener('cart-change', refreshCart);
      globalThis.removeEventListener('storage', refreshCart);
    };
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
      <nav className="navbar navbar-expand-md bg-white border-bottom shadow-sm">
        <div className="container">
          <div className="navbar-brand fw-bold text-dark mb-0">
            <Link href="/" className="text-decoration-none text-dark">
                ShoppingCart
            </Link>
          </div>
          <div className="d-flex gap-2">
            <span className="placeholder col-3 bg-secondary-subtle rounded" style={{ width: '5rem', height: '2rem' }}></span>
            <span className="placeholder col-3 bg-secondary-subtle rounded" style={{ width: '5rem', height: '2rem' }}></span>
            <span className="placeholder col-3 bg-secondary-subtle rounded" style={{ width: '5rem', height: '2rem' }}></span>
          </div>
        </div>
      </nav>
    );
  }

  if (error) {
    console.error('Error loading categories:', error);
  }

  return (
    <nav className="navbar navbar-expand-md bg-white border-bottom shadow-sm py-2">
      <div className="container">
        <Link href="/" className="navbar-brand fw-bold text-dark d-flex align-items-center gap-2">
          <i className="bi bi-cart4"></i>
          {' '}
          ShoppingCart
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="navbar-toggler"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <i className={`bi ${isMenuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
        </button>

        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-md-0">
            <li className="nav-item">
              <Link
                href="/"
                className="nav-link d-flex align-items-center gap-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="bi bi-house-door"></i>
                {' '}
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/shopping-cart"
                className="nav-link d-flex align-items-center gap-1 position-relative"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="bi bi-basket3"></i>
                {' '}
                Shopping Cart
                {cartItemCount > 0 && (
                  <span
                    className="badge rounded-pill bg-danger ms-1"
                    style={{ fontSize: '0.65rem' }}
                  >
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </li>

            <li className="nav-item dropdown categories-dropdown">
              <button
                type="button"
                onMouseEnter={() => setIsCategoriesOpen(true)}
                onMouseLeave={() => setIsCategoriesOpen(false)}
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="nav-link dropdown-toggle btn btn-link text-decoration-none"
                aria-haspopup="true"
                aria-expanded={isCategoriesOpen}
              >
                <i className="bi bi-grid-3x3-gap me-1"></i>
                {' '}
                Categories
              </button>

              {isCategoriesOpen && (
                <ul
                  className="dropdown-menu show"
                  onMouseEnter={() => setIsCategoriesOpen(true)}
                  onMouseLeave={() => setIsCategoriesOpen(false)}
                >
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/category/${category.id}`}
                        className="dropdown-item text-capitalize"
                        title={category.description || category.productCategoryName}
                        onClick={() => {
                          setIsCategoriesOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        {category.productCategoryName}
                      </Link>
                    </li>
                  ))}
                  {categories.length === 0 && (
                    <li>
                      <span className="dropdown-item-text text-muted">No categories available</span>
                    </li>
                  )}
                </ul>
              )}
            </li>
          </ul>

          <div className="d-flex flex-column flex-md-row gap-2">
            {authState.isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="btn btn-outline-danger btn-sm btn-app"
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                {' '}
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn btn-outline-primary btn-sm btn-app"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  {' '}
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="btn btn-primary btn-sm btn-app"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="bi bi-person-plus me-1"></i>
                  {' '}
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}