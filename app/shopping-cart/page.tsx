'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  clearShoppingCartItems,
  getShoppingCartItems,
  getShoppingCartSummary,
  removeShoppingCartItem,
  type ShoppingCartItem,
  updateShoppingCartItemQuantity,
} from '../../lib/shopping-cart';

export default function ShoppingCartPage() {
  const [items, setItems] = useState<ShoppingCartItem[]>([]);

  useEffect(() => {
    setItems(getShoppingCartItems());
  }, []);

  const summary = useMemo(() => getShoppingCartSummary(items), [items]);

  const handleDecrease = (productId: number, quantity: number) => {
    setItems(updateShoppingCartItemQuantity(productId, Math.max(0, quantity - 1)));
  };

  const handleIncrease = (productId: number, quantity: number) => {
    setItems(updateShoppingCartItemQuantity(productId, quantity + 1));
  };

  const handleRemove = (productId: number) => {
    setItems(removeShoppingCartItem(productId));
  };

  const handleClearAll = () => {
    clearShoppingCartItems();
    setItems([]);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add products to your cart to see them here.</p>
          <Link
            href="/products"
            className="inline-flex bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <button
          type="button"
          onClick={handleClearAll}
          className="text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const unitPrice = item.salePrice ?? item.price;
            const lineTotal = unitPrice * item.quantity;

            return (
              <article key={item.productId} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex gap-4">
                  <Link
                    href={`/product/${item.productId}`}
                    className="relative h-24 w-24 rounded-md overflow-hidden bg-gray-100 shrink-0"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.productId}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                    >
                      {item.productName}
                    </Link>

                    <div className="mt-2 text-sm text-gray-600">
                      Unit Price: ${unitPrice.toFixed(2)}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      Subtotal: ${lineTotal.toFixed(2)}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleDecrease(item.productId, item.quantity)}
                        className="h-8 w-8 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                        aria-label={`Decrease quantity for ${item.productName}`}
                      >
                        -
                      </button>

                      <span className="min-w-6 text-center text-sm font-medium text-gray-900">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleIncrease(item.productId, item.quantity)}
                        className="h-8 w-8 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                        aria-label={`Increase quantity for ${item.productName}`}
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.productId)}
                        className="text-sm text-red-600 hover:text-red-700 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="bg-white border border-gray-200 rounded-lg p-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-gray-700">
              <span>Items</span>
              <span>{summary.itemCount}</span>
            </div>
            <div className="flex items-center justify-between text-gray-700">
              <span>Subtotal</span>
              <span>${summary.subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4 flex items-center justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-xl text-gray-900">${summary.subtotal.toFixed(2)}</span>
          </div>

          <button
            type="button"
            className="mt-6 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Proceed to Checkout
          </button>
        </aside>
      </div>
    </div>
  );
}