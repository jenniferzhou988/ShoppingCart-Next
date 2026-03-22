export interface ShoppingCartItem {
  productId: number;
  productName: string;
  price: number;
  salePrice: number | null;
  image: string | null;
  quantity: number;
}

const SHOPPING_CART_STORAGE_KEY = 'shopping-cart';

function hasWindow() {
  return globalThis.window !== undefined;
}

export function getShoppingCartItems(): ShoppingCartItem[] {
  if (!hasWindow()) {
    return [];
  }

  const raw = globalThis.localStorage.getItem(SHOPPING_CART_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is ShoppingCartItem =>
        item &&
        typeof item.productId === 'number' &&
        typeof item.productName === 'string' &&
        typeof item.price === 'number' &&
        (typeof item.salePrice === 'number' || item.salePrice === null) &&
        (typeof item.image === 'string' || item.image === null) &&
        typeof item.quantity === 'number'
    );
  } catch {
    return [];
  }
}

export function saveShoppingCartItems(items: ShoppingCartItem[]) {
  if (!hasWindow()) {
    return;
  }

  globalThis.localStorage.setItem(SHOPPING_CART_STORAGE_KEY, JSON.stringify(items));
  globalThis.window?.dispatchEvent(new CustomEvent('cart-change'));
}

export function addShoppingCartItem(item: Omit<ShoppingCartItem, 'quantity'>, quantity = 1) {
  const items = getShoppingCartItems();
  const existingIndex = items.findIndex((cartItem) => cartItem.productId === item.productId);

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      quantity: items[existingIndex].quantity + quantity,
    };
  } else {
    items.push({
      ...item,
      quantity,
    });
  }

  saveShoppingCartItems(items);
  return items;
}

export function updateShoppingCartItemQuantity(productId: number, quantity: number) {
  const items = getShoppingCartItems();

  const updatedItems = items
    .map((item) => {
      if (item.productId !== productId) {
        return item;
      }

      return {
        ...item,
        quantity,
      };
    })
    .filter((item) => item.quantity > 0);

  saveShoppingCartItems(updatedItems);
  return updatedItems;
}

export function removeShoppingCartItem(productId: number) {
  const items = getShoppingCartItems();
  const updatedItems = items.filter((item) => item.productId !== productId);
  saveShoppingCartItems(updatedItems);
  return updatedItems;
}

export function clearShoppingCartItems() {
  if (!hasWindow()) {
    return;
  }

  globalThis.localStorage.removeItem(SHOPPING_CART_STORAGE_KEY);
}

export function getShoppingCartSummary(items: ShoppingCartItem[]) {
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => {
    const unitPrice = item.salePrice ?? item.price;
    return total + unitPrice * item.quantity;
  }, 0);

  return {
    itemCount,
    subtotal,
  };
}