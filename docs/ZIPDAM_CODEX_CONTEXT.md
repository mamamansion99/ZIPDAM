# ZIPDAM Codex Context

Last updated: 2026-07-29  
Primary spreadsheet: `11sUClcToFNjQXafrZUgRaLGZW3NO2-cAfSIxe2IgsoE`

## Repositories

- Frontend: `mamamansion99/ZIPDAM`
- Google Apps Script backend: `mamamansion99/ZIPDAM-backend`
- Backend entry file: `Code.js`

## Core customer rule

The canonical customer key is the LINE Messaging API user ID.

```text
customerId === lineUserId
```

A valid LINE user ID begins with `U` and contains 32 hexadecimal characters.

When the same LINE ID appears with different display names, treat every record as the same customer. Do not create a second customer because a LINE display name changed.

`GUEST-*` is not a real LINE customer ID and must not appear in customer lifetime totals or loyalty reports.

## Current checkout flow

Frontend cart submits:

```json
{
  "action": "order",
  "idToken": "LINE Login ID token",
  "lineUserId": "U...",
  "displayName": "Current LINE display name",
  "store": "Store name",
  "area": "Area",
  "phone": "Phone",
  "address": "Delivery address",
  "cart": [
    {
      "SKU": "DUR-0001",
      "Brand": "Durex",
      "Size": "Big",
      "Name": "ดูเร็กซ์ แอรี่",
      "qty": 2
    }
  ]
}
```

Frontend path currently involved:

- `components/CartSheet.tsx`
- `api/order.js`

The frontend API proxies this payload to the deployed Apps Script web app.

## Identity behaviour

1. Require and verify `idToken` before accepting a real LINE customer identity.
2. Compare the supplied `lineUserId` from LIFF profile with the verified token identity.
3. If both verified token identity and supplied LINE ID exist but differ, reject unless the Script Property `ALLOW_LINE_ID_MISMATCH=true`.
4. For a real LINE user:
   - `lineUserId = U...`
   - `customerId = same U...`
5. Guest orders may be accepted only when `ALLOW_GUEST_ORDERS=true`.
6. Guest orders get `customerId=""` and loyalty status `EXCLUDED`.
7. LINE ID tokens expire after one hour. Before admin checks or checkout, the
   frontend inspects the token expiry and starts a fresh LIFF login when needed.
8. Cart contents are stored locally so an authentication redirect does not
   discard a pending order.

## Spreadsheet schema

All Apps Script writes must map by exact header name. Never depend on fixed column numbers.

### Product

Required for ordering:

```text
SKU
Brand
Size
Name
price
```

Other supported headers:

```text
mm
pack
promo_price
image_key
active
Cost
```

Pricing rule:

```text
final price = promo_price when promo_price > 0
otherwise price
```

### Customer

```text
lineUserId
customerId
name
displayName
type
store
storeId
area
phone
defaultAddress
createdAt
lastSeenAt
note
status
linkedAt
loyaltyNote
```

For every real LINE customer:

```text
lineUserId = customerId
```

The backend performs an upsert by `lineUserId`. Existing rows are updated rather than duplicated.

### Orders

Current headers:

```text
OrderID
CreatedAt
lineUserId
displayName
customerId
store
itemsTotal
shippingFee
grandTotal
status
address
phone
note
createdByLineUserId
orderMode
loyaltyStatus
pointsEarned
rewardApplied
```

There are deliberately no `paymentStatus` or `paidAt` columns.

New normal customer order defaults:

```text
status = CONFIRMED
orderMode = SELF
loyaltyStatus = PENDING
customerId = lineUserId
createdByLineUserId = lineUserId
```

Allowed order modes:

```text
SELF
ADMIN
LEGACY
```

Admin-created orders may use either a verified LINE customer or an unlinked
manual customer:

```text
linked: lineUserId = customerId = selected customer U...
manual: lineUserId = "" and customerId = MANUAL-####
createdByLineUserId = verified admin U...
orderMode = ADMIN
linked loyaltyStatus = PENDING
manual loyaltyStatus = EXCLUDED
```

When an order earns a spend reward, `rewardApplied` stores the reward and
cycle, for example `GIFT-10000#1`.

The frontend must never create an admin order by changing `orderMode` on the
normal order payload. Admin orders use the dedicated `admin_order` action,
which verifies the acting admin and resolves the selected customer from the
Customer sheet.

### OrderItems

```text
OrderID
SKU
Brand
Size
Name
qty
unitPrice
lineTotal
Profit
Cost
```

The backend writes SKU, quantity, price, total cost and profit by header name.

### CustomerSummary

Formula-driven read-only summary sheet:

```text
customerId (LINE ID)
customerName
orderCount
productTotal
shippingTotal
lifetimeSpend
latestStore
latestPhone
```

Only IDs matching `^U` are included.

### Favorites

```text
lineUserId
SKU
Brand
Size
Name
createdAt
updatedAt
```

### Templates

```text
templateId
lineUserId
templateName
itemsJson
createdAt
updatedAt
lastUsedAt
note
```

### LoyaltyLedger

Records earned and redeemed loyalty rewards:

```text
LedgerID
CreatedAt
customerId
OrderID
Type
PurchaseAmount
Points
CreatedByLineUserId
Note
Status
```

Current spend-reward entries use:

```text
Type = EARN
PurchaseAmount = reached spend milestone
Note = REWARD:<RewardID>:CYCLE:<number>
Status = ACTIVE
```

### Rewards

```text
RewardID
RewardName
RequiredSpend
RequiredPoints
RewardType
RewardValue
Active
StartDate
EndDate
Note
```

The active `GIFT-10000` reward repeats for every 10,000 baht of eligible
product spend. Eligible spend uses `Orders.itemsTotal`, excludes shipping and
cancelled/void orders, and only applies to verified LINE customers. Manual and
guest identities are excluded.

The backend endpoint `customer_summary` calculates totals from Orders and
returns active rewards whose `RequiredSpend` has been reached using product
spend.

## LINE order-confirmation card

After an order is written successfully, the backend sends a white-and-green
LINE Flex Message to linked customers. The card contains:

```text
order ID and customer name
item names, quantities and line totals
product total, shipping and grand total
eligible cumulative product spend
progress toward the next 10,000-baht reward
new reward-earned state when a threshold is crossed
```

The backend records each reached reward cycle in `LoyaltyLedger` before
building the card. This prevents the same cycle from being earned twice.
Manual customers have no LINE destination, so their admin orders continue to
notify the admin but do not send a customer card or accrue loyalty spend.

## Backend endpoints

### GET catalog

```text
?action=catalog
```

Returns active products.

### GET health

```text
?action=health
```

Returns sheet-header validation results. Use this after any spreadsheet schema change.

### POST order

Creates one Orders row and one or more OrderItems rows.

### POST me

Creates or updates the current LINE customer. A valid `idToken` is required.

### POST customer_profile

Returns saved store, area, phone and default address.

### POST customer_profile_set

Updates customer profile by canonical LINE ID.

### POST customer_summary

Returns:

```json
{
  "customerId": "U...",
  "orderCount": 4,
  "productTotal": 2141,
  "shippingTotal": 80,
  "lifetimeSpend": 2221,
  "rewards": []
}
```

A valid `idToken` is required.

### Favorites endpoints

```text
favorites_get
favorites_add
favorites_remove
```

### Template endpoints

```text
templates_get
templates_add
templates_delete
```

### Frequent products

```text
frequent_get
```

Calculates frequently purchased products from Orders + OrderItems for the same LINE ID.

### Admin customer-order endpoints

```text
admin_status
admin_customers_search
admin_customer_create
admin_order
```

Every admin request requires a current LINE Login `idToken`. The verified token
subject must be listed in `ADMIN_LINE_USER_IDS` (or the legacy singular
`ADMIN_LINE_USER_ID`) in Script Properties.

`admin_customers_search` returns existing linked and manual customers.
`admin_customer_create` creates an unlinked Customer row using the next stable
`MANUAL-####` ID. Its `lineUserId` remains blank, `type=MANUAL`, and it is
excluded from loyalty until a future verified LINE-linking flow is completed.

`admin_order` accepts a selected linked or manual customer ID, resolves the
customer from the Customer sheet, resolves all product pricing from Product,
and writes:

```text
lineUserId = selected LINE ID, or blank for manual customers
customerId = selected LINE ID or MANUAL-####
createdByLineUserId = acting admin LINE ID
orderMode = ADMIN
loyaltyStatus = PENDING for linked, EXCLUDED for manual
```

## Script Properties

Configure these in Apps Script Project Settings > Script Properties:

```text
SHEET_ID
LINE_LOGIN_CHANNEL_ID
LINE_MESSAGING_TOKEN
N8N_WEBHOOK_URL
ADMIN_LINE_USER_ID
ADMIN_LINE_USER_IDS
FIXED_SHIPPING
LOW_ORDER_SHIPPING
SHIPPING_THRESHOLD
ALLOW_GUEST_ORDERS
ALLOW_LINE_ID_MISMATCH
LAST_ORDER_NO
LAST_MANUAL_CUSTOMER_NO
LAST_TEMPLATE_NO
```

Recommended production values:

```text
ALLOW_GUEST_ORDERS=false
ALLOW_LINE_ID_MISMATCH=false
```

Never hard-code the LINE Messaging channel access token in the repository.

## Security requirements

- Rotate any LINE Messaging token that was previously committed.
- Keep tokens only in Script Properties or deployment environment variables.
- Use the production n8n webhook URL, not `/webhook-test/`.
- Do not trust a browser-supplied customer ID without checking identity.
- Do not use a LINE display name as a primary key.
- Avoid adding private customer details to logs.

## Important existing data behaviour

Historical orders without real LINE IDs remain in Orders but do not count toward a LINE customer's lifetime spend.

Orders sharing the same real LINE ID are combined automatically even when display names differ.

Orders created from the owner's normal `SELF` flow are counted under the
owner's LINE ID. The current frontend also provides a separate secure
`ADMIN` flow for configured admins. Admins can select an existing customer or
create a manual customer. Manual customers and their orders remain excluded
from loyalty totals so that rewards are never assigned to an unverified
identity.

## Resolved spreadsheet issue

The conflicting `OrderItems!B2` ARRAYFORMULA has been removed. Apps Script writes each SKU directly into the inserted order-item row.

## Deployment checklist

1. Paste/deploy the latest `ZIPDAM-backend/Code.js`.
2. Set all required Script Properties.
3. Deploy as Web App.
4. Update the frontend `api/order.js` GAS URL if the deployment URL changes.
5. Call `GET ?action=health`.
6. Submit a test order from a non-admin LINE account.
7. Confirm:
   - Customer contains one row for the LINE ID.
   - `customerId === lineUserId`.
   - Orders row matches the current headers.
   - OrderItems rows contain SKU and totals.
   - No payment columns are recreated.
   - CustomerSummary updates automatically.

## Rules for future Codex changes

- Preserve existing sales-report sheets.
- Do not delete or rename report sheets without explicit approval.
- Do not reintroduce payment status fields.
- Always use header-name mapping for Sheets.
- Same LINE ID means same customer.
- New features must remain backward-compatible with existing Orders and OrderItems data.
