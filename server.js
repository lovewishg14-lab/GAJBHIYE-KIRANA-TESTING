const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// File paths
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const CATEGORIES_FILE = path.join(__dirname, 'data', 'categories.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// Helper functions for reading & writing data
function readJSON(filePath, defaultVal = []) {
  try {
    if (!fs.existsSync(filePath)) return defaultVal;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultVal;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// ======================== API ROUTES ========================

// 1. Get Categories with dynamic product count
app.get('/api/categories', (req, res) => {
  const categories = readJSON(CATEGORIES_FILE);
  const products = readJSON(PRODUCTS_FILE);

  const enhancedCategories = categories.map(cat => {
    let count = 0;
    if (cat.id === 'all') {
      count = products.length;
    } else {
      count = products.filter(p => p.category === cat.id).length;
    }
    return {
      ...cat,
      itemCount: count
    };
  });

  res.json({
    success: true,
    data: enhancedCategories
  });
});

// 2. Get Sections (Curated product groups)
app.get('/api/sections', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);

  const sections = [
    {
      id: 'bestsellers',
      title: "🔥 Today's Bestsellers (सुपर बचत डील्स)",
      subtitle: "Nagpur & Maharashtra's highest ordered staples at unbeatable prices",
      products: products.filter(p => p.section === 'bestsellers')
    },
    {
      id: 'daily-deals',
      title: "⚡ Lightning Kirana Deals (विशेष सवलत)",
      subtitle: "High discount items - up to 25% off MRP",
      products: products.filter(p => p.section === 'daily-deals')
    },
    {
      id: 'staples',
      title: "🌾 Pure Kitchen Staples (शुद्ध धान्य व मसाले)",
      subtitle: "Freshly sourced unadulterated dals, flours, and ground spices",
      products: products.filter(p => p.section === 'staples')
    },
    {
      id: 'featured',
      title: "🌟 Gajbhiye Special Picks (खास निवड)",
      subtitle: "Hand-curated premium dry fruits, basmati rice, and tea blends",
      products: products.filter(p => p.section === 'featured')
    }
  ];

  res.json({
    success: true,
    data: sections
  });
});

// 3. Get Products with filtering, search, and sorting
app.get('/api/products', (req, res) => {
  let products = readJSON(PRODUCTS_FILE);
  const { category, search, section, sort, inStockOnly } = req.query;

  // Filter by category
  if (category && category !== 'all') {
    products = products.filter(p => p.category === category);
  }

  // Filter by section
  if (section && section !== 'all') {
    products = products.filter(p => p.section === section);
  }

  // Filter inStock
  if (inStockOnly === 'true') {
    products = products.filter(p => p.inStock);
  }

  // Search by English name, Marathi name, brand, or description
  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.marathiName && p.marathiName.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (sort === 'price-low') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-high') {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'discount') {
    products.sort((a, b) => {
      const discA = ((a.mrp - a.price) / a.mrp) * 100;
      const discB = ((b.mrp - b.price) / b.mrp) * 100;
      return discB - discA;
    });
  } else if (sort === 'name') {
    products.sort((a, b) => a.name.localeCompare(b.name));
  }

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// 4. Get single product by ID
app.get('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const product = products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Related products from same category
  const related = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  res.json({
    success: true,
    data: {
      ...product,
      related
    }
  });
});

// 5. Add new product (Store Inventory Management)
app.post('/api/products', (req, res) => {
  const { name, marathiName, category, section, price, mrp, unit, brand, description, image, badge } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ success: false, message: 'Product name, price, and category are required' });
  }

  const products = readJSON(PRODUCTS_FILE);
  const newProduct = {
    id: `prod-${Date.now()}`,
    name,
    marathiName: marathiName || name,
    category,
    section: section || 'staples',
    price: Number(price),
    mrp: Number(mrp || price),
    unit: unit || '1 unit',
    brand: brand || 'Gajbhiye Select',
    description: description || 'Fresh high-quality grocery item from Gajbhiye Kirana.',
    badge: badge || 'New Arrival',
    rating: 5.0,
    ratingCount: 1,
    inStock: true,
    image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
  };

  products.unshift(newProduct);
  writeJSON(PRODUCTS_FILE, products);

  res.status(201).json({
    success: true,
    message: 'Product added successfully to Gajbhiye Kirana inventory',
    data: newProduct
  });
});

// 6. Toggle Stock status of a product
app.patch('/api/products/:id/toggle-stock', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const index = products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  products[index].inStock = !products[index].inStock;
  writeJSON(PRODUCTS_FILE, products);

  res.json({
    success: true,
    message: `Product is now ${products[index].inStock ? 'In Stock' : 'Out of Stock'}`,
    data: products[index]
  });
});

// 7. Delete a product
app.delete('/api/products/:id', (req, res) => {
  let products = readJSON(PRODUCTS_FILE);
  const exists = products.some(p => p.id === req.params.id);

  if (!exists) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  products = products.filter(p => p.id !== req.params.id);
  writeJSON(PRODUCTS_FILE, products);

  res.json({
    success: true,
    message: 'Product removed from store'
  });
});

// 8. Place an order (Full Checkout System)
app.post('/api/orders', (req, res) => {
  const { customer, items, paymentMethod, deliverySlot, note, promoCode, discountAmount } = req.body;

  if (!customer || !customer.name || !customer.phone || !customer.address) {
    return res.status(400).json({ success: false, message: 'Please provide complete delivery details (Name, Phone, Address)' });
  }

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'Your cart is empty' });
  }

  const products = readJSON(PRODUCTS_FILE);
  let subtotal = 0;
  let totalSavings = 0;

  const orderItems = items.map(item => {
    const prod = products.find(p => p.id === item.id) || item;
    const itemPrice = prod.price || item.price;
    const itemMrp = prod.mrp || item.mrp || itemPrice;
    const qty = Number(item.quantity) || 1;
    
    subtotal += itemPrice * qty;
    totalSavings += Math.max(0, (itemMrp - itemPrice) * qty);

    return {
      id: prod.id,
      name: prod.name,
      marathiName: prod.marathiName,
      unit: prod.unit,
      price: itemPrice,
      mrp: itemMrp,
      quantity: qty,
      itemTotal: itemPrice * qty
    };
  });

  const appliedDiscount = Number(discountAmount) || 0;
  const deliveryFee = subtotal >= 499 ? 0 : 30; // Free delivery above 499
  const grandTotal = Math.max(0, subtotal - appliedDiscount + deliveryFee);

  const orderId = `GK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = {
    orderId,
    date: new Date().toISOString(),
    customer: {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      landmark: customer.landmark || '',
      pincode: customer.pincode || '440001'
    },
    items: orderItems,
    pricing: {
      subtotal,
      promoDiscount: appliedDiscount,
      promoCode: promoCode || null,
      deliveryFee,
      totalSavings: totalSavings + appliedDiscount,
      grandTotal
    },
    paymentMethod: paymentMethod || 'Cash on Delivery (COD)',
    deliverySlot: deliverySlot || 'Standard Delivery (Today within 45 mins)',
    status: 'Confirmed - Packing at Gajbhiye Kirana Store',
    note: note || ''
  };

  const orders = readJSON(ORDERS_FILE);
  orders.unshift(newOrder);
  writeJSON(ORDERS_FILE, orders);

  // Generate WhatsApp order message link for Gajbhiye Store
  const shopPhone = "919876543210";
  let itemsText = orderItems.map(i => `• ${i.name} (${i.unit}) x ${i.quantity} = ₹${i.itemTotal}`).join('%0A');
  const waMessage = `*New Order from Gajbhiye Kirana Online!*%0A*Order ID:* ${orderId}%0A*Customer:* ${customer.name}%0A*Phone:* ${customer.phone}%0A*Address:* ${customer.address}%0A%0A*Items Ordered:*%0A${itemsText}%0A%0A*Total Amount:* ₹${grandTotal} (${newOrder.paymentMethod})%0A*Delivery Slot:* ${newOrder.deliverySlot}`;
  const whatsappUrl = `https://wa.me/${shopPhone}?text=${waMessage}`;

  res.status(201).json({
    success: true,
    message: 'Order placed successfully! Gajbhiye Kirana store has received your order.',
    data: {
      ...newOrder,
      whatsappUrl
    }
  });
});

// 9. Get Orders
app.get('/api/orders', (req, res) => {
  const orders = readJSON(ORDERS_FILE);
  res.json({
    success: true,
    count: orders.length,
    data: orders.slice(0, 20)
  });
});

// 10. Store Statistics
app.get('/api/stats', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const categories = readJSON(CATEGORIES_FILE);
  const orders = readJSON(ORDERS_FILE);

  const totalDiscount = products.reduce((acc, p) => acc + (p.mrp - p.price), 0);
  const inStockCount = products.filter(p => p.inStock).length;

  res.json({
    success: true,
    data: {
      storeName: 'Gajbhiye Kirana & General Store',
      tagline: 'आपले हक्काचे किराणा दुकान | 100% शुद्धता आणि विश्वास',
      totalProducts: products.length,
      inStockProducts: inStockCount,
      totalCategories: categories.length - 1, // exclude "all"
      ordersPlaced: orders.length,
      averageSavingsPercent: Math.round((totalDiscount / products.reduce((acc, p) => acc + p.mrp, 0)) * 100) || 15
    }
  });
});

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server with fallback port if busy
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🛒 Gajbhiye Kirana Store Backend is live!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📦 REST Endpoints:`);
  console.log(`   - GET  /api/products`);
  console.log(`   - GET  /api/categories`);
  console.log(`   - GET  /api/sections`);
  console.log(`   - POST /api/orders`);
  console.log(`   - POST /api/products`);
  console.log(`====================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const ALT_PORT = 3001;
    console.log(`Port ${PORT} is busy, retrying on port ${ALT_PORT}...`);
    app.listen(ALT_PORT, () => {
      console.log(`🛒 Gajbhiye Kirana Store running on http://localhost:${ALT_PORT}`);
    });
  } else {
    console.error(err);
  }
});
