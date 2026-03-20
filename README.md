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

## Shopping Cart API

The Shopping Cart API allows authenticated users to manage their shopping carts, add/remove items, and track their selections.

### Authentication Required

All shopping cart endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

### Endpoints:

1. **GET /api/shopping-cart** - Get user's shopping cart
   - Returns: User's current shopping cart with all items and product details
   - Returns empty cart if none exists

2. **POST /api/shopping-cart** - Create new shopping cart
   - Creates a new empty shopping cart for the authenticated user
   - Returns: Created shopping cart object
   - Returns 409 if user already has an active cart

3. **GET /api/shopping-cart/[id]** - Get specific shopping cart by ID
   - Returns: Shopping cart with all items and product details (images, storage info)
   - Only returns cart if it belongs to the authenticated user
   - Returns 404 if cart not found or doesn't belong to user

4. **POST /api/shopping-cart/items** - Add item to shopping cart
   - Request body:
     ```json
     {
       "productId": 1,
       "quantity": 2
     }
     ```
   - If item already exists in cart, quantity is increased
   - If cart doesn't exist, one is created automatically
   - Returns: Added/updated cart item with product details

5. **DELETE /api/shopping-cart/items/[itemId]** - Remove item from shopping cart
   - Removes the specified item from the user's shopping cart
   - Returns: Success message
   - Returns 404 if item not found or doesn't belong to user

### Examples:

```bash
# Get user's shopping cart
curl http://localhost:3000/api/shopping-cart \
  -H "Authorization: Bearer <token>"

# Create new shopping cart
curl -X POST http://localhost:3000/api/shopping-cart \
  -H "Authorization: Bearer <token>"

# Get specific cart by ID
curl http://localhost:3000/api/shopping-cart/1 \
  -H "Authorization: Bearer <token>"

# Add item to cart
curl -X POST http://localhost:3000/api/shopping-cart/items \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 2
  }'

# Remove item from cart
curl -X DELETE http://localhost:3000/api/shopping-cart/items/123 \
  -H "Authorization: Bearer <token>"
```

### Shopping Cart Features:

- **User Isolation**: Users can only access their own shopping carts
- **Automatic Cart Creation**: Cart is created when first item is added
- **Quantity Management**: Adding existing items increases quantity instead of creating duplicates
- **Price Calculation**: Automatic calculation of total price per item (`price * quantity`)
- **Product Validation**: Ensures products exist before adding to cart
- **Rich Product Data**: Cart items include full product details (images, storage, categories)

## Order API

The Order API allows authenticated users to create, manage, and track their orders. Admins have additional privileges to manage all orders.

### Authentication Required

All order endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

### Endpoints:

1. **GET /api/order** - Get orders
   - **Admin**: Returns all orders in the system
   - **User**: Returns only orders belonging to the authenticated user
   - Returns: Array of orders with full details (customer, addresses, billing, status, items)

2. **POST /api/order** - Create new order
   - Request body:
     ```json
     {
       "shippingAddressId": 1,
       "billingAddressId": 1,
       "billingBankCardInfoId": 1,
       "orderDetails": [
         {
           "productId": 1,
           "quantity": 2,
           "salePrice": 99.99
         }
       ]
     }
     ```
   - Creates order with "Ordered" status and calculates prices automatically
   - Returns: Complete order object with all relationships

3. **GET /api/order/[id]** - Get specific order by ID
   - **Admin**: Can access any order
   - **User**: Can only access their own orders
   - Returns: Complete order with customer, addresses, billing, status, items, and shipping records

4. **PUT /api/order/[id]** - Update order
   - Can update shipping/billing addresses and payment method
   - Cannot modify orders that are shipped or completed
   - Returns: Updated order object

5. **POST /api/order/[orderId]/details** - Add items to existing order
   - Request body:
     ```json
     {
       "orderDetails": [
         {
           "productId": 2,
           "quantity": 1,
           "salePrice": 49.99
         }
       ]
     }
     ```
   - Adds new items or increases quantity of existing items
   - Cannot modify shipped or completed orders
   - Returns: Added order details

6. **PUT /api/order/[orderId]/status** - Update order status
   - Request body:
     ```json
     {
       "orderStatus": "Shipping"
     }
     ```
   - Valid statuses: "Ordered" → "Shipping" → "Received"
   - Enforces status transition rules
   - Returns: Updated order with new status

### Order Status Flow:

- **Ordered**: Initial status when order is created
- **Shipping**: Order has been shipped (can only transition from Ordered)
- **Received**: Order has been delivered (can transition from Ordered or Shipping)

### Examples:

```bash
# Get user's orders
curl http://localhost:3000/api/order \
  -H "Authorization: Bearer <token>"

# Create new order
curl -X POST http://localhost:3000/api/order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddressId": 1,
    "billingAddressId": 1,
    "billingBankCardInfoId": 1,
    "orderDetails": [
      {
        "productId": 1,
        "quantity": 2
      }
    ]
  }'

# Get specific order
curl http://localhost:3000/api/order/1 \
  -H "Authorization: Bearer <token>"

# Update order addresses
curl -X PUT http://localhost:3000/api/order/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddressId": 2,
    "billingAddressId": 2
  }'

# Add items to order
curl -X POST http://localhost:3000/api/order/1/details \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderDetails": [
      {
        "productId": 2,
        "quantity": 1
      }
    ]
  }'

# Update order status
curl -X PUT http://localhost:3000/api/order/1/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderStatus": "Shipping"
  }'
```

### Order Features:

- **Role-based Access**: Users see only their orders, admins see all orders
- **Address Validation**: Ensures shipping/billing addresses belong to the customer
- **Payment Validation**: Verifies billing cards belong to the customer
- **Status Transitions**: Enforces valid order status changes
- **Price Calculation**: Automatically calculates sale prices and totals
- **Order Modification**: Prevents changes to shipped/completed orders
- **Rich Data**: Includes customer, addresses, billing, products, and shipping info

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

## ProductImage API

The ProductImage API handles images attached to products.

### Endpoints:

1. **GET /api/product-image** - Get all product images
   - Optional query: `productId=<id>` to filter by product
   - Returns: Array of product images (with product info)

2. **POST /api/product-image** - Create new product image
   - Request body:
     ```json
     {
       "productId": 1,
       "image": "https://cdn.example.com/image.jpg",
       "createdBy": "admin"
     }
     ```
   - Returns created product image

3. **GET /api/product-image/[id]** - Get specific product image by ID
   - Returns product image with related product
   - 404 if not found

4. **DELETE /api/product-image/[id]** - Delete product image by ID
   - Returns deletion message + deleted record
   - 404 if not found

### Examples:

```bash
# Get all product images
curl http://localhost:3000/api/product-image

# Get images for product 1
curl "http://localhost:3000/api/product-image?productId=1"

# Create image
curl -X POST http://localhost:3000/api/product-image \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "image": "https://cdn.example.com/product-1.jpg",
    "createdBy": "admin"
  }'

# Get specific image
curl http://localhost:3000/api/product-image/1

# Delete image
curl -X DELETE http://localhost:3000/api/product-image/1
```

## Learn More
- A customer cannot be deleted if they have associated addresses
- A customer cannot be deleted if they have any orders
- A customer cannot be deleted if they have billing card information on file
- When deletion fails due to associations, the response includes a count of associated records

### Customer Data Relationships:

- **Addresses**: Customers can have multiple addresses linked through `customerAddresses`
- **Orders**: Each customer can have multiple orders (shipping and billing addresses)
- **Billing Cards**: Customers can have multiple billing bank card information stored

## BillingBankCardInfo API

The BillingBankCardInfo API manages stored billing cards in the system.

### Endpoints:

1. **GET /api/billing-bank-card** - Get all billing cards
   - Returns: Array of card records including customer and billing type

2. **POST /api/billing-bank-card** - Create new billing card record
   - Request body:
     ```json
     {
       "billingTypeId": 1,
       "customerId": 1,
       "cardNumber": "4111111111111111",
       "expiryMonth": 12,
       "expiryDate": 2030,
       "cvw": "123"
     }
     ```
   - Note: `last4Digits` is calculated from `cardNumber` automatically.
   - Returns: Created billing card record with related customer and type

3. **GET /api/billing-bank-card/[id]** - Get card record by ID
   - Returns: Card record including customer and billing type
   - 404 if not found

4. **PUT /api/billing-bank-card/[id]** - Update card record
   - Request body: partial fields to update (`billingTypeId`, `customerId`, `cardNumber`, `expiryMonth`, `expiryDate`, `cvw`)
   - Returns: Updated record
   - 404 if not found

### Examples:

```bash
# Get all billing cards
curl http://localhost:3000/api/billing-bank-card

# Get specific billing card
curl http://localhost:3000/api/billing-bank-card/1

# Update billing card
curl -X PUT http://localhost:3000/api/billing-bank-card/1 \
  -H "Content-Type: application/json" \
  -d '{"expiryMonth": 1, "expiryDate": 2033}'
```

## ProductCategory API

The ProductCategory API manages categories used to organize products.

### Endpoints:

1. **GET /api/product-category** - Get all categories
   - Returns: Array of categories including link count

2. **POST /api/product-category** - Create new category
   - Request body:
     ```json
     {
       "productCategoryName": "string",
       "description": "string (optional)",
       "comment": "string (optional)",
       "createdBy": "string (optional)"
     }
     ```
   - 409 if category name exists

3. **GET /api/product-category/[id]** - Get specific category by ID
   - 404 if not found

4. **PUT /api/product-category/[id]** - Update category
   - Request body: partial fields (`productCategoryName`, `description`, `comment`, `modifiedBy`)
   - 409 if new name conflicts

5. **PATCH /api/product-category/[id]** - Partially update category (same behavior as PUT)
   - Request body: partial fields (`productCategoryName`, `description`, `comment`, `modifiedBy`)
   - 409 if new name conflicts

6. **DELETE /api/product-category/[id]** - Delete category
   - 409 if linked products exist
   - 404 if not found

### Examples:

```bash
# Get all categories
curl http://localhost:3000/api/product-category

# Create category
curl -X POST http://localhost:3000/api/product-category \
  -H "Content-Type: application/json" \
  -d '{
    "productCategoryName": "Electronics",
    "description": "Gadgets and devices"
  }'

# Get category
curl http://localhost:3000/api/product-category/1

# Update category
curl -X PUT http://localhost:3000/api/product-category/1 \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}'

# Delete category
curl -X DELETE http://localhost:3000/api/product-category/1
```

## ProductImport API

The ProductImport API tracks inventory imports and updates product stock via admin import workflow.

### Endpoints:

1. **GET /api/product-import** - get all import records
2. **POST /api/product-import** - create a new import entry
   - Request body:
     ```json
     {
       "productId": 1,
       "priceIn": 20.5,
       "quantity": 100,
       "createdBy": "admin"
     }
     ```
3. **GET /api/product-import/[id]** - get a import entry by ID
4. **PATCH /api/product-import/[id]** - update an import entry (partial)
5. **PUT /api/product-import/[id]** - alias for PATCH
6. **DELETE /api/product-import/[id]** - delete import entry

### Examples:

```bash
curl http://localhost:3000/api/product-import
curl -X POST http://localhost:3000/api/product-import \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"priceIn":20.5,"quantity":100}'
curl http://localhost:3000/api/product-import/1
curl -X PATCH http://localhost:3000/api/product-import/1 -H "Content-Type: application/json" -d '{"quantity":120}'
curl -X DELETE http://localhost:3000/api/product-import/1
```

## ProductStorage API

The ProductStorage API tracks actual product stock quantity. Admin import logic adjusts existing storage or creates it.

### Endpoints:

1. **GET /api/product-storage** - get all storage entries
2. **POST /api/product-storage** - create storage record
   - Request body:
     ```json
     {
       "productId": 1,
       "quantity": 100,
       "createdBy": "admin"
     }
     ```
3. **GET /api/product-storage/[id]** - get specific storage entry
4. **PATCH /api/product-storage/[id]** - update storage quantity / product links
5. **PUT /api/product-storage/[id]** - alias for PATCH
6. **DELETE /api/product-storage/[id]** - delete storage record

### Examples:

```bash
curl http://localhost:3000/api/product-storage
curl -X POST http://localhost:3000/api/product-storage \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":100}'
curl http://localhost:3000/api/product-storage/1
curl -X PATCH http://localhost:3000/api/product-storage/1 -H "Content-Type: application/json" -d '{"quantity":150}'
curl -X DELETE http://localhost:3000/api/product-storage/1
```

## Admin Interface

The application includes a comprehensive admin interface for managing products, categories, inventory, and related data. Access to admin features requires authentication with admin role privileges.

### Main Page Navigation

- **Admin Panel Button**: Available on the home page (`/`) for users with admin role
- Provides direct access to product management functionality

### Admin Pages Structure

The admin interface is organized into two main sections:

#### 1. Product Management (`/admin`)
- **Product CRUD**: Create, read, update, and delete products
- **Category Management**: Manage product categories with CRUD operations
- **Product Images**: Add and remove product images
- **Navigation**: 
  - "← Home" button to return to main page
  - "Inventory Management →" button to access inventory features

#### 2. Inventory Management (`/admin/inventory`)
- **Product Imports**: Track inventory imports with price and quantity
- **Product Storage**: Monitor current stock levels
- **Import Logic**: When creating imports, automatically:
  - Creates new storage record if product has no existing stock
  - Updates existing storage by adding import quantity to current stock
- **Navigation**:
  - "← Home" button to return to main page
  - "← Product Management" button to access product features

### Navigation Flow

```
Home Page (/)
├── Admin Panel → Product Management (/admin)
│   ├── Home (/)
│   └── Inventory Management → (/admin/inventory)
│       ├── Home (/)
│       └── Product Management (/)
```

### Admin Access Requirements

- Users must be authenticated and have `role: 'admin'` to access admin pages
- Non-admin users see "Access denied" message on admin routes
- Admin role is assigned during user registration or updated by database administrators

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
