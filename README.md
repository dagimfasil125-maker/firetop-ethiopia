# FireTop Ethiopia

## Files
- `index.html` — customer top-up page
- `admin.html` — admin login/dashboard
- `server.js` — API + order database
- `orders.json` — order storage
- `.env.example` — password configuration
- `package.json` — Node dependencies

## Run locally
1. Install Node.js.
2. Open this folder in a terminal.
3. Run `npm install`
4. Copy `.env.example` to `.env`
5. Set `NATI_PASSWORD` and `DAGIM_PASSWORD`.
6. Run `npm start`
7. Open `http://localhost:3000`
8. Admin: `http://localhost:3000/admin.html`

## Important hosting note
This version uses a local JSON file for orders. It is suitable for a simple server that has persistent storage, but many serverless hosts do not provide persistent local files. For production, replace `orders.json` with a hosted database such as Supabase/PostgreSQL.

## Telebirr
The site displays the Telebirr number `+251 911 884 892`. It does not claim a payment is verified automatically. Admin must verify the payment before marking an order completed. Automatic payment verification should use an official Telebirr/payment integration.
