'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthState, logout, type AuthState } from "../lib/auth-client";

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>({ token: null, user: null, isAuthenticated: false });

  useEffect(() => {
    setAuthState(getAuthState());
  }, []);

  const handleLogout = () => {
    logout();
    setAuthState({ token: null, user: null, isAuthenticated: false });
  };

  return (
    <div className="bg-light">
      <div className="bg-white border-bottom">
        <div className="container py-5">
          <div className="text-center py-3 py-md-4">
            <Image
              className="mx-auto mb-4"
              src="/next.svg"
              alt="ShoppingCart logo"
              width={120}
              height={25}
              priority
            />
            <h1 className="display-5 fw-bold text-dark mb-3">Welcome to ShoppingCart</h1>
            <p className="lead text-secondary mx-auto mb-4" style={{ maxWidth: "44rem" }}>
              Discover amazing products across various categories. Shop with confidence and enjoy fast, secure delivery.
            </p>

            {authState.isAuthenticated ? (
              <div className="d-flex justify-content-center">
                <div className="card shadow-sm border-0" style={{ maxWidth: "38rem" }}>
                  <div className="card-body p-4">
                    <p className="fs-5 text-secondary mb-3">
                      Welcome back, <span className="fw-semibold text-primary">{authState.user?.email}</span>!
                    </p>
                    <p className="small text-muted mb-4">
                      You are logged in as a <span className="fw-medium text-capitalize">{authState.user?.role}</span>.
                    </p>
                    <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                      <Link href="/products" className="btn btn-primary btn-app">
                        <i className="bi bi-bag-check me-2"></i>
                        {' '}
                        Browse Products
                      </Link>
                      {authState.user?.role === 'admin' && (
                        <Link href="/admin" className="btn btn-outline-primary btn-app">
                          <i className="bi bi-speedometer2 me-2"></i>
                          {' '}
                          Admin Panel
                        </Link>
                      )}
                      <button onClick={handleLogout} className="btn btn-outline-danger btn-app">
                        <i className="bi bi-box-arrow-right me-2"></i>
                        {' '}
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center gap-3">
                <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                  <Link href="/products" className="btn btn-primary btn-lg btn-app">
                    <i className="bi bi-cart3 me-2"></i>
                    {' '}
                    Start Shopping
                  </Link>
                  <Link href="/register" className="btn btn-outline-primary btn-lg btn-app">
                    <i className="bi bi-person-plus me-2"></i>
                    {' '}
                    Create Account
                  </Link>
                </div>
                <p className="text-secondary mb-0">
                  Already have an account?{' '}
                  <Link href="/login" className="link-primary fw-semibold text-decoration-none">
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    {' '}
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="h1 fw-bold text-dark mb-3">Why Choose ShoppingCart?</h2>
            <p className="lead text-secondary mb-0">Experience the best online shopping with our premium features</p>
          </div>

          <div className="row g-4">
            <div className="col-12 col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body p-4">
                  <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "4rem", height: "4rem" }}>
                    <i className="bi bi-truck fs-3"></i>
                  </div>
                  <h3 className="h5 fw-semibold text-dark mb-2">Fast Delivery</h3>
                  <p className="text-secondary mb-0">Get your orders delivered quickly and securely to your doorstep.</p>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body p-4">
                  <div className="rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "4rem", height: "4rem" }}>
                    <i className="bi bi-patch-check fs-3"></i>
                  </div>
                  <h3 className="h5 fw-semibold text-dark mb-2">Quality Products</h3>
                  <p className="text-secondary mb-0">Shop from a curated selection of high-quality products you can trust.</p>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body p-4">
                  <div className="rounded-circle bg-info bg-opacity-10 text-info d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "4rem", height: "4rem" }}>
                    <i className="bi bi-shield-lock fs-3"></i>
                  </div>
                  <h3 className="h5 fw-semibold text-dark mb-2">Secure Shopping</h3>
                  <p className="text-secondary mb-0">Your personal information and payments are always protected.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
