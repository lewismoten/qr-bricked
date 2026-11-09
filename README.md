# qr-bricked

Create a QR code out of building blocks.

Type some text and the app lays out a QR code using brick-style pieces, with a choice of error correction level (Low 7%, Medium 15%, Quartile 25%, High 30%).

Live site: [lewismoten.github.io/qr-bricked](https://lewismoten.github.io/qr-bricked/)

## Run it locally

```sh
npm install
npm start
```

Other scripts: `npm run build` (typecheck and build) and `npm run lint`. QR codes are generated with [lean-qr](https://github.com/davidje13/lean-qr); the interface is React and Vite.
