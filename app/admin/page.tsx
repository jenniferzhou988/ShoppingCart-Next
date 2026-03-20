'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuthState } from '../../lib/auth-client';

type Product = {
  id: number;
  productName: string;
  description?: string;
  price: string | number;
  salePrice?: string | number;
  csdnNumber?: string;
  createdBy?: string;
  modifiedBy?: string;
  productCategoryLinks?: { productCategoryId: number; productCategory: { id: number; productCategoryName: string } }[];
  productImages?: { id: number; image: string }[];
};

type Category = {
  id: number;
  productCategoryName: string;
  description?: string;
  comment?: string;
};

type ProductImage = {
  id: number;
  productId: number;
  image: string;
};

type ProductImport = {
  id: number;
  productId: number;
  priceIn: number;
  quantity: number;
  createdBy?: string;
  modifiedBy?: string;
  product?: Product;
};

type ProductStorage = {
  id: number;
  productId: number;
  quantity: number;
  createdBy?: string;
  modifiedBy?: string;
  product?: Product;
};

const emptyForm = {
  productName: '',
  description: '',
  price: '',
  salePrice: '',
  csdnNumber: '',
  createdBy: '',
  categoryIds: [] as number[],
};

export default function AdminProductManagePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [productImports, setProductImports] = useState<ProductImport[]>([]);
  const [productStorages, setProductStorages] = useState<ProductStorage[]>([]);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [productForm, setProductForm] = useState(emptyForm);
  const [categoryForm, setCategoryForm] = useState({ productCategoryName: '', description: '', comment: '', createdBy: '' });
  const [imageForm, setImageForm] = useState({ productId: 0, image: '' });
  const [importForm, setImportForm] = useState({ productId: 0, priceIn: '', quantity: '', createdBy: '' });
  const [storageForm, setStorageForm] = useState({ productId: 0, quantity: '', createdBy: '' });

  const token = useMemo(() => getAuthState().token, []);
  const authHeader = useMemo<HeadersInit | undefined>(() => {
    if (token) return { Authorization: `Bearer ${token}` };
    return undefined;
  }, [token]);

  const jsonHeaders = useMemo<HeadersInit>(() => ({
    'Content-Type': 'application/json',
    ...(authHeader ? (authHeader as Record<string, string>) : {}),
  }), [authHeader]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [productRes, categoryRes, importRes, storageRes] = await Promise.all([
        fetch('/api/product', { headers: jsonHeaders }),
        fetch('/api/product-category', { headers: jsonHeaders }),
        fetch('/api/product-import', { headers: jsonHeaders }),
        fetch('/api/product-storage', { headers: jsonHeaders }),
      ]);
      if (!productRes.ok || !categoryRes.ok || !importRes.ok || !storageRes.ok) {
        throw new Error('Failed to fetch products or admin resources');
      }

      const prods = (await productRes.json()) as Product[];
      const cats = (await categoryRes.json()) as Category[];
      const imports = (await importRes.json()) as ProductImport[];
      const storages = (await storageRes.json()) as ProductStorage[];

      setProducts(prods);
      setCategories(cats);
      setProductImports(imports);
      setProductStorages(storages);
    } catch (err) {
      console.error(err);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [jsonHeaders]);

  const fetchAllImages = useCallback(async () => {
    try {
      const res = await fetch('/api/product-image', { headers: { ...authHeader } });
      if (!res.ok) throw new Error('Failed to fetch product images');
      setProductImages((await res.json()) as ProductImage[]);
    } catch (err) {
      console.error(err);
    }
  }, [authHeader]);

  useEffect(() => {
    const user = getAuthState().user;
    if (user?.role?.toLowerCase() === 'admin') {
      setIsAdmin(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchAllImages();
    }
  }, [isAdmin, fetchData, fetchAllImages]);

  const resetFeedback = () => {
    setMessage('');
    setError('');
  };

  const handleProductCreate = async () => {
    resetFeedback();
    try {
      const body = {
        productName: productForm.productName,
        description: productForm.description,
        price: Number(productForm.price),
        salePrice: productForm.salePrice ? Number(productForm.salePrice) : undefined,
        csdnNumber: productForm.csdnNumber,
        createdBy: productForm.createdBy,
        categoryIds: productForm.categoryIds,
      };

      const res = await fetch('/api/product', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Product creation failed');
      }

      setMessage('Product created successfully');
      setProductForm(emptyForm);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating product');
    }
  };

  const handleProductDelete = async (id: number) => {
    resetFeedback();
    try {
      const res = await fetch(`/api/product/${id}`, { method: 'DELETE', headers: { ...authHeader } });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Delete failed');
      }
      setMessage('Product deleted');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleCategoryCreate = async () => {
    resetFeedback();
    try {
      const res = await fetch('/api/product-category', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(categoryForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Category creation failed');
      }
      setMessage('Category created');
      setCategoryForm({ productCategoryName: '', description: '', comment: '', createdBy: '' });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Category creation failed');
    }
  };

  const handleCategoryDelete = async (id: number) => {
    resetFeedback();
    try {
      const res = await fetch(`/api/product-category/${id}`, { method: 'DELETE', headers: { ...authHeader } });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Delete category failed');
      }
      setMessage('Category deleted');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete category failed');
    }
  };

  const handleCategoryUpdate = async (id: number) => {
    resetFeedback();
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    try {
      const res = await fetch(`/api/product-category/${id}`, {
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify({ productCategoryName: cat.productCategoryName, description: cat.description, comment: cat.comment }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Update category failed');
      }
      setMessage('Category updated');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update category failed');
    }
  };

  const handleImageUpload = async () => {
    resetFeedback();
    if (!imageForm.productId || !imageForm.image) {
      setError('Product and image URL are required');
      return;
    }
    try {
      const res = await fetch('/api/product-image', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(imageForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Image upload failed');
      }
      setMessage('Image uploaded');
      setImageForm({ productId: 0, image: '' });
      fetchAllImages();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    }
  };

  const adjustStorageForImport = async (productId: number, quantity: number) => {
    try {
      const existing = productStorages.find((s) => s.productId === productId);
      if (existing) {
        const newQuantity = (existing.quantity ?? 0) + quantity;
        const res = await fetch(`/api/product-storage/${existing.id}`, {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({ quantity: newQuantity, modifiedBy: importForm.createdBy ?? 'system' }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.error || 'Failed to update storage');
        }
      } else {
        const res = await fetch('/api/product-storage', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ productId, quantity, createdBy: importForm.createdBy ?? 'system' }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.error || 'Failed to create storage');
        }
      }
      await fetchData();
    } catch (err) {
      console.error('Error adjusting storage from import', err);
      setError(err instanceof Error ? err.message : 'Storage adjustment failed');
    }
  };

  const handleProductImport = async () => {
    resetFeedback();
    if (!importForm.productId || !importForm.priceIn || !importForm.quantity) {
      setError('Product, price and quantity are required for import');
      return;
    }

    try {
      const res = await fetch('/api/product-import', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          productId: importForm.productId,
          priceIn: Number(importForm.priceIn),
          quantity: Number(importForm.quantity),
          createdBy: importForm.createdBy,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Product import failed');
      }

      const created = await res.json();
      setMessage('Product import created successfully');
      setImportForm({ productId: 0, priceIn: '', quantity: '', createdBy: '' });
      await adjustStorageForImport(created.productId, Number(created.quantity));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating product import');
    }
  };

  const handleStorageCreate = async () => {
    resetFeedback();
    if (!storageForm.productId || !storageForm.quantity) {
      setError('Product and quantity are required for storage');
      return;
    }

    try {
      const res = await fetch('/api/product-storage', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          productId: storageForm.productId,
          quantity: Number(storageForm.quantity),
          createdBy: storageForm.createdBy,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Product storage creation failed');
      }
      setStorageForm({ productId: 0, quantity: '', createdBy: '' });
      setMessage('Product storage entry created');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating product storage');
    }
  };

  const handleStorageDelete = async (id: number) => {
    resetFeedback();
    try {
      const res = await fetch(`/api/product-storage/${id}`, { method: 'DELETE', headers: jsonHeaders });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Delete product storage failed');
      }
      setMessage('Storage entry deleted');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting storage entry');
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading admin panel...</div>;
  }

  if (!isAdmin) {
    return <div className="p-6 text-center text-red-600">Access denied. Admin role is required.</div>;
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Product Management (Admin)</h1>
        {message && <div className="rounded-md bg-green-50 p-3 text-green-800">{message}</div>}
        {error && <div className="rounded-md bg-red-50 p-3 text-red-800">{error}</div>}

        <section className="rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
          <h2 className="text-xl font-semibold mb-2">Add / Update Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              id="productName"
              placeholder="Product Name"
              value={productForm.productName}
              onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
              className="input"
            />
            <input
              id="price"
              type="number"
              placeholder="Price"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              className="input"
            />
            <input
              id="salePrice"
              type="number"
              placeholder="Sale Price"
              value={productForm.salePrice}
              onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
              className="input"
            />
            <input
              id="csdnNumber"
              placeholder="CSDN Number"
              value={productForm.csdnNumber}
              onChange={(e) => setProductForm({ ...productForm, csdnNumber: e.target.value })}
              className="input"
            />
            <input
              id="createdBy"
              placeholder="Created By"
              value={productForm.createdBy}
              onChange={(e) => setProductForm({ ...productForm, createdBy: e.target.value })}
              className="input"
            />
            <select
              multiple
              value={productForm.categoryIds.map(String)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((opt) => Number(opt.value));
                setProductForm({ ...productForm, categoryIds: selected });
              }}
              className="input h-28"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.productCategoryName}</option>
              ))}
            </select>
            <textarea
              id="description"
              placeholder="Description"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="input md:col-span-3"
            />

            <button
              onClick={handleProductCreate}
              className="rounded-md bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-700"
            >
              Create Product
            </button>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
          <h2 className="text-xl font-semibold mb-2">Categories</h2>
          <div className="grid md:grid-cols-4 gap-3 mb-3">
            <input
              placeholder="Category Name"
              value={categoryForm.productCategoryName}
              onChange={(e) => setCategoryForm({ ...categoryForm, productCategoryName: e.target.value })}
              className="input"
            />
            <input
              placeholder="Description"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              className="input"
            />
            <input
              placeholder="Comment"
              value={categoryForm.comment}
              onChange={(e) => setCategoryForm({ ...categoryForm, comment: e.target.value })}
              className="input"
            />
            <button
              onClick={handleCategoryCreate}
              className="rounded-md bg-green-600 px-3 py-2 font-semibold text-white hover:bg-green-700"
            >
              Add Category
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900"><tr>
                <th className="px-3 py-2 text-left text-sm font-medium">Name</th>
                <th className="px-3 py-2 text-left text-sm font-medium">Description</th>
                <th className="px-3 py-2 text-left text-sm font-medium">Comment</th>
                <th className="px-3 py-2 text-left text-sm font-medium">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-3 py-2 font-semibold">
                      <input
                        value={category.productCategoryName}
                        onChange={(e) => {
                          const update = categories.map((cur) => cur.id === category.id ? { ...cur, productCategoryName: e.target.value } : cur);
                          setCategories(update);
                        }}
                        className="input"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={category.description ?? ''}
                        onChange={(e) => {
                          const update = categories.map((cur) => cur.id === category.id ? { ...cur, description: e.target.value } : cur);
                          setCategories(update);
                        }}
                        className="input"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={category.comment ?? ''}
                        onChange={(e) => {
                          const update = categories.map((cur) => cur.id === category.id ? { ...cur, comment: e.target.value } : cur);
                          setCategories(update);
                        }}
                        className="input"
                      />
                    </td>
                    <td className="px-3 py-2 flex gap-2">
                      <button
                        onClick={() => handleCategoryUpdate(category.id)}
                        className="rounded-md bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
                      >Update</button>
                      <button
                        onClick={() => handleCategoryDelete(category.id)}
                        className="rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
          <h2 className="text-xl font-semibold mb-2">Product Images</h2>
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <select
              value={imageForm.productId}
              onChange={(e) => setImageForm({ ...imageForm, productId: Number(e.target.value) })}
              className="input"
            >
              <option value={0}>Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.productName}</option>
              ))}
            </select>
            <input
              placeholder="Image URL"
              value={imageForm.image}
              onChange={(e) => setImageForm({ ...imageForm, image: e.target.value })}
              className="input"
            />
            <button
              onClick={handleImageUpload}
              className="rounded-md bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-700"
            >
              Upload Image
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900"><tr>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">Image</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {productImages.map((img) => {
                  const prod = products.find((p) => p.id === img.productId);
                  return (
                    <tr key={img.id}>
                      <td className="px-3 py-2">{prod?.productName ?? 'Unknown'}</td>
                      <td className="px-3 py-2">
                        <a href={img.image} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400">{img.image}</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
          <h2 className="text-xl font-semibold mb-2">Product Imports</h2>
          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <select
              value={importForm.productId}
              onChange={(e) => setImportForm({ ...importForm, productId: Number(e.target.value) })}
              className="input"
            >
              <option value={0}>Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.productName}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Price In"
              value={importForm.priceIn}
              onChange={(e) => setImportForm({ ...importForm, priceIn: e.target.value })}
              className="input"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={importForm.quantity}
              onChange={(e) => setImportForm({ ...importForm, quantity: e.target.value })}
              className="input"
            />
            <input
              placeholder="Created By"
              value={importForm.createdBy}
              onChange={(e) => setImportForm({ ...importForm, createdBy: e.target.value })}
              className="input"
            />
            <button
              onClick={handleProductImport}
              className="rounded-md bg-teal-600 px-3 py-2 font-semibold text-white hover:bg-teal-700"
            >
              Import Product
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900"><tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Price In</th>
                <th className="px-3 py-2">Quantity</th>
                <th className="px-3 py-2">Created By</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {productImports.map((imp) => {
                  const prod = products.find((p) => p.id === imp.productId);
                  return (
                    <tr key={imp.id}>
                      <td className="px-3 py-2">{prod?.productName ?? 'Unknown'}</td>
                      <td className="px-3 py-2">{imp.priceIn}</td>
                      <td className="px-3 py-2">{imp.quantity}</td>
                      <td className="px-3 py-2">{imp.createdBy ?? 'n/a'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
          <h2 className="text-xl font-semibold mb-2">Product Storage</h2>
          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <select
              value={storageForm.productId}
              onChange={(e) => setStorageForm({ ...storageForm, productId: Number(e.target.value) })}
              className="input"
            >
              <option value={0}>Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.productName}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={storageForm.quantity}
              onChange={(e) => setStorageForm({ ...storageForm, quantity: e.target.value })}
              className="input"
            />
            <input
              placeholder="Created By"
              value={storageForm.createdBy}
              onChange={(e) => setStorageForm({ ...storageForm, createdBy: e.target.value })}
              className="input"
            />
            <button
              onClick={handleStorageCreate}
              className="rounded-md bg-cyan-600 px-3 py-2 font-semibold text-white hover:bg-cyan-700"
            >
              Add Storage
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900"><tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Quantity</th>
                <th className="px-3 py-2">Modified By</th>
                <th className="px-3 py-2">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {productStorages.map((storage) => {
                  const prod = products.find((p) => p.id === storage.productId);
                  return (
                    <tr key={storage.id}>
                      <td className="px-3 py-2">{prod?.productName ?? 'Unknown'}</td>
                      <td className="px-3 py-2">{storage.quantity}</td>
                      <td className="px-3 py-2">{storage.modifiedBy ?? storage.createdBy ?? 'n/a'}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleStorageDelete(storage.id)}
                          className="rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                        >Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
          <h2 className="text-xl font-semibold mb-2">Products</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900"><tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Sale</th>
                <th className="px-3 py-2">Categories</th>
                <th className="px-3 py-2">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-3 py-2">{product.productName}</td>
                    <td className="px-3 py-2">{product.price}</td>
                    <td className="px-3 py-2">{product.salePrice ?? '—'}</td>
                    <td className="px-3 py-2">{product.productCategoryLinks?.map((link) => link.productCategory.productCategoryName).join(', ')}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleProductDelete(product.id)}
                        className="rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
