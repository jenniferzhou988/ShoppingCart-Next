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


## Product API

The Product API allows you to manage products in the shopping cart system.

### Endpoints:

1. **GET /api/product** - Get all products
   - Query Parameters:
     - `categoryId` (optional): Filter products by category ID
   - Returns: Array of products with images, storage, and categories

2. **POST /api/product** - Create new product
   - Request body:
     ```json
     {
       "productName": "string",
       "description": "string (optional)",
       "price": "decimal",
       "salePrice": "decimal (optional)",
       "csdnNumber": "string (optional)",
       "createdBy": "string (optional)",
       "categoryIds": [1, 2]
     }
     ```
   - Returns: Created product with all relationships

3. **GET /api/product/[id]** - Get single product by ID
   - Returns: Single product with all relationships (images, storage, categories)

4. **PUT /api/product/[id]** - Update product
   - Request body: Any fields to update (productName, price, salePrice, categoryIds[], etc.)
   - Returns: Updated product

5. **DELETE /api/product/[id]** - Delete product
   - Returns: Success message

6. **GET /api/product/category/[categoryId]** - Get all products in a category
   - Returns: Category info + array of products + count

### Examples:

```bash
# Get all products
curl http://localhost:3000/api/product

# Get products by category
curl "http://localhost:3000/api/product?categoryId=1"

# Create a product
curl -X POST http://localhost:3000/api/product \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "salePrice": 799.99,
    "categoryIds": [1]
  }'

# Get specific product
curl http://localhost:3000/api/product/1

# Update product
curl -X PUT http://localhost:3000/api/product/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 899.99}'

# Delete product
curl -X DELETE http://localhost:3000/api/product/1
```

## Address API

The Address API allows you to manage customer addresses for shipping and billing purposes.

### Endpoints:

1. **GET /api/address** - Get all addresses
   - Returns: Array of all addresses (sorted by creation date, newest first)

2. **POST /api/address** - Create new address
   - Request body:
     ```json
     {
       "streetNumber": "string (required)",
       "street": "string (required)",
       "city": "string (required)",
       "postCode": "string (required)",
       "province": "string (required)",
       "country": "string (required)",
       "createdBy": "string (optional)"
     }
     ```
   - Returns: Created address with ID and timestamps

3. **GET /api/address/[id]** - Get specific address by ID
   - Returns: Single address object
   - Returns 404 if address not found

4. **PUT /api/address/[id]** - Update address
   - Request body: Any fields to update (streetNumber, street, city, postCode, province, country, modifiedBy)
   - Returns: Updated address
   - Returns 404 if address not found

5. **DELETE /api/address/[id]** - Delete address
   - Returns: Success message with deleted address data
   - Returns 409 if address is associated with orders or customer addresses
   - Returns 404 if address not found

### Examples:

```bash
# Get all addresses
curl http://localhost:3000/api/address

# Create new address
curl -X POST http://localhost:3000/api/address \
  -H "Content-Type: application/json" \
  -d '{
    "streetNumber": "123",
    "street": "Main Street",
    "city": "New York",
    "postCode": "10001",
    "province": "NY",
    "country": "USA",
    "createdBy": "admin"
  }'

# Get specific address
curl http://localhost:3000/api/address/1

# Update address
curl -X PUT http://localhost:3000/api/address/1 \
  -H "Content-Type: application/json" \
  -d '{
    "street": "Main Street North",
    "modifiedBy": "admin"
  }'

# Delete address
curl -X DELETE http://localhost:3000/api/address/1
```

### Address Deletion Rules:

- An address cannot be deleted if it is associated with any orders (as shipping or billing address)
- An address cannot be deleted if it is linked to any customer addresses
- When deletion fails due to associations, the response includes a count of associated records

## Customer API

The Customer API allows you to manage customer information including personal details and associated addresses, orders, and billing information.

### Endpoints:

1. **GET /api/customer** - Get all customers
   - Returns: Array of all customers with their addresses, orders, and billing card information (sorted by creation date, newest first)

2. **POST /api/customer** - Create new customer
   - Request body:
     ```json
     {
       "firstName": "string (required)",
       "middleName": "string (optional)",
       "lastName": "string (required)",
       "primaryPhone": "string (required)",
       "secondPhone": "string (optional)"
     }
     ```
   - Returns: Created customer with ID, timestamps, and related data

3. **GET /api/customer/[id]** - Get specific customer by ID
   - Returns: Single customer object with all relationships (addresses, orders, billing info)
   - Returns 404 if customer not found

4. **PUT /api/customer/[id]** - Update customer
   - Request body: Any fields to update (firstName, middleName, lastName, primaryPhone, secondPhone)
   - Returns: Updated customer with all relationships
   - Returns 404 if customer not found

5. **DELETE /api/customer/[id]** - Delete customer
   - Returns: Success message with deleted customer data
   - Returns 409 if customer has associated addresses, orders, or billing card information
   - Returns 404 if customer not found

### Examples:

```bash
# Get all customers
curl http://localhost:3000/api/customer

# Create new customer
curl -X POST http://localhost:3000/api/customer \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "middleName": "Michael",
    "lastName": "Doe",
    "primaryPhone": "+1-555-0123",
    "secondPhone": "+1-555-0124"
  }'

# Get specific customer
curl http://localhost:3000/api/customer/1

# Update customer
curl -X PUT http://localhost:3000/api/customer/1 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "primaryPhone": "+1-555-0199"
  }'

# Delete customer
curl -X DELETE http://localhost:3000/api/customer/1
```

### Customer Deletion Rules:

- A customer cannot be deleted if they have associated addresses
- A customer cannot be deleted if they have any orders
- A customer cannot be deleted if they have billing card information on file
- When deletion fails due to associations, the response includes a count of associated records

### Customer Data Relationships:

- **Addresses**: Customers can have multiple addresses linked through `customerAddresses`
- **Orders**: Each customer can have multiple orders (shipping and billing addresses)
- **Billing Cards**: Customers can have multiple billing bank card information stored


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
