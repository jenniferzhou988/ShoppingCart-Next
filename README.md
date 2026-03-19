This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

This project includes a small REST API for authentication (JWT) backed by PostgreSQL.

### 1) Configure `.env`

Copy and update `.env.example`:

```bash
cp .env.example .env
```

**Required environment variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong secret for JWT signing (keep secure!)

### 2) Setup the database and Prisma

Make sure `DATABASE_URL` is set in `.env` and then run:

```bash
npm run prisma:migrate
npm run seed
```

### 3) Run locally

```bash
npm run dev
```

The app will validate required environment variables on first API access and fail fast with clear error messages if any are missing.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## REST API (JWT Authentication)

The app exposes a small RESTful auth API under `/api/auth`:

- `POST /api/auth/register` - create a new user (returns JWT)
- `POST /api/auth/login` - login and retrieve a token
- `GET /api/auth/me` - fetch authenticated user data (requires `Authorization: Bearer <token>`)

Example `register` request:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"secret"}'
```

Example `login` request:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"secret"}'
```

Example `me` request:

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```


### Created 3 API endpoints:

1. `POST /api/product` - Create new product

Request body: productName, description, price, salePrice, csdnNumber, createdBy, categoryIds[]
Returns: Created product with all relationships
2. `GET /api/product` - Get all products (with optional category filter)

-  Query param: ?categoryId=<id> to filter by category
Returns: Array of products with images, storage, and categories
3. GET /api/product/[id] - Get single product by ID

- Returns: Single product with all relationships
4. PATCH/PUT /api/product/[id] - Update product

- Request body: Any fields to update (productName, price, salePrice, categoryIds[], etc.)
- Returns: Updated product
5. DELETE /api/product/[id] - Delete product

- Returns: Success message
GET /api/product/category/[categoryId] - Get all products in a category

- Returns: Category info + array of products + count


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
