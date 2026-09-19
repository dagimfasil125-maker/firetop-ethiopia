const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const ORDERS_FILE = path.join(__dirname, "orders.json");

if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, "[]");
}

app.use(express.json());
app.use(express.static(__dirname));

const sessions = new Map();

const USERS = {
  nati: process.env.NATI_PASSWORD || "CHANGE_ME",
  dagim: process.env.DAGIM_PASSWORD || "CHANGE_ME"
};

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.substring(7);

  if (!sessions.has(token)) {
    return res.status(401).json({ error: "Session expired" });
  }

  req.user = sessions.get(token);
  next();
}

function createOrderId() {
  return "FT-" + Date.now().toString(36).toUpperCase() + "-" +
    crypto.randomBytes(2).toString("hex").toUpperCase();
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!USERS[username] || USERS[username] !== password) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  const token = crypto.randomBytes(32).toString("hex");

  sessions.set(token, username);

  res.json({
    success: true,
    token,
    username
  });
});

app.post("/api/logout", auth, (req, res) => {
  const token = req.headers.authorization.substring(7);
  sessions.delete(token);

  res.json({ success: true });
});

app.post("/api/orders", (req, res) => {
  const {
    playerId,
    playerName,
    phone,
    package: diamondPackage,
    amount
  } = req.body;

  if (!playerId || !playerName || !phone || !diamondPackage || !amount) {
    return res.status(400).json({
      error: "Please complete all fields"
    });
  }

  const orders = readOrders();

  const order = {
    orderId: createOrderId(),
    playerId,
    playerName,
    phone,
    package: diamondPackage,
    amount,
    paymentStatus: "Pending",
    orderStatus: "Pending Payment",
    message: "Please complete your Telebirr payment. Your payment will be manually verified.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.unshift(order);
  saveOrders(orders);

  res.json({
    success: true,
    orderId: order.orderId,
    order
  });
});

app.get("/api/orders", auth, (req, res) => {
  res.json(readOrders());
});

app.get("/api/order-status", (req, res) => {
  const { orderId, phone } = req.query;

  if (!orderId || !phone) {
    return res.status(400).json({
      error: "Order ID and phone are required"
    });
  }

  const orders = readOrders();

  const order = orders.find(
    o => o.orderId === orderId && o.phone === phone
  );

  if (!order) {
    return res.status(404).json({
      error: "Order not found"
    });
  }

  res.json(order);
});

app.patch("/api/orders/:id/status", auth, (req, res) => {
  const { action } = req.body;
  const orderId = req.params.id;

  const orders = readOrders();

  const order = orders.find(o => o.orderId === orderId);

  if (!order) {
    return res.status(404).json({
      error: "Order not found"
    });
  }

  if (action === "verify") {
    order.paymentStatus = "Verified";
    order.orderStatus = "Processing";
    order.message =
      "Your payment has been verified. Your top-up is being processed. We will be in touch shortly.";
  }

  else if (action === "complete") {
    order.paymentStatus = "Verified";
    order.orderStatus = "Completed";
    order.message =
      "Your Free Fire top-up has been completed successfully.";
  }

  else if (action === "cancel") {
    order.paymentStatus = "Not Verified";
    order.orderStatus = "Cancelled";
    order.message =
      "We could not confirm your payment, so this order has been cancelled. If you already paid, please contact us with your payment reference. We will be in touch shortly.";
  }

  else {
    return res.status(400).json({
      error: "Invalid action"
    });
  }

  order.updatedAt = new Date().toISOString();

  saveOrders(orders);

  res.json({
    success: true,
    order
  });
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.listen(PORT, () => {
  console.log(`FireTop server running on port ${PORT}`);
});