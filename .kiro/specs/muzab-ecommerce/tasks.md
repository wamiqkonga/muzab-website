# Implementation Plan: Muzab Ecommerce Platform

## Overview

Incremental implementation of the Muzab full-stack ecommerce platform. Each task builds on the previous, ending with all components wired together. Stack: React JS (Vite) frontend, Express JS backend, MongoDB + Mongoose, Razorpay, JWT + Google OAuth 2.0, Cloudinary, Nodemailer/SendGrid, Twilio/MSG91, Jest + fast-check.

## Tasks

- [x] 1. Project scaffolding and monorepo setup
  - Create monorepo root with `client/` (Vite + React) and `server/` (Express) directories
  - Initialize `package.json` in root with workspaces, and in each sub-package
  - Configure `server/`: install express, mongoose, dotenv, cors, helmet, express-rate-limit, bcryptjs, jsonwebtoken, passport, passport-google-oauth20, razorpay, nodemailer, cloudinary, multer, csv-writer
  - Configure `client/`: install react-router-dom, axios, react-hot-toast, tailwindcss (with brand palette tokens), @headlessui/react
  - Set up `.env.example` files for both client and server with all required environment variable keys
  - Create `server/src/app.js` (Express app factory), `server/src/server.js` (entry point), and `server/src/config/db.js` (Mongoose connection)
  - _Requirements: 8.1, 8.2_

- [x] 2. MongoDB data models
  - [x] 2.1 Implement User model (`server/src/models/User.js`)
    - Fields: name, email, passwordHash, phone, role (customer/admin), googleId, isEmailVerified, emailVerificationToken, passwordResetToken, passwordResetExpiry, addresses array
    - Add pre-save hook for bcrypt hashing; add `comparePassword` instance method
    - _Requirements: 3.1, 3.2, 3.7_

  - [x] 2.2 Implement Product model (`server/src/models/Product.js`)
    - Fields: name, slug (unique), category, description, ingredients, images, basePrice, variants array, stock, isActive, averageRating, reviewCount, lowStockThreshold, tags
    - Add pre-save slug generation from name
    - _Requirements: 1.2, 1.5, 1.6, 1.7, 7.3, 7.9_

  - [x] 2.3 Implement Cart, Order, Review, and PinCode models
    - `Cart.js`: userId (nullable), sessionId, items array with price snapshots
    - `Order.js`: orderId (MZB-YYYYMMDD-XXXX), items, deliveryAddress, pricing fields, paymentMethod/Status, razorpay fields, status enum, statusHistory
    - `Review.js`: productId, userId, orderId (verified purchase), rating (1-5), text, isApproved
    - `PinCode.js`: pinCode (unique), city, state, isServiceable, codEligible, shippingFee
    - _Requirements: 2.1, 4.3, 4.4, 4.8, 5.3, 9.1_

- [x] 3. Core middleware and error handling
  - Implement `authMiddleware` (JWT verification, attach `req.user`, check token blacklist)
  - Implement `adminMiddleware` (check `req.user.role === 'admin'`)
  - Implement centralised `errorHandler` middleware returning `{ success, error: { code, message, details } }` envelope
  - Implement token blacklist store in MongoDB (`TokenBlacklist` collection with TTL index)
  - Apply `express-rate-limit` to `/api/auth/*` routes
  - _Requirements: 3.2, 3.8, 7.1_

- [x] 4. Auth service — register, login, logout, email verification
  - [x] 4.1 Implement register endpoint (`POST /api/auth/register`)
    - Validate name, email, password (min 8 chars, 1 upper, 1 lower, 1 digit), phone
    - Hash password, create User, generate email verification token, call Notification_Service welcome email
    - Return 409 on duplicate email
    - _Requirements: 3.1, 3.7, 10.4_

  - [x] 4.2 Implement login endpoint (`POST /api/auth/login`)
    - Validate credentials; return identical error for wrong email or wrong password
    - Issue JWT with `exp = iat + 7 days` and unique `jti`
    - _Requirements: 3.2, 3.3_

  - [x] 4.3 Implement logout (`POST /api/auth/logout`) and email verification (`GET /api/auth/verify-email/:token`)
    - Logout: add JWT `jti` to blacklist with TTL; redirect to homepage
    - Email verify: find user by token, set `isEmailVerified: true`, clear token
    - _Requirements: 3.8, 3.1_

  - [ ]* 4.4 Write property tests for auth — P10, P11, P12, P14
    - **Property 10: Password policy enforcement** — Validates: Requirements 3.7
    - **Property 11: Login error message uniformity** — Validates: Requirements 3.3
    - **Property 12: JWT expiry correctness** — Validates: Requirements 3.2
    - **Property 14: Token invalidation after logout** — Validates: Requirements 3.8

  - [ ]* 4.5 Write unit tests for auth service
    - Test registration validation, duplicate email, login success/failure, logout blacklist
    - _Requirements: 3.1, 3.2, 3.3, 3.8_

- [x] 5. Auth service — password reset and Google OAuth
  - [x] 5.1 Implement forgot-password and reset-password endpoints
    - `POST /api/auth/forgot-password`: generate token, set `passwordResetExpiry = now + 1h`, send reset email
    - `POST /api/auth/reset-password/:token`: validate token not expired, enforce password policy, update hash, clear token
    - _Requirements: 3.4, 3.5, 3.6, 3.7_

  - [ ]* 5.2 Implement Google OAuth 2.0 (`GET /api/auth/google`, `GET /api/auth/google/callback`)
    - Use passport-google-oauth20; upsert user by googleId/email; issue JWT on success
    - Redirect to `/login?error=oauth_failed` on OAuth error
    - _Requirements: 3.9_

  - [ ]* 5.3 Write property test for auth — P13
    - **Property 13: Password reset token expiry** — Validates: Requirements 3.4, 3.6

  - [ ]* 5.4 Write unit tests for password reset flow
    - Test token generation, expiry rejection, valid reset, policy enforcement
    - _Requirements: 3.4, 3.5, 3.6_

- [x] 6. Product API
  - [x] 6.1 Implement product list endpoint (`GET /api/products`)
    - Support query params: `category`, `search` (name/description, case-insensitive regex), `page`, `limit`
    - Return only `isActive: true` products; include name, images[0], basePrice, averageRating, stock per variant
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 6.2 Implement product detail endpoint (`GET /api/products/:slug`)
    - Return all required fields: name, images, description, ingredients, basePrice, variants, stock, averageRating, reviewCount
    - Compute `inStock` per variant and at product level
    - _Requirements: 1.5, 1.6, 1.7, 1.8_

  - [x] 6.3 Implement admin product CRUD (`POST`, `PUT /api/products/:id`, `DELETE /api/products/:id`)
    - POST: validate required fields (name, category, description, price, stock, images); generate slug
    - PUT: update fields; changes reflected immediately on storefront
    - DELETE: soft-delete (`isActive: false`)
    - _Requirements: 7.3, 7.4_

  - [ ]* 6.4 Write property tests for products — P1, P2, P3, P4, P5, P25, P26
    - **Property 1: Catalog completeness** — Validates: Requirements 1.2
    - **Property 2: Category filter exclusivity** — Validates: Requirements 1.3
    - **Property 3: Search result relevance** — Validates: Requirements 1.4
    - **Property 4: Product detail field completeness** — Validates: Requirements 1.5, 1.7
    - **Property 5: Out-of-stock invariant** — Validates: Requirements 1.6
    - **Property 25: Product creation validation** — Validates: Requirements 7.3
    - **Property 26: Product update reflected in catalog** — Validates: Requirements 7.4

  - [ ]* 6.5 Write unit tests for product service
    - Test search relevance, category filtering, slug generation, soft-delete, stock flag
    - _Requirements: 1.2, 1.3, 1.4, 1.6_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Cart API
  - [x] 8.1 Implement get cart and add item (`GET /api/cart`, `POST /api/cart/items`)
    - Resolve cart by `userId` (JWT) or `sessionId` (guest cookie); create if not exists
    - Add item: snapshot `unitPrice`, `name`, `image` from Product at time of add
    - Reject if product/variant is out of stock
    - _Requirements: 2.1, 2.2_

  - [x] 8.2 Implement update quantity and remove item (`PUT /api/cart/items/:itemId`, `DELETE /api/cart/items/:itemId`)
    - Update: recalculate lineTotal; validate stock availability
    - Remove: delete item, recalculate subtotal
    - Return updated cart with subtotal, GST (18%), grandTotal on every mutation
    - _Requirements: 2.3, 2.4, 2.7_

  - [x] 8.3 Implement cart persistence and out-of-stock warning
    - On cart retrieval, cross-check each item's current stock; flag items with `outOfStock: true` if stock = 0
    - _Requirements: 2.5, 2.6_

  - [x] 8.4 Write property tests for cart — P7, P8, P9
    - **Property 7: Cart addition round-trip** — Validates: Requirements 2.1, 2.2
    - **Property 8: Cart total calculation invariant** — Validates: Requirements 2.3, 2.4, 2.7, 4.5
    - **Property 9: Cart persistence across sessions** — Validates: Requirements 2.5

  - [x] 8.5 Write unit tests for cart service
    - Test add/update/remove, total recalculation, guest vs auth cart, out-of-stock flag
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 9. PinCode service and checkout address validation
  - Implement `server/src/services/pinCodeService.js`: `isServiceable(pin)`, `isCodEligible(pin)`, `getShippingFee(pin)`
  - Seed a sample PinCode collection (J&K + major Indian cities)
  - Implement address validation middleware used by checkout: all required fields present, pinCode is 6 digits, pinCode is serviceable
  - _Requirements: 4.3, 4.4, 4.8_

  - [ ]* 9.1 Write property tests for checkout validation — P15, P16, P17
    - **Property 15: Address validation completeness** — Validates: Requirements 4.3
    - **Property 16: PIN code serviceability gate** — Validates: Requirements 4.4
    - **Property 17: COD eligibility gate** — Validates: Requirements 4.8

- [x] 10. Order API — checkout and payment verification
  - [x] 10.1 Implement checkout endpoint (`POST /api/orders/checkout`)
    - Validate cart not empty, address, PIN serviceability
    - Decrement stock atomically with `findOneAndUpdate + $inc` and `stock >= qty` guard; return `OUT_OF_STOCK` on failure
    - Create Razorpay order via SDK; return `{ razorpayOrderId, key, amount }`
    - For COD: skip Razorpay, create Order directly with `paymentMethod: 'cod'`, `paymentStatus: 'pending'`
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.8_

  - [x] 10.2 Implement payment verification endpoint (`POST /api/orders/verify-payment`)
    - Verify Razorpay HMAC signature; on success create Order (`status: Confirmed`, `paymentStatus: paid`)
    - Store `razorpayPaymentId`, `razorpayOrderId`, `razorpaySignature` on Order
    - Call Notification_Service: order confirmation email + SMS
    - On signature mismatch return `PAYMENT_FAILED`
    - _Requirements: 4.6, 4.7, 5.2, 5.3, 5.5_

  - [ ]* 10.3 Write property tests for orders — P18, P19
    - **Property 18: Order creation on payment confirmation** — Validates: Requirements 4.6, 5.3
    - **Property 19: No raw card data in order records** — Validates: Requirements 5.5

  - [ ]* 10.4 Write integration tests for checkout flow
    - Test full checkout: cart to address to Razorpay mock to verify to order created
    - Test COD path, stock race condition, invalid PIN rejection
    - _Requirements: 4.1, 4.4, 4.7, 4.8_

- [x] 11. Order API — list, detail, cancel, and refund
  - [x] 11.1 Implement order list and detail endpoints (`GET /api/orders`, `GET /api/orders/:id`)
    - Filter by `req.user._id`; never return other customers' orders
    - _Requirements: 6.1, 6.2_

  - [x] 11.2 Implement order cancellation (`POST /api/orders/:id/cancel`)
    - Allow cancel only if status is `Confirmed` or `Processing`; reject with `CANCELLATION_DENIED` for `Shipped` and later
    - If `paymentStatus: paid`, initiate Razorpay refund and set `paymentStatus: refunded`, `status: Refunded`
    - Call Notification_Service with updated status
    - _Requirements: 6.4, 6.5_

  - [ ]* 11.3 Write property tests for orders — P20, P21, P22, P23
    - **Property 20: Refund status transition** — Validates: Requirements 5.6, 7.8
    - **Property 21: Order list isolation** — Validates: Requirements 6.1
    - **Property 22: Cancellation state machine** — Validates: Requirements 6.4, 6.5
    - **Property 23: Order event notifications** — Validates: Requirements 6.3, 7.5, 10.1, 10.2

  - [ ]* 11.4 Write unit tests for order state machine
    - Test all valid and invalid status transitions, refund trigger, isolation
    - _Requirements: 6.1, 6.4, 6.5_

- [x] 12. Review API
  - [x] 12.1 Implement submit review (`POST /api/reviews`)
    - Verify user has a `Delivered` order containing the product; reject with error if not
    - Save review with `isApproved: false`; recalculate `averageRating` and `reviewCount` on Product (approved reviews only)
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 12.2 Implement list reviews and admin approve/remove
    - `GET /api/reviews?productId=`: return only `isApproved: true` reviews
    - `PUT /api/reviews/:id/approve` and `DELETE /api/reviews/:id` (admin only)
    - On approve: recalculate product averageRating
    - _Requirements: 9.3, 9.4_

  - [ ]* 12.3 Write property tests for reviews — P6, P29, P30
    - **Property 6: Average rating correctness** — Validates: Requirements 1.8, 9.3
    - **Property 29: Verified-buyer review gate** — Validates: Requirements 9.1, 9.2
    - **Property 30: Review visibility gate** — Validates: Requirements 9.4

  - [ ]* 12.4 Write unit tests for review service
    - Test verified-buyer gate, rating recalculation, approval visibility
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 13. Admin API
  - [x] 13.1 Implement dashboard metrics endpoint (`GET /api/admin/dashboard`)
    - Return: total orders today, total revenue today, low-stock products (stock < threshold), new customer registrations today
    - _Requirements: 7.2, 7.9_

  - [x] 13.2 Implement admin order management
    - `GET /api/admin/orders`: support filters by status, date range, customer name/email
    - `PUT /api/admin/orders/:id/status`: append to `statusHistory`, call Notification_Service
    - `POST /api/admin/orders/:id/refund`: call Razorpay refund API, update `paymentStatus: refunded`, `status: Refunded`
    - _Requirements: 7.5, 7.6, 7.8_

  - [x] 13.3 Implement customer list and CSV export
    - `GET /api/admin/customers`: search by name/email, pagination
    - `GET /api/admin/customers/export`: stream CSV with fields: name, email, phone, registeredAt, orderCount
    - _Requirements: 7.7_

  - [ ]* 13.4 Write property tests for admin — P24, P27, P28
    - **Property 24: Admin role enforcement** — Validates: Requirements 7.1
    - **Property 27: Order filter correctness** — Validates: Requirements 7.6
    - **Property 28: Low-stock alert threshold** — Validates: Requirements 7.9, 10.3

  - [ ]* 13.5 Write integration tests for admin panel
    - Test 403 on customer JWT, 200 on admin JWT, filter correctness, CSV export format
    - _Requirements: 7.1, 7.6, 7.7_

- [x] 14. Notification service and Razorpay webhook
  - [x] 14.1 Implement Notification_Service (`server/src/services/notificationService.js`)
    - `sendOrderConfirmation(email, order)`: email via Nodemailer/SendGrid
    - `sendStatusUpdate(email, order, newStatus)`: email on status change
    - `sendWelcomeEmail(email, name)`: welcome email with brand details and catalog link
    - `sendLowStockAlert(adminEmail, product)`: low-stock alert email
    - All functions log errors but do not throw (fire-and-forget with error capture)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 14.2 Implement SMS notifications (Twilio/MSG91)
    - `sendOrderConfirmationSMS(phone, orderId)`: SMS on order confirmation
    - `sendStatusUpdateSMS(phone, newStatus)`: SMS on status change
    - _Requirements: 4.6, 6.3_

  - [x] 14.3 Implement Razorpay webhook handler (`POST /api/webhooks/razorpay`)
    - Verify HMAC signature using `X-Razorpay-Signature` header
    - Handle `payment.captured`: update Order `paymentStatus: paid`, `status: Confirmed`; call Notification_Service
    - Handle `payment.failed`: update Order `paymentStatus: failed`; notify Admin
    - _Requirements: 5.4_

  - [ ]* 14.4 Write property test for notifications — P31
    - **Property 31: Registration notification** — Validates: Requirements 3.1, 10.4

  - [ ]* 14.5 Write unit tests for notification service
    - Mock transport; verify send functions called with correct arguments and exactly once
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 15. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Frontend: project setup, routing, and theme
  - Configure Tailwind CSS with Muzab brand palette tokens in `tailwind.config.js`:
    - `saffron-red: #C0392B`, `gold: #D4A017`, `indigo-brand: #3B1F6E`, `linen: #F5F0E8`, `slate-warm: #6B7280`
  - Set up React Router v6 with all routes: `/`, `/catalog`, `/products/:slug`, `/cart`, `/checkout`, `/login`, `/register`, `/forgot-password`, `/reset-password/:token`, `/my-orders`, `/my-orders/:id`, `/admin/*`
  - Create `AuthContext` (user state, login/logout/register actions) and `CartContext` (cart state, add/update/remove actions) with `useReducer`
  - Create `client/src/services/api.js`: Axios instance with base URL, JWT interceptor (attach token), and 401 redirect
  - _Requirements: 8.1, 8.2, 3.2_

- [x] 17. Frontend: layout components
  - Implement `Header` component: Muzab logo, brand name, contact number (+91-9086660267), cart icon with item count badge, nav links, user menu (login/logout)
  - Implement `Footer` component: brand name, address (Srinagar, J&K, India), contact details, catalog link
  - Implement `Navbar` with category links and search input (debounced, 500ms)
  - Implement `MobileMenu` (slide-in drawer for mobile nav, touch-friendly 44x44px targets)
  - Apply Indigo (#3B1F6E) for header/nav, Natural Linen (#F5F0E8) for page background
  - _Requirements: 8.1, 8.3, 8.4, 8.6_

- [x] 18. Frontend: auth pages
  - [x] 18.1 Implement Login and Register pages
    - `LoginForm`: email + password fields, submit calls `POST /api/auth/login`, stores JWT in `AuthContext`, redirects to home
    - `RegisterForm`: name, email, password (with policy hint), phone; calls `POST /api/auth/register`
    - Show generic error message on login failure (do not reveal which field was wrong)
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 18.2 Implement ForgotPassword and ResetPassword pages
    - `ForgotPassword`: email input, calls `POST /api/auth/forgot-password`, shows confirmation message
    - `ResetPassword`: new password + confirm, calls `POST /api/auth/reset-password/:token`, shows expiry message if token invalid
    - _Requirements: 3.4, 3.5, 3.6_

  - [ ]* 18.3 Implement GoogleLoginButton component
    - Redirect to `GET /api/auth/google`; handle `?error=oauth_failed` query param on return
    - _Requirements: 3.9_

- [x] 19. Frontend: product catalog pages
  - [x] 19.1 Implement Home page
    - Hero banner with Saffron Red CTA button, featured products grid (6 items), category tiles
    - Fetch featured products from `GET /api/products?featured=true&limit=6`
    - _Requirements: 1.1, 8.2_

  - [x] 19.2 Implement Catalog page
    - Product grid with `ProductCard` (name, image, price, short description, "Add to Cart")
    - Category filter sidebar/chips, search bar (calls `GET /api/products?search=&category=`)
    - Pagination; "Out of Stock" badge on cards with stock = 0
    - _Requirements: 1.2, 1.3, 1.4, 1.6_

  - [x] 19.3 Implement ProductDetail page
    - `ProductGallery` (image carousel), `VariantSelector` (size/weight chips), price + stock per variant
    - "Add to Cart" button (disabled + "Out of Stock" label when stock = 0)
    - `ReviewList` with `StarRating` and average rating display
    - _Requirements: 1.5, 1.6, 1.7, 1.8_

- [x] 20. Frontend: cart
  - Implement `CartDrawer` (slide-in panel, opens on cart icon click)
  - Implement `CartItem` (product image, name, variant, unit price, quantity stepper, remove button, line total)
  - Implement `CartSummary` (subtotal, GST, estimated total, "Proceed to Checkout" CTA)
  - Show out-of-stock warning banner for flagged items (`outOfStock: true`)
  - Wire to `CartContext`; cart item count badge in Header updates reactively
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

- [x] 21. Frontend: checkout flow
  - [x] 21.1 Implement CheckoutStepper and AddressForm (step 1)
    - Three-step stepper: Address -> Review -> Payment
    - `AddressForm`: name, line1, line2, city, state, pinCode (6-digit validation), phone
    - On pinCode blur: validate serviceability via API; show "delivery unavailable" if not serviceable
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 21.2 Implement OrderReview (step 2) and PaymentStep (step 3)
    - `OrderReview`: display items, subtotal, shipping fee, GST, grand total; "Back" and "Proceed to Payment"
    - `PaymentStep`: "Pay with Razorpay" button (calls `POST /api/orders/checkout`, opens Razorpay JS SDK), COD option (if eligible)
    - On Razorpay success: call `POST /api/orders/verify-payment`; redirect to order confirmation
    - On payment failure: show error toast, keep cart intact
    - _Requirements: 4.5, 4.6, 4.7, 4.8, 5.1, 5.2_

- [x] 22. Frontend: order management pages
  - Implement `MyOrders` page: list orders (order ID, date, status badge, total); fetch `GET /api/orders`
  - Implement `OrderDetail` page: full order info (items, address, payment method, status history); "Cancel Order" button (visible only for Confirmed/Processing); show support contact (+91-9086660267) for Shipped+
  - Implement `OrderStatusBadge` component with colour-coded status labels
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 23. Frontend: admin panel
  - [x] 23.1 Implement admin Dashboard page
    - Summary cards: orders today, revenue today, low-stock count, new customers today
    - `LowStockAlert` list component; fetch `GET /api/admin/dashboard`
    - _Requirements: 7.2, 7.9_

  - [x] 23.2 Implement admin Products page
    - Product table with edit/delete actions; `ProductForm` modal (create/edit) with all required fields + image upload to Cloudinary
    - _Requirements: 7.3, 7.4_

  - [x] 23.3 Implement admin Orders page
    - `OrderTable` with filters (status dropdown, date range picker, search by customer)
    - Status update dropdown per row; "Initiate Refund" action
    - _Requirements: 7.5, 7.6, 7.8_

  - [x] 23.4 Implement admin Customers page
    - Customer table with search; "Export CSV" button calls `GET /api/admin/customers/export`
    - _Requirements: 7.7_

- [x] 24. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Wire frontend to backend and integration polish
  - [x] 25.1 Connect all frontend pages to live API endpoints
    - Replace any mock data with real API calls via `api.js` Axios instance
    - Ensure JWT is attached to all authenticated requests; handle 401 by redirecting to `/login`
    - _Requirements: 3.2, 6.1_

  - [x] 25.2 Implement image upload flow (Cloudinary)
    - `server/src/services/cloudinaryService.js`: upload buffer via Cloudinary SDK, return secure URL
    - Wire to admin `ProductForm` image field using multer middleware
    - _Requirements: 7.3_

  - [x] 25.3 Responsive design audit
    - Verify layout renders correctly from 320px to 1440px; fix any horizontal scroll or breakage
    - Verify all interactive elements meet 44x44px touch target minimum
    - _Requirements: 8.1, 8.6_

  - [ ]* 25.4 Write integration tests for full checkout and order flow
    - Test: add to cart -> checkout -> mock Razorpay -> verify payment -> order in DB -> notification sent
    - _Requirements: 4.6, 5.3, 10.1_

- [x] 26. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Google OAuth (5.2), SMS notifications (14.2), and GoogleLoginButton (18.3) are optional features
- Each task references specific requirements for traceability
- Property tests use fast-check with `numRuns: 100` minimum; tag format: `// Feature: muzab-ecommerce, Property {N}: {property_text}`
- All 31 correctness properties are covered: P1-P5, P25-P26 in task 6.4; P6, P29-P30 in task 12.3; P7-P9 in task 8.4; P10-P12, P14 in task 4.4; P13 in task 5.3; P15-P17 in task 9.1; P18-P19 in task 10.3; P20-P23 in task 11.3; P24, P27-P28 in task 13.4; P31 in task 14.4
