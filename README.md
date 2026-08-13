# liquorpos

Point of Sales app with React frontend and Express + MongoDB backend.

## Folders

- `frontend/` — Vite React UI (port **3000**)
- `backend/` — Express API + MongoDB (port **5000**)

## Setup

### 1. Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

API: http://localhost:5000  
MongoDB: `mongodb://127.0.0.1:27017/liquorpos`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI: http://localhost:3000  
Login: `admin` / `admin` (from MongoDB users collection)

## Seeded data

- **User:** admin / admin
- **Categories:** Vodka, Whisky, Rum, Gin
- **Products:** 41 liquor items
- **Customers:** Kishana, John Doe, James, Maria, Alex
- **Sales:** sample orders linked to customers

## API

### Auth
- `POST /api/auth/login`

### Products
- `GET /api/categories`
- `GET /api/products`
- `GET /api/products/by-category`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Customers
- `GET /api/customers`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

### Sales
- `GET /api/sales`
- `GET /api/sales/stats`
- `GET /api/sales/top-products`
- `POST /api/sales`
- `DELETE /api/sales/:id`
