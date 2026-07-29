import assert from "node:assert/strict";
import handler from "../api/admin.js";

let forwardedPayload;
global.fetch = async (_url, options) => {
  forwardedPayload = JSON.parse(options.body);
  return new Response(
    JSON.stringify({
      ok: true,
      orderId: "ODTEST",
      orderMode: "ADMIN",
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
};

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}

const response = createResponse();
await handler(
  {
    method: "POST",
    body: {
      action: "admin_order",
      idToken: "token",
      lineUserId: `U${"a".repeat(32)}`,
      selectedCustomerId: `U${"b".repeat(32)}`,
      store: "Store",
      cart: [
        {
          id: "SKU-1",
          brand: "Browser brand",
          name: "Browser name",
          size: "Browser size",
          qty: 2,
          price: 1,
        },
      ],
    },
  },
  response,
);

assert.equal(response.statusCode, 200);
assert.equal(response.body.ok, true);
assert.equal(forwardedPayload.action, "admin_order");
assert.equal(forwardedPayload.cart[0].SKU, "SKU-1");
assert.equal(forwardedPayload.cart[0].qty, 2);
assert.equal("price" in forwardedPayload.cart[0], false);

const invalidResponse = createResponse();
await handler(
  {
    method: "POST",
    body: { action: "not_admin_action" },
  },
  invalidResponse,
);
assert.equal(invalidResponse.statusCode, 400);

console.log("admin API tests passed");
