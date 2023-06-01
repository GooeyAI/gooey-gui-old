# Gooey-GUI Quickstart

1. Install Node lts version (v18) using [nvm](https://github.com/nvm-sh/nvm)
2. Install redis (if you don't already) using [brew](https://redis.io/docs/getting-started/installation/install-redis-on-mac-os/)
3. Clone this repo
4. Install dependencies
```bash
npm install
```
5. Copy .env file
```bash
cp .env.example .env
```
6. Either start the [python server](https://github.com/dara-network/ddgai/) on `localhost:8080`, or if you're lazy, use the test server in `.env` -
```bash
SERVER_HOST=https://gooey-test.us-1.gooey.ai
```
7. Start remix server
```bash
npm run dev
```
8. Open [localhost:3000](http://localhost:3000) in your browser

## Notes

- `base.tsx` -> List of React components

- `custom.css` -> Designer's css styles

- `app.css` -> Our css styles

- `app.tsx` -> Business logic for calling python APIs, and rendering components  
