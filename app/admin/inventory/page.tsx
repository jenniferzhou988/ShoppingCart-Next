'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuthState } from '../../../lib/auth-client';

type Product = {
  id: number;
  productName: string;
  description?: string;
  price: string | number;
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

export default function AdminInventoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productImports, setProductImports] = useState<ProductImport[]>([]);
  const [productStorages, setProductStorages] = useState<ProductStorage[]>([]);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
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
      const [productRes, importRes, storageRes] = await Promise.all([
        fetch('/api/product', { headers: jsonHeaders }),
        fetch('/api/product-import', { headers: jsonHeaders }),
        fetch('/api/product-storage', { headers: jsonHeaders }),
      ]);
      if (!productRes.ok || !importRes.ok || !storageRes.ok) {
        throw new Error('Failed to fetch inventory data');
      }

      const prods = (await productRes.json()) as Product[];
      const imports = (await importRes.json()) as ProductImport[];
      const storages = (await storageRes.json()) as ProductStorage[];

      setProducts(prods);
      setProductImports(imports);
      setProductStorages(storages);
    } catch (err) {
      console.error(err);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [jsonHeaders]);

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
    }
  }, [isAdmin, fetchData]);

  const resetFeedback = () => {
    setMessage('');
    setError('');
  };

  const adjustStorageForImport = async (productId: number, importQuantity: number) => {
    try {
      const existingStorage = productStorages.find((s) => s.productId === productId);
      if (existingStorage) {
        // ProductStorage exists: update quantity = existing + import quantity
        const newQuantity = (existingStorage.quantity ?? 0) + importQuantity;
        const res = await fetch(`/api/product-storage/${existingStorage.id}`, {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({ quantity: newQuantity, modifiedBy: importForm.createdBy ?? 'system' }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.error || 'Failed to update existing storage quantity');
        }
        console.log(`Updated storage for product ${productId}: ${existingStorage.quantity} + ${importQuantity} = ${newQuantity}`);
      } else {
        // ProductStorage doesn't exist: create new with import quantity
        const res = await fetch('/api/product-storage', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ productId, quantity: importQuantity, createdBy: importForm.createdBy ?? 'system' }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.error || 'Failed to create new storage entry');
        }
        console.log(`Created new storage for product ${productId} with quantity ${importQuantity}`);
      }
      await fetchData(); // Refresh all data including updated storage
    } catch (err) {
      console.error('Error adjusting storage from import:', err);
      setError(err instanceof Error ? err.message : 'Storage adjustment failed from import');
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

      // Adjust storage: check if exists, if not create with import quantity, otherwise add to existing
      await adjustStorageForImport(created.productId, Number(created.quantity));

      setImportForm({ productId: 0, priceIn: '', quantity: '', createdBy: '' });
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
    return <div className="p-6 text-center">Loading inventory management...</div>;
  }

  if (!isAdmin) {
    return <div className="p-6 text-center text-red-600">Access denied. Admin role is required.</div>;
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Inventory Management (Admin)</h1>
          <div className="flex gap-4">
            <a
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              ← Home
            </a>
            <a
              href="/admin"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ← Product Management
            </a>
          </div>
        </div>
        {message && <div className="rounded-md bg-green-50 p-3 text-green-800">{message}</div>}
        {error && <div className="rounded-md bg-red-50 p-3 text-red-800">{error}</div>}

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
      </div>
    </div>
  );
}