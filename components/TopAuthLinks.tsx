'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getAuthState, logout, type AuthState } from '../lib/auth-client';
import { getShoppingCartItems } from '../lib/shopping-cart';

interface ProductCategory {
  id: number;
  productCategoryName: string;
}

export default function TopAuthLinks() {
  const [authState, setAuthState] = useState<AuthState>({ token: null, user: null, isAuthenticated: false });
  const [cartItemCount, setCartItemCount] = useState(0);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refreshAuth = () => setAuthState(getAuthState());
    refreshAuth();
    globalThis.addEventListener('focus', refreshAuth);
    globalThis.addEventListener('storage', refreshAuth);
    globalThis.addEventListener('auth-change', refreshAuth);
    return () => {
      globalThis.removeEventListener('focus', refreshAuth);
      globalThis.removeEventListener('storage', refreshAuth);
      globalThis.removeEventListener('auth-change', refreshAuth);
    };
  }, []);

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

  useEffect(() => {
    fetch('/api/product-category')
      .then((r) => r.ok ? r.json() : [])
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setIsCatOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setAuthState({ token: null, user: null, isAuthenticated: false });
  };

  return (
    <div className="border-bottom bg-body-tertiary">
      <div className="container py-2 d-flex justify-content-end align-items-center gap-3">

        <Link href="/" className="text-decoration-none d-flex align-items-center gap-1">
          <i className="bi bi-house-door"></i>
          Home
        </Link>

        <div className="position-relative" ref={catRef}>
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1"
            onClick={() => setIsCatOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={isCatOpen}
          >
            <i className="bi bi-grid-3x3-gap"></i>
            Categories
            <i className={`bi bi-chevron-${isCatOpen ? 'up' : 'down'} ms-1`} style={{ fontSize: '0.7rem' }}></i>
          </button>

          {isCatOpen && (
            <ul
              className="dropdown-menu show"
              style={{ top: '100%', right: 0, left: 'auto', minWidth: '12rem', zIndex: 1050 }}
            >
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.id}`}
                    className="dropdown-item"
                    onClick={() => setIsCatOpen(false)}
                  >
                    {cat.productCategoryName}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <li><span className="dropdown-item-text text-muted">No categories</span></li>
              )}
            </ul>
          )}
        </div>

        <Link href="/shopping-cart" className="text-decoration-none d-flex align-items-center gap-1">
          <i className="bi bi-basket3"></i>
          Shopping Cart
          {cartItemCount > 0 && (
            <span className="badge rounded-pill bg-danger ms-1" style={{ fontSize: '0.65rem' }}>
              {cartItemCount}
            </span>
          )}
        </Link>

        {authState.isAuthenticated ? (
          <button type="button" onClick={handleLogout} className="btn btn-link p-0 text-decoration-none">
            Logout
          </button>
        ) : (
          <Link href="/login" className="text-decoration-none">
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
