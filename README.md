# WONDERMARKET

A full-featured e-commerce marketplace built with vanilla JavaScript (ES Modules),
Vite, and Supabase as the backend. Supports product browsing, cart management,
user authentication, a full admin panel, and real-time data from Supabase.

---

## ✨ Features

| Area | Details |
|---|---|
| **Products** | Grid / list view, badges (NEW · SALE · TOP), live search, lazy images |
| **Filters** | Category, price range, brand, rating, in-stock, discount toggles |
| **Sorting** | Popular · Price ↑↓ · Rating · Discount · Newest |
| **Cart** | Add / remove / quantity, persistent via localStorage, checkout flow |
| **Favourites** | Wishlist toggle, badge count, dedicated view |
| **Auth** | Login / Register with role selection (User / Admin with secret code) |
| **Admin Panel** | Dashboard · Products CRUD · Orders status · Users · Analytics · Settings |
| **Supabase** | All product data loaded from and mutated in `products` table |
| **Responsive** | Mobile-first, burger nav, collapsible sidebar |

---

## 📁 Folder Structure

```
wondermarket/
├── index.html                        # Vite entry point (HTML shell)
├── package.json
├── .gitignore
├── .prettierrc
├── README.md
│
└── src/
    ├── css/
    │   ├── main.css                  # Master stylesheet (@imports all partials)
    │   ├── variables.css             # CSS custom properties (design tokens)
    │   ├── header.css                # Header, logo, search bar, nav
    │   ├── layout.css                # Page skeleton, main content area
    │   ├── sidebar.css               # Sidebar, category list, price range
    │   ├── products.css              # Product grid, cards, hero slider
    │   ├── cart.css                  # Cart sidebar
    │   ├── modal.css                 # Product detail modal
    │   ├── auth.css                  # Auth modal (login / register)
    │   ├── auth-extras.css           # Role selector, user menu, orders modal
    │   ├── toast.css                 # Toast notifications
    │   ├── footer.css                # Footer
    │   ├── admin.css                 # Admin panel (full UI)
    │   ├── badges.css                # Product badges + load-error state
    │   └── responsive.css            # Media queries
    │
    └── js/
        ├── main.js                   # App entry: init(), DOMContentLoaded
        ├── events.js                 # All DOM event listeners in one place
        │
        ├── state/
        │   └── state.js              # Single mutable state object
        │
        ├── utils/
        │   ├── constants.js          # SITE_NAME, CATEGORIES, ORDER_STATUS_MAP
        │   ├── helpers.js            # trunc(), hilite(), lsGet/Set/Del
        │   └── storage.js            # saveAll, loadFromStorage, users, orders
        │
        ├── supabase/
        │   ├── client.js             # createClient() — single shared instance
        │   └── products-api.js       # fetchProducts, updateProduct, insertProduct, deleteProduct
        │
        ├── components/
        │   ├── products.js           # renderProductGrid, renderCard, renderStars
        │   ├── filters.js            # renderCategories, applyFiltersAndRender, filterByCategory
        │   ├── search.js             # handleSearch, renderSearchDropdown
        │   ├── cart.js               # addToCart, removeFromCart, renderCartUI, checkout
        │   ├── favorites.js          # toggleFavorite, openFavoritesView
        │   ├── modal.js              # openProductModal, closeModal
        │   ├── auth.js               # login, register, logout, updateAuthUI
        │   ├── orders.js             # openMyOrders (user order history)
        │   ├── slider.js             # Hero banner auto-play slider
        │   ├── price-range.js        # Dual-handle price slider
        │   └── ui.js                 # showToast, updateCountBadges, showLoadError
        │
        └── admin/
            ├── index.js              # openAdminPanel, renderAdminSection router
            ├── dashboard.js          # Stats cards, recent orders, top products
            ├── products.js           # Product table, form, Supabase CRUD
            ├── orders.js             # Orders table, status management
            ├── users.js              # User table, delete
            ├── analytics.js          # Charts, KPIs
            └── settings.js           # Store settings panel
```

---

## 🛠 Technologies

| Technology | Purpose |
|---|---|
| **Vanilla JS (ES Modules)** | No framework — clean native browser APIs |
| **Vite 8** | Dev server, HMR, production bundler |
| **Supabase JS v2** | PostgreSQL backend, REST/realtime API |
| **CSS Custom Properties** | Theming and design tokens |
| **localStorage** | Cart, favourites, user session, orders |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project with a `products` table (see schema below)

### Install & Run

```bash
# Clone / unzip the project
cd wondermarket

# Install dependencies
npm install

# Start the dev server
npm run dev
# → http://localhost:5173

# Build for production
npm run build

# Preview the production build
npm run preview
```

### Environment Variables

Create a local environment file using `.env.local` and set your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

A template is available in `.env.example`.

---

## 🗄 Supabase Setup

### 1. Create a project
Go to [supabase.com](https://supabase.com), create a new project.

### 2. Create the `products` table

Run this SQL in the Supabase SQL editor:

```sql
create table products (
  id          bigint generated by default as identity primary key,
  name        text          not null,
  brand       text          default '',
  category    text          not null,
  price       numeric       not null,
  old_price   numeric,
  discount    int           default 0,
  rating      numeric       default 4.5,
  reviews     int           default 0,
  image       text,
  images      jsonb         default '[]',
  description text          default '',
  in_stock    boolean       default true,
  popular     int           default 50,
  badge       text          default '',
  tags        jsonb         default '[]',
  specs       jsonb         default '{}',
  created_at  timestamptz   default now()
);

-- Enable Row Level Security (read-only for anon)
alter table products enable row level security;

create policy "Public read" on products
  for select using (true);

create policy "Admin full access" on products
  for all using (true);   -- tighten in production
```

### 3. Configure the client

The project now reads Supabase config from environment variables in `.env.local`.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

If you prefer, copy `.env.example` to `.env.local` and fill in your values.

> **Never commit real keys to public repos.**  
> Set your secrets in `.env.local` and add the same variables in your hosting dashboard.

---

## 🔐 Authentication (Demo)

Authentication is **UI-only** — credentials are stored in `localStorage`.

| Role | Email | Password |
|---|---|---|
| User | `alex@example.com` | `password123` |
| Admin | `admin@market.ua` | `admin2024` |

To register as **Admin**, tick the Admin role and enter the secret code:
```
MARKET2024
```

---

## 🚀 Deployment

### How to deploy

```bash
npm install
npm run build
npm run preview
```

### Environment variables

Your hosting provider must define the following variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These values should be configured in Netlify/Vercel/Cloudflare Pages/GitHub Pages environment settings, not committed to source control.

```

> In a production app replace this with Supabase Auth (`supabase.auth.*`).

---

## ⚙️ Module Architecture

The project follows a strict **layered architecture**:

```
index.html
  └── src/js/main.js          ← entry: init(), imports everything
        ├── state/state.js    ← single source of truth (no framework needed)
        ├── utils/            ← pure functions, no side-effects
        ├── supabase/         ← data layer: ALL DB calls isolated here
        ├── components/       ← UI logic, each file owns one concern
        ├── admin/            ← admin panel, imports from components + supabase
        └── events.js         ← all addEventListener calls in one file
```

**Key design decisions:**
- `supabase/` is the **only** layer that imports `db` — components never call Supabase directly
- Functions called from inline `onclick=""` HTML are explicitly exported to `window`
- `state.js` is imported by every module; it is **never** re-exported to avoid stale references
- Admin CRUD functions live in `admin/products.js`, not in the API layer, because they need to update both the DB and the UI

---

## 📦 Build Output

```bash
npm run build
# → dist/
#     index.html
#     assets/
#       main-[hash].js    (all JS bundled)
#       main-[hash].css   (all CSS bundled)
```

---

## 📝 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint on `src/` |
| `npm run format` | Prettier-format all JS, CSS, HTML |

---

## 📄 License

MIT — free to use, modify, and distribute.