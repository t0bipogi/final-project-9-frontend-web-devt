# Contact Management System – Frontend

React + Vite + React Router + Axios. Minimalist UI for the MERN Contact Management System (Group 9, C3A).

## Run

```bash
npm install
npm run dev
```

Opens at http://localhost:5173. In development, requests to `/api/*` are proxied to
`http://localhost:5000` (see `vite.config.js`). For a deployed backend, copy `.env.example`
to `.env` and set `VITE_API_URL`.

## Pages

| Route               | Access     | What it does                                              |
|---------------------|------------|-----------------------------------------------------------|
| /                   | Guests     | Landing page (signed-in users are sent to /contacts)      |
| /login, /register   | Guests     | Sign in / create account (with form validation)           |
| /contacts           | Any user   | Contacts: add, edit, delete, search, category filter, favorites |
| /profile            | Any user   | Edit own name, email, password                            |
| /admin/users        | Admin      | View, edit, deactivate/activate, delete users             |
| /admin/categories   | Admin      | Add, rename, delete shared categories                     |

## Backend contract this frontend expects

- `POST /api/auth/login` → `{ token, user: { _id, name, email, role } }`
- `POST /api/auth/register` → `{ token, user }` (or just a success; the app then logs in)
- `GET /api/contacts` → array of the signed-in user's contacts (`category` may be an id or populated object)
- `POST/PUT /api/contacts` → the saved contact
- `GET /api/categories` → array (readable by every signed-in user)
- `GET /api/users` (admin) → array of users
- `PUT /api/users/:id` → the updated user. Admin "deactivate" sends `{ isActive: false }`,
  so add `isActive: { type: Boolean, default: true }` to the User schema and block login when false.
- JWT is sent as `Authorization: Bearer <token>`. Any 401 outside `/auth/*` signs the user out.
- Errors are read from `response.data.message`.

Search is done instantly in the browser over the loaded contacts, so no query params are needed.
