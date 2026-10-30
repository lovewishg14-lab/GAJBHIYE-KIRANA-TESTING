# 🛒 Gajbhiye Kirana & General Store (गजबिये किराणा स्टोअर्स)

A complete, modern Full-Stack grocery eCommerce platform built specifically for **Gajbhiye Kirana & General Store**.

---

## 🌟 Key Features

### 🏪 1. Authentic Grocery Categories & Products
- **Dals & Pulses (डाळी व कडधान्ये)**: Tata Sampann Toor Dal, Moong Dal, Chana Dal, Urad Dal, etc.
- **Atta, Rice & Grains (पीठ, तांदूळ आणि धान्य)**: Sharbati Atta, Daawat Basmati Rice, Nagpur Thick Poha, Sugar, etc.
- **Edible Oils & Ghee (खाद्यतेल आणि तूप)**: Amul Pure Cow Ghee, Fortune Sunlite Sunflower Oil, Saffola, etc.
- **Spices & Masalas (मसाले)**: Everest Tikhalal, Haldi, Royal Garam Masala, Jeera, Bandhani Hing, Tata Salt.
- **Dairy & Breakfast (डेअरी आणि नाश्ता)**: Amul Butter, Fresh Cow Milk, Instant breakfast items.
- **Snacks & Beverages (चहा, बिस्किटे आणि स्नॅक्स)**: Tata Tea Gold, Wagh Bakri CTC Tea, Haldiram's Bhujia, Parle-G, Maggi.
- **Cleaning & Household (घरगुती व स्वच्छता)**: Surf Excel, Vim Bar, Dettol Soap.
- **Dry Fruits & Nuts (सुका मेवा)**: California Almonds, King Cashews (काजू गर).

### 🏷️ 2. Curated Sections
- **🔥 Today's Bestsellers (सुपर बचत डील्स)**
- **⚡ Lightning Deals (विशेष सवलत)**
- **🌾 Kitchen Staples (स्वच्छ निवडलेले धान्य)**
- **🌟 Gajbhiye Special Picks (खास निवड)**

### ⚡ 3. Real-Time Shopping & Interactive Cart
- Quantity increment / decrement (`+` / `-`) counter with live update.
- Slide-over Cart Drawer with itemized price breakdown.
- **Free Home Delivery Tracker**: Visual progress bar showing unlocked Free Delivery above ₹499.
- **Coupon System**:
  - `GAJBHIYE10` - 10% Discount on all orders
  - `KIRANA50` - Flat ₹50 OFF on orders above ₹499
  - `WELCOME20` - 20% OFF Welcome Bonus

### 📱 4. Checkout & Order Generation
- Customer details (Name, WhatsApp/Phone, Full address, Landmark, Pincode).
- Time slot selection (Express 30-45 mins, Evening, Tomorrow morning).
- Payment options: Cash on Delivery (COD) or UPI QR Code on Delivery.
- Generates **unique order receipt ID** (`GK-YYYYMMDD-XXXX`).
- Direct **WhatsApp Order Link** that pre-fills order details and sends them directly to the storekeeper.

### 🛠️ 5. Store Manager / Admin Features
- In-browser **Store Manager Modal** to add new grocery products directly to the backend database.
- Dynamic persistence to `data/products.json`.
- Stock toggle and instant re-fetching.

---

## 📡 Backend REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories` | Returns all categories with live item count |
| `GET` | `/api/sections` | Returns curated grocery sections with their products |
| `GET` | `/api/products` | Query products with `category`, `section`, `search`, `sort`, `inStockOnly` |
| `GET` | `/api/products/:id` | Returns single product details with related recommendations |
| `POST` | `/api/products` | Add a new product to store inventory |
| `PATCH` | `/api/products/:id/toggle-stock` | Toggle in-stock / out-of-stock |
| `DELETE` | `/api/products/:id` | Remove a product from inventory |
| `POST` | `/api/orders` | Place a customer order, calculates bills, generates WhatsApp receipt |
| `GET` | `/api/orders` | View placed orders |
| `GET` | `/api/stats` | View store metrics (total products, savings, active orders) |

---

## 🚀 How to Run Locally

1. Open a terminal in the project directory:
   ```bash
   cd "C:\Users\ASUS\.gemini\antigravity\scratch\gajbhiye-kirana"
   ```

2. Start the server:
   ```bash
   node server.js
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
