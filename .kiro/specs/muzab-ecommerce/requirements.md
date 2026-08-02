# Requirements Document

## Introduction

Muzab is a saffron and natural products ecommerce brand based in Srinagar, J&K, India. The platform sells premium Kashmiri saffron, natural oils, skincare, and spices. The website is a full-stack ecommerce solution built with React JS (frontend) and Express JS (backend), styled with a warm brand palette (Saffron Orange #E67E22 for primary actions, Maroon #800020 for headers/navigation, Gold #D4AF37 for accents, Cream #FAF3E0 for backgrounds, Warm Gray #6B6560 for secondary text). Business contact: +91-9086660267.

---

## Glossary

- **System**: The Muzab ecommerce web application
- **Customer**: A registered or guest user browsing and purchasing products
- **Admin**: An authorized staff member managing the store via the admin panel
- **Product**: A saffron or natural product listed for sale (e.g., saffron, natural oils, skincare, spices)
- **Cart**: A temporary collection of products a Customer intends to purchase
- **Order**: A confirmed purchase transaction placed by a Customer
- **Catalog**: The full collection of Products available on the platform
- **Auth_Service**: The authentication and session management subsystem
- **Cart_Service**: The subsystem managing Cart state and operations
- **Order_Service**: The subsystem handling Order creation, tracking, and management
- **Payment_Gateway**: The third-party payment integration (Razorpay or similar India-compatible gateway)
- **Admin_Panel**: The restricted interface for Admin users to manage the store
- **Search_Service**: The subsystem handling product search and filtering
- **Notification_Service**: The subsystem sending email/SMS confirmations to Customers and Admins
- **Rate_Limiter**: Middleware preventing brute-force and abuse on auth (15 req/15 min), checkout (20 req/10 min), and general API (200 req/min) endpoints.
- **confirmationToken**: A cryptographically random token attached to each order, used to generate a guest-accessible order confirmation URL.

---

## Requirements

### Requirement 1: Product Catalog

**User Story:** As a Customer, I want to browse a catalog of saffron and natural products, so that I can discover and evaluate items before purchasing.

#### Acceptance Criteria

1. THE System SHALL display a homepage featuring a hero banner, featured products, and product categories styled with the Muzab brand palette.
2. WHEN a Customer visits the catalog page, THE System SHALL display all active Products with name, image, price, and short description.
3. WHEN a Customer selects a product category, THE Search_Service SHALL filter and display only Products belonging to that category.
4. WHEN a Customer enters a search query, THE Search_Service SHALL return Products whose name or description matches the query within 500ms.
5. WHEN a Customer opens a product detail page, THE System SHALL display the full product name, images (gallery), description, ingredients/materials, price, stock availability, and an "Add to Cart" button.
6. WHILE a Product is out of stock, THE System SHALL display an "Out of Stock" indicator and disable the "Add to Cart" button for that Product.
7. THE System SHALL support product variants (e.g., size, weight) where applicable, and THE System SHALL display the price and stock status per variant.
8. THE System SHALL display customer reviews and average star rating on each product detail page.

---

### Requirement 2: Shopping Cart

**User Story:** As a Customer, I want to manage a shopping cart, so that I can collect products and review my selection before checkout.

#### Acceptance Criteria

1. WHEN a Customer clicks "Add to Cart", THE Cart_Service SHALL add the selected Product and variant to the Customer's Cart and update the cart item count in the navigation.
2. WHEN a Customer views the Cart, THE Cart_Service SHALL display all Cart items with product name, image, variant, unit price, quantity, and line total.
3. WHEN a Customer updates the quantity of a Cart item, THE Cart_Service SHALL recalculate and display the updated line total and Cart subtotal.
4. WHEN a Customer removes an item from the Cart, THE Cart_Service SHALL remove that item and recalculate the Cart subtotal.
5. THE Cart_Service SHALL persist the Cart for authenticated Customers across browser sessions.
6. IF a Product becomes out of stock after being added to the Cart, THEN THE Cart_Service SHALL display a warning on the Cart page indicating the item is no longer available.
7. THE Cart_Service SHALL display the Cart subtotal, applicable taxes (GST), and estimated total before checkout.

---

### Requirement 3: User Authentication

**User Story:** As a Customer, I want to register and log in to my account, so that I can track orders and save my preferences.

#### Acceptance Criteria

1. WHEN a new Customer submits a valid registration form (name, email, password, phone), THE Auth_Service SHALL create a new Customer account and send a verification email.
2. WHEN a Customer submits valid login credentials, THE Auth_Service SHALL authenticate the Customer and issue a session token valid for 7 days.
3. IF a Customer submits invalid login credentials, THEN THE Auth_Service SHALL return an error message and SHALL NOT reveal whether the email or password was incorrect.
4. WHEN a Customer requests a password reset, THE Auth_Service SHALL send a time-limited reset link (valid for 1 hour) to the registered email address.
5. WHEN a Customer clicks a valid password reset link, THE Auth_Service SHALL allow the Customer to set a new password.
6. IF a password reset link has expired, THEN THE Auth_Service SHALL display an expiry message and prompt the Customer to request a new link.
7. THE Auth_Service SHALL enforce a minimum password length of 8 characters containing at least one uppercase letter, one lowercase letter, and one digit.
8. WHEN a Customer logs out, THE Auth_Service SHALL invalidate the session token and redirect the Customer to the homepage.
9. WHERE social login is enabled, THE Auth_Service SHALL support Google OAuth 2.0 as an authentication option.

---

### Requirement 4: Checkout

**User Story:** As a Customer, I want to complete a checkout process, so that I can place an order for the products in my Cart.

#### Acceptance Criteria

1. WHEN a Customer initiates checkout, THE System SHALL present a single-page layout containing contact information, delivery address, and payment all on one screen.
2. Guest checkout is the DEFAULT flow — THE System SHALL NOT require a Customer to create an account or log in at any point during checkout. Guests must provide an email address for order confirmation and tracking.
3. WHEN a Customer submits a delivery address, THE System SHALL validate that all required fields (name, address line 1, city, state, PIN code, phone) are present and correctly formatted.
4. IF a Customer's PIN code is outside the serviceable delivery area, THEN THE System SHALL display a message indicating delivery is unavailable to that location.
5. WHEN a Customer reaches the payment section, THE System SHALL display the order summary including items, subtotal, shipping fee, GST, and grand total.
6. WHEN a Customer completes payment via THE Payment_Gateway, THE Order_Service SHALL create a new Order with status "Confirmed" and THE Notification_Service SHALL send an order confirmation email and SMS to the Customer.
7. IF the Payment_Gateway returns a payment failure, THEN THE System SHALL display a failure message and allow the Customer to retry payment without losing Cart contents.
8. THE System SHALL support Cash on Delivery (COD) as a payment option for eligible PIN codes.
9. WHEN a guest Customer completes an order, THE System SHALL send a unique confirmation URL to their email address, allowing them to view the order without creating an account. After successful order placement, the guest Customer SHALL be redirected to an Order Confirmation page accessible via a unique token URL, with no login required.

---

### Requirement 5: Payment Integration

**User Story:** As a Customer, I want to pay securely using Indian payment methods, so that I can complete my purchase conveniently.

#### Acceptance Criteria

1. THE Payment_Gateway SHALL support UPI, credit/debit cards, net banking, and wallets (via Razorpay or equivalent India-compatible gateway).
2. WHEN a Customer initiates payment, THE System SHALL redirect or embed the Payment_Gateway checkout in a secure context (HTTPS).
3. WHEN THE Payment_Gateway confirms a successful transaction, THE Order_Service SHALL record the payment reference ID against the Order.
4. IF THE Payment_Gateway returns a timeout or network error, THEN THE Order_Service SHALL mark the Order as "Payment Pending" and THE Notification_Service SHALL notify the Admin.
5. THE System SHALL never store raw card details; all payment data SHALL be handled exclusively by THE Payment_Gateway.
6. WHEN a refund is initiated by an Admin, THE Payment_Gateway SHALL process the refund and THE Order_Service SHALL update the Order status to "Refunded".

---

### Requirement 6: Order Management (Customer)

**User Story:** As a Customer, I want to view and track my orders, so that I can stay informed about my purchase status.

#### Acceptance Criteria

1. WHEN an authenticated Customer visits "My Orders", THE Order_Service SHALL display a list of all past Orders with order ID, date, status, and total amount.
2. WHEN a Customer selects an Order, THE Order_Service SHALL display the full order detail including items, delivery address, payment method, and current status.
3. WHEN an Order status changes, THE Notification_Service SHALL send an email notification to the Customer with the updated status.
4. WHEN a Customer requests order cancellation before the Order status is "Shipped", THE Order_Service SHALL cancel the Order and initiate a refund if payment was made online.
5. IF a Customer attempts to cancel an Order with status "Shipped" or later, THEN THE System SHALL display a message that cancellation is no longer available and provide the customer support contact (+91-9086660267).
6. WHEN a guest Customer visits "My Orders" and enters the email used at checkout, THE Order_Service SHALL display all orders associated with that email address.
7. WHEN a Customer completes an order (guest or authenticated), THE System SHALL display an Order Confirmation page accessible via a secure token URL, showing order details without requiring login.

---

### Requirement 7: Admin Panel

**User Story:** As an Admin, I want a management dashboard, so that I can manage products, orders, and customers efficiently.

#### Acceptance Criteria

1. WHEN an Admin logs in with valid Admin credentials, THE Auth_Service SHALL grant access to THE Admin_Panel and SHALL deny access to all non-Admin users.
2. THE Admin_Panel SHALL display a dashboard with summary metrics: total orders today, total revenue, low-stock products, and new customer registrations.
3. WHEN an Admin creates a new Product, THE Admin_Panel SHALL require name, category, description, price, stock quantity, images, and variant configuration before saving.
4. WHEN an Admin updates a Product's price or stock, THE System SHALL reflect the change on the storefront within 5 seconds.
5. WHEN an Admin changes an Order status (e.g., Confirmed → Processing → Shipped → Delivered), THE Order_Service SHALL update the Order record and THE Notification_Service SHALL notify the Customer.
6. THE Admin_Panel SHALL allow an Admin to search and filter Orders by status, date range, and customer name or email.
7. THE Admin_Panel SHALL allow an Admin to view, search, and export the Customer list.
8. WHEN an Admin initiates a refund from THE Admin_Panel, THE Order_Service SHALL trigger the refund via THE Payment_Gateway and update the Order status.
9. THE Admin_Panel SHALL display a low-stock alert for any Product with stock quantity below a configurable threshold (default: 5 units).
10. THE Admin_Panel SHALL display guest orders alongside registered customer orders, showing the guest email address.
11. THE Admin_Panel SHALL allow searching orders by guest email address.

---

### Requirement 8: Responsive Design and Branding

**User Story:** As a Customer, I want a visually consistent and mobile-friendly experience, so that I can shop comfortably on any device.

#### Acceptance Criteria

1. THE System SHALL render correctly on viewport widths from 320px (mobile) to 1440px (desktop) without horizontal scrolling or layout breakage.
2. THE System SHALL apply the Muzab brand palette: Saffron Orange (#E67E22) for primary actions, Maroon (#800020) for headers and navigation, Gold (#D4AF37) for accents and highlights, Cream (#FAF3E0) for page backgrounds, and Warm Gray (#6B6560) for secondary text.
3. THE System SHALL display the Muzab brand name, logo, and contact number (+91-9086660267) in the site header and footer.
4. THE System SHALL display the business address (Srinagar, J&K, India) and contact details in the footer on all pages.
5. THE System SHALL achieve a Lighthouse performance score of 80 or above on mobile for the homepage and product listing page.
6. WHEN a Customer navigates the site on a touch device, THE System SHALL provide touch-friendly tap targets with a minimum size of 44x44 CSS pixels.

---

### Requirement 9: Product Reviews

**User Story:** As a Customer, I want to read and submit product reviews, so that I can make informed purchase decisions and share my experience.

#### Acceptance Criteria

1. WHEN an authenticated Customer who has purchased a Product submits a review (1–5 star rating and text), THE System SHALL save the review and display it on the product detail page.
2. IF a Customer attempts to submit a review for a Product they have not purchased, THEN THE System SHALL display a message indicating that only verified buyers can review.
3. WHEN a new review is submitted, THE System SHALL recalculate and update the average star rating displayed on the product detail page.
4. THE Admin_Panel SHALL allow an Admin to approve or remove reviews before they are publicly visible.

---

### Requirement 10: Notifications

**User Story:** As a Customer and Admin, I want timely notifications, so that I stay informed about order activity and store events.

#### Acceptance Criteria

1. WHEN an Order is confirmed, THE Notification_Service SHALL send an order confirmation email to the Customer within 60 seconds of Order creation.
2. WHEN an Order status is updated by an Admin, THE Notification_Service SHALL send a status update email to the Customer within 60 seconds.
3. WHEN a Product's stock falls below the configured low-stock threshold, THE Notification_Service SHALL send an alert email to the Admin.
4. WHEN a Customer registers, THE Notification_Service SHALL send a welcome email containing the brand name, contact details, and a link to the product catalog.

---

### Requirement 11: Shipping

**User Story:** As a Customer, I want to know the shipping cost and have my order delivered anywhere in India, so that I can shop regardless of my location.

#### Acceptance Criteria

1. THE System SHALL accept delivery addresses for any valid 6-digit Indian PIN code.
2. WHERE a PIN code is in the configured serviceable area (J&K, major cities), THE System SHALL apply the configured shipping fee for that area.
3. WHERE a PIN code is not in the configured serviceable area, THE System SHALL apply a flat shipping fee of ₹99.
4. WHERE a PIN code is explicitly marked as non-serviceable in the system, THE System SHALL reject checkout with a delivery-unavailable message.
5. THE System SHALL display free shipping messaging for orders above ₹999 where applicable.

---

## Correctness Properties

- **Property 32 — Guest checkout completion:** For any guest checkout with a valid email, delivery address, and payment, THE Order_Service SHALL create an order with `guestEmail` set and a `confirmationToken` generated. The confirmation endpoint with that token SHALL return the order details.
- **Property 33 — Pan-India shipping fallback:** For any valid 6-digit PIN code not explicitly marked unserviceable, the shipping fee SHALL be either the configured fee (if in the serviceable database) or ₹99 (flat rate fallback). No valid PIN SHALL be rejected unless explicitly marked `isServiceable: false`.
- **Property 34 — Rate limit enforcement:** For any IP making more than 15 auth requests within 15 minutes, subsequent requests SHALL receive HTTP 429. For checkout endpoints, the limit is 20 requests per 10 minutes.
- **Property 35 — Duplicate review prevention:** For any user who has already submitted a review for a product, a second submission for the same product SHALL be rejected with HTTP 409 CONFLICT, regardless of rating or text content.
