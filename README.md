# Kannu ki Chai ☕
> Mobile-first live status web app built specifically for a college campus chai tapri.

Kannu ki Chai solves one everyday problem for students: **knowing whether the shop is actually open right now before walking across campus**. It provides an instant high-contrast status view for students, a dead-simple thumb-friendly operator interface for the shopkeeper, and a full management dashboard for the super admin.

---

## 🚀 Key Features

### 1. For College Students (Public View)
- **Zero Friction**: No login, no sign-up, opens directly to live status.
- **Instant Answer**: High-contrast status card showing **OPEN NOW** (neon emerald) or **CLOSED** (warm crimson) with real-time countdown ("Closes in 2h 15m" or "Opens at 4:00 PM").
- **Live Shop Notes**: Real-time ticker/announcements like *"Fresh adrak chai ready ☕🔥"* or *"Back in 15 mins ⏳"*.
- **1-Tap WhatsApp Sharing**: Share formatted live status with hostel groups & friends instantly.
- **Timings & Menu**: View daily shift schedule and live menu with sold-out tags and prices.
- **Campus Location & UPI**: Clear tapri landmark and QR / UPI payment assistance.

### 2. For the Shopkeeper (Operator View)
- **Protected by PIN**: Unlocked via discrete padlock icon.
- **Thumb-Friendly Controls**: 3 huge buttons: **Open Shop**, **Close Shop**, and **Auto Schedule**.
- **One-Tap Preset Notes**: Quick tap buttons for common status messages during rush hours.
- **Quick Stock Toggles**: Mark items In Stock or Sold Out in 1 second.
- **Zero Risk**: Cannot break settings, change shift timings, or edit prices.

### 3. For You (Super Admin / Owner View)
- **Separate Admin PIN**: Full control dashboard.
- **Access Control**: Change shopkeeper PIN, change admin PIN, or temporarily pause shopkeeper access.
- **Shift & Location Management**: Customize morning and evening shifts, weekend timings, and campus landmark text.
- **Menu Management**: Full CRUD for menu items, pricing, badges, and categories.
- **Real-Time Audit Log**: Complete timestamped trail of who changed status/notes (Shopkeeper, Super Admin, or Auto Engine).

### 4. Real-Time Sync & PWA
- **Instant Cloud Sync**: WebSocket live push updates all connected student screens in <100ms without page reload.
- **Progressive Web App (PWA)**: Installable directly on mobile home screens with offline caching support.
