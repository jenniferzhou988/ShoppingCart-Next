import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { NextRequest } from 'next/server';
import * as productHandlers from '../app/api/product/route';
import * as productByIdHandlers from '../app/api/product/[id]/route';
import * as productCategoryHandlers from '../app/api/product-category/route';
import * as productCategoryByIdHandlers from '../app/api/product-category/[id]/route';
import * as productImageHandlers from '../app/api/product-image/route';
import * as registerHandlers from '../app/api/auth/register/route';
import * as loginHandlers from '../app/api/auth/login/route';
import * as meHandlers from '../app/api/auth/me/route';

function makeJsonRequest(url: string, method = 'GET', body?: any): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

let productCategoryId: number;
let productId: number;
let productImageId: number;
let testUserId: number;
let authToken: string;

describe('API integration tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // cleanup in reverse order
    if (productImageId) await prisma.productImage.deleteMany({ where: { id: productImageId } });
    if (productId) await prisma.product.deleteMany({ where: { id: productId } });
    if (productCategoryId) await prisma.productCategory.deleteMany({ where: { id: productCategoryId } });
    if (testUserId) {
      await prisma.userLoginLog.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  it('should register, login, and fetch current user', async () => {
    const email = `test-user-${Date.now()}@example.com`;
    const password = 'password123';

    const registerRes = await registerHandlers.POST(
      makeJsonRequest('http://test.local/api/auth/register', 'POST', {
        email,
        password,
        role: 'USER',
      })
    );
    expect(registerRes.status).toBe(201);
    const registerJson = await registerRes.json();
    expect(registerJson.token).toBeTruthy();
    expect(registerJson.user?.email).toBe(email.toLowerCase());

    testUserId = registerJson.user.id;
    authToken = registerJson.token;

    const loginRes = await loginHandlers.POST(
      makeJsonRequest('http://test.local/api/auth/login', 'POST', {
        email,
        password,
      })
    );
    expect(loginRes.status).toBe(200);
    const loginJson = await loginRes.json();
    expect(loginJson.token).toBeTruthy();
    expect(loginJson.user?.id).toBe(testUserId);

    const meRes = await meHandlers.GET(
      new NextRequest('http://test.local/api/auth/me', {
        headers: {
          authorization: `Bearer ${loginJson.token}`,
        },
      })
    );
    expect(meRes.status).toBe(200);
    const meJson = await meRes.json();
    expect(meJson.user.email).toBe(email.toLowerCase());
  });

  it('should create, read, update, and delete product category', async () => {
    const uniqueName = `test-category-${Date.now()}`;

    // Create
    const postRes = await productCategoryHandlers.POST(
      makeJsonRequest('http://test.local/api/product-category', 'POST', {
        productCategoryName: uniqueName,
        description: 'Integration testing category',
        comment: 'Test category',
      })
    );

    expect(postRes.status).toBe(201);
    const newCategory = await postRes.json();
    expect(newCategory.productCategoryName).toBe(uniqueName);
    productCategoryId = newCategory.id;

    // GET all
    const getAllRes = await productCategoryHandlers.GET(makeJsonRequest('http://test.local/api/product-category'));
    expect(getAllRes.status).toBe(200);
    const categories = await getAllRes.json();
    expect(Array.isArray(categories)).toBe(true);

    // GET by id
    const getByIdRes = await productCategoryByIdHandlers.GET(
      makeJsonRequest('http://test.local/api/product-category/' + productCategoryId),
      { params: { id: String(productCategoryId) } }
    );
    expect(getByIdRes.status).toBe(200);
    const categoryById = await getByIdRes.json();
    expect(categoryById.id).toBe(productCategoryId);

    // PATCH
    const patchRes = await productCategoryByIdHandlers.PATCH(
      makeJsonRequest('http://test.local/api/product-category/' + productCategoryId, 'PATCH', {
        productCategoryName: `${uniqueName}-updated`,
      }),
      { params: { id: String(productCategoryId) } }
    );
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.productCategoryName).toBe(`${uniqueName}-updated`);

    // Delete
    const deleteRes = await productCategoryByIdHandlers.DELETE(
      makeJsonRequest('http://test.local/api/product-category/' + productCategoryId, 'DELETE'),
      { params: { id: String(productCategoryId) } }
    );
    expect(deleteRes.status).toBe(200);

    productCategoryId = 0;
  });

  it('should create, read and delete product + image', async () => {
    const category = await prisma.productCategory.create({
      data: { productCategoryName: `product-cat-${Date.now()}`, description: 'temp' },
    });

    const productBody = {
      productName: `test-product-${Date.now()}`,
      price: 10.5,
      description: 'int test product',
      categoryIds: [category.id],
    };

    const createProductRes = await productHandlers.POST(
      makeJsonRequest('http://test.local/api/product', 'POST', productBody)
    );
    expect(createProductRes.status).toBe(201);
    const createdProduct = await createProductRes.json();
    productId = createdProduct.id;

    const imageRes = await productImageHandlers.POST(
      makeJsonRequest('http://test.local/api/product-image', 'POST', {
        productId,
        image: 'https://example.com/image.png',
      })
    );
    expect(imageRes.status).toBe(201);
    const imageResult = await imageRes.json();
    productImageId = imageResult.id;

    const getImageRes = await productImageHandlers.GET(makeJsonRequest('http://test.local/api/product-image?productId=' + productId));
    expect(getImageRes.status).toBe(200);
    const images = await getImageRes.json();
    expect(images.some((img: any) => img.id === productImageId)).toBe(true);

    // verify product includes category links and images
    const getProductRes = await productByIdHandlers.GET(
      makeJsonRequest('http://test.local/api/product/' + productId),
      { params: { id: String(productId) } }
    );
    expect(getProductRes.status).toBe(200);
    const productDetails = await getProductRes.json();
    expect(productDetails.productCategoryLinks?.some((link: any) => link.productCategory?.id === category.id)).toBe(true);
    expect(productDetails.productImages?.some((img: any) => img.id === productImageId)).toBe(true);

    const delImageRes = await productImageHandlers.DELETE(
      makeJsonRequest('http://test.local/api/product-image/' + productImageId, 'DELETE'),
      { params: { id: String(productImageId) } }
    );
    expect(delImageRes.status).toBe(200);

    const delProductRes = await productHandlers.DELETE(
      makeJsonRequest('http://test.local/api/product/' + productId, 'DELETE')
    );
    expect(delProductRes.status).toBe(200);

    await prisma.productCategory.delete({ where: { id: category.id } });

    productId = 0;
    productImageId = 0;
  });
});
