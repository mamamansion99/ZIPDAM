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

Reserved for future detailed point transactions:

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

The current backend endpoint `customer_summary` calculates lifetime spend from Orders and returns active rewards whose `RequiredSpend` has been reached.

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

## Script Properties

Configure these in Apps Script Project Settings > Script Properties:

```text
SHEET_ID
LINE_LOGIN_CHANNEL_ID
LINE_MESSAGING_TOKEN
N8N_WEBHOOK_URL
ADMIN_LINE_USER_ID
FIXED_SHIPPING
LOW_ORDER_SHIPPING
SHIPPING_THRESHOLD
ALLOW_GUEST_ORDERS
ALLOW_LINE_ID_MISMATCH
LAST_ORDER_NO
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

Orders created from the owner's LINE account are counted under the owner's LINE ID unless the app later implements a secure admin customer-selection flow.

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
