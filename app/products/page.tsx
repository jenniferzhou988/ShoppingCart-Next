'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addShoppingCartItem } from '../../lib/shopping-cart';

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

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [browseCategoryId, setBrowseCategoryId] = useState<string>('');
  const [addedProducts, setAddedProducts] = useState<Set<number>>(new Set());

  const handleAddToCart = (product: Product) => {
    addShoppingCartItem({
      productId: product.id,
      productName: product.productName,
      price: Number(product.price),
      salePrice: product.salePrice === null ? null : Number(product.salePrice),
      image: product.productImages[0]?.image ?? null,
    });
    setAddedProducts((prev) => new Set(prev).add(product.id));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/product');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !selectedCategory ||
                           product.productCategoryLinks.some(link =>
                             link.productCategory.productCategoryName === selectedCategory
                           );

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(
    new Set(
      products.flatMap(product =>
        product.productCategoryLinks.map(link => link.productCategory.productCategoryName)
      )
    )
  );

  const categoryOptions = Array.from(
    new Map(
      products.flatMap((product) =>
        product.productCategoryLinks.map((link) => [
          String(link.productCategory.id),
          {
            id: String(link.productCategory.id),
            name: link.productCategory.productCategoryName,
          },
        ])
      )
    ).values()
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Products</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary btn-app"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">All Products</h1>
        <p className="text-gray-600">
          Discover our complete collection of products across all categories
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="sm:w-72">
          <select
            value={browseCategoryId}
            onChange={(e) => {
              const selectedId = e.target.value;
              setBrowseCategoryId(selectedId);
              if (selectedId) {
                router.push(`/category/${selectedId}`);
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Browse by Product Category</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
          {(searchTerm || selectedCategory) && (
            <span className="ml-2">
              {searchTerm && `for "${searchTerm}"`}
              {searchTerm && selectedCategory && ' in '}
              {selectedCategory && `"${selectedCategory}"`}
            </span>
          )}
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory
              ? "Try adjusting your search or filter criteria."
              : "There are no products available at the moment."
            }
          </p>
          {(searchTerm || selectedCategory) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="btn btn-outline-primary btn-app"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-100">
                {product.productImages && product.productImages.length > 0 ? (
                  <Image
                    src={product.productImages[0].image}
                    alt={product.productName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.productName}
                </h3>

                {/* Categories */}
                {product.productCategoryLinks && product.productCategoryLinks.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.productCategoryLinks.slice(0, 2).map((link) => (
                      <Link
                        key={link.productCategory.id}
                        href={`/category/${link.productCategory.id}`}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        {link.productCategory.productCategoryName}
                      </Link>
                    ))}
                    {product.productCategoryLinks.length > 2 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{product.productCategoryLinks.length - 2} more
                      </span>
                    )}
                  </div>
                )}

                {product.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Price */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {product.salePrice ? (
                      <>
                        <span className="text-lg font-bold text-red-600">
                          ${Number(product.salePrice).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ${Number(product.price).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        ${Number(product.price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  {product.productStorage && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.productStorage.quantity > 10
                        ? 'bg-green-100 text-green-800'
                        : product.productStorage.quantity > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.productStorage.quantity > 10
                        ? 'In Stock'
                        : product.productStorage.quantity > 0
                        ? `Only ${product.productStorage.quantity} left`
                        : 'Out of Stock'
                      }
                    </span>
                  )}
                </div>

                {/* Action Button */}
                <Link
                  href={`/product/${product.id}`}
                  className="btn btn-primary btn-app w-100"
                >
                  View Details
                </Link>
                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  disabled={addedProducts.has(product.id)}
                  className={`btn btn-app w-100 mt-2 ${
                    addedProducts.has(product.id)
                      ? 'btn-success disabled'
                      : 'btn-outline-primary'
                  }`}
                >
                  {addedProducts.has(product.id) ? 'Added to Cart' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}