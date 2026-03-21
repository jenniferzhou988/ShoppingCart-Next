'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { addShoppingCartItem } from '../../../lib/shopping-cart';

interface Product {
  id: number;
  productName: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  productImages: Array<{
    id: number;
    image: string;
  }>;
  productStorage: {
    quantity: number;
  } | null;
  productCategoryLinks: Array<{
    productCategory: {
      id: number;
      productCategoryName: string;
    };
  }>;
}

export default function ProductItemPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    addShoppingCartItem({
      productId: product.id,
      productName: product.productName,
      price: Number(product.price),
      salePrice: product.salePrice === null ? null : Number(product.salePrice),
      image: product.productImages[0]?.image ?? null,
    });
    setAddedToCart(true);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/product/${productId}`);

        if (response.status === 404) {
          setProduct(null);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }

        const data = (await response.json()) as Product;
        setProduct(data);

        if (data.productImages.length > 0) {
          setSelectedImage(data.productImages[0].image);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const stockState = useMemo(() => {
    const quantity = product?.productStorage?.quantity;

    if (quantity === undefined) {
      return null;
    }

    if (quantity > 10) {
      return { text: 'In Stock', className: 'bg-green-100 text-green-800' };
    }

    if (quantity > 0) {
      return { text: `Only ${quantity} left`, className: 'bg-yellow-100 text-yellow-800' };
    }

    return { text: 'Out of Stock', className: 'bg-red-100 text-red-800' };
  }, [product]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[28rem] bg-gray-200 rounded-lg" />
          <div>
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8" />
            <div className="h-4 bg-gray-200 rounded w-full mb-3" />
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8" />
            <div className="h-10 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Error Loading Product</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/products"
            className="inline-flex bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you are looking for does not exist.</p>
          <Link
            href="/products"
            className="inline-flex bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const hasSalePrice = product.salePrice !== null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/products" className="text-blue-600 hover:text-blue-800 transition-colors">
          ← Back to all products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="relative h-[28rem] bg-gray-100 rounded-lg overflow-hidden mb-4">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={product.productName}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No image available
              </div>
            )}
          </div>

          {product.productImages.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.productImages.map((image) => {
                const isActive = image.image === selectedImage;

                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImage(image.image)}
                    className={`relative h-20 rounded-md overflow-hidden border-2 transition-colors ${
                      isActive ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image.image}
                      alt={`${product.productName} thumbnail ${image.id}`}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.productName}</h1>

          {product.productCategoryLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {product.productCategoryLinks.map((link) => (
                <Link
                  key={link.productCategory.id}
                  href={`/category/${link.productCategory.id}`}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {link.productCategory.productCategoryName}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            {hasSalePrice ? (
              <>
                <span className="text-3xl font-bold text-red-600">
                  ${Number(product.salePrice).toFixed(2)}
                </span>
                <span className="text-lg text-gray-500 line-through">
                  ${Number(product.price).toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-gray-900">
                ${Number(product.price).toFixed(2)}
              </span>
            )}
          </div>

          {stockState && (
            <div className="mb-6">
              <span className={`text-sm px-3 py-1 rounded-full ${stockState.className}`}>
                {stockState.text}
              </span>
            </div>
          )}

          <div className="prose prose-gray max-w-none">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700 leading-relaxed">
              {product.description || 'No description has been provided for this product yet.'}
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addedToCart}
              className={`px-6 py-3 rounded-md transition-colors ${
                addedToCart
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {addedToCart ? 'Added to Cart' : 'Add to Cart'}
            </button>
            <Link
              href="/shopping-cart"
              className="bg-gray-100 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors text-center"
            >
              View Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}