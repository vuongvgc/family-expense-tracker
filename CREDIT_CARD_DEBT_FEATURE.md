# Credit Card Debt Feature

## Tổng Quan

Tính năng tự động theo dõi nợ thẻ tín dụng khi người dùng tạo giao dịch chi tiêu bằng thẻ tín dụng.

## Chi Tiết Implementation

### 1. Database Schema

#### Enum PaymentMethod (prisma/schema.prisma)

```prisma
enum PaymentMethod {
    CASH
    BANK_TRANSFER
    CREDIT_CARD
    E_WALLET
    OTHER
}
```

#### Transaction Model

Thêm field `paymentMethod`:

```prisma
model Transaction {
    paymentMethod PaymentMethod @default(CASH)
    // ... other fields
}
```

### 2. Auto-Provisioning Logic

**File:** `app/api/transactions/route.ts`

Khi tạo transaction mới với `CREDIT_CARD` payment method:

```typescript
// 1. Tìm hoặc tạo "Credit Card Debt"
let creditCardDebt = await tx.debt.findFirst({
  where: {
    familyGroupId: session.user.familyGroupId,
    title: 'Credit Card Debt',
  },
});

// 2. Nếu chưa có, tự động tạo với remainingAmount = 0
if (!creditCardDebt) {
  creditCardDebt = await tx.debt.create({
    data: {
      title: 'Credit Card Debt',
      description: 'Tổng nợ thẻ tín dụng tự động',
      totalAmount: 0,
      remainingAmount: 0,
      status: DebtStatus.ACTIVE,
      familyGroupId: session.user.familyGroupId,
    },
  });
}

// 3. Cộng dồn số tiền transaction vào debt
await tx.debt.update({
  where: { id: creditCardDebt.id },
  data: {
    totalAmount: { increment: validatedData.amount },
    remainingAmount: { increment: validatedData.amount },
  },
});
```

### 3. Transaction Wrapper

Tất cả logic được wrap trong `prisma.$transaction()` để đảm bảo:

- Nếu tạo transaction thất bại → debt không tăng
- Nếu update debt thất bại → transaction không được tạo
- **Atomicity**: Cả hai operations thành công hoặc cả hai fail

### 4. Repayment Logic

**File:** `actions/debt.ts` (existing)

Khi user "Make Payment" cho debt này:

```typescript
// Payment được tạo thông qua makeDebtPayment action
await prisma.debt.update({
  where: { id: debtId },
  data: {
    remainingAmount: { decrement: paymentAmount },
  },
});

// Nếu trả hết: remainingAmount = 0
// Có thể update status = 'PAID' nếu remainingAmount <= 0
```

### 5. Dashboard Display

**File:** `actions/dashboard.ts`

Function `getActiveDebtsSummary()` tự động hiển thị "Credit Card Debt":

```typescript
const debts = await prisma.debt.findMany({
  where: {
    familyGroupId: user.familyGroupId,
    status: 'ACTIVE',
  },
  orderBy: {
    dueDate: 'asc',
  },
  take: 5,
});
```

Debt này sẽ xuất hiện trong dashboard summary với:

- Title: "Credit Card Debt"
- Remaining Amount: Tổng nợ hiện tại
- Progress: % đã trả (nếu có payments)

### 6. UI Components

#### Transaction Form

**File:** `components/transaction-form.tsx`

Thêm Payment Method selector:

```tsx
<Select value={formData.paymentMethod}>
  <SelectItem value='CASH'>💵 Tiền Mặt</SelectItem>
  <SelectItem value='BANK_TRANSFER'>🏦 Chuyển Khoản</SelectItem>
  <SelectItem value='CREDIT_CARD'>💳 Thẻ Tín Dụng</SelectItem>
  <SelectItem value='E_WALLET'>📱 Ví Điện Tử</SelectItem>
  <SelectItem value='OTHER'>💼 Khác</SelectItem>
</Select>
```

## Flow Diagram

```
User tạo EXPENSE transaction với CREDIT_CARD
    ↓
POST /api/transactions
    ↓
prisma.$transaction() bắt đầu
    ↓
1. Tạo Transaction record
    ↓
2. Tìm "Credit Card Debt"
    ├─ Nếu có: Lấy debt đó
    └─ Nếu không: Tạo mới với remainingAmount = 0
    ↓
3. Increment totalAmount & remainingAmount
    ↓
prisma.$transaction() commit
    ↓
Dashboard tự động hiển thị debt này
```

## Use Cases

### Case 1: First Credit Card Transaction

```
User: Tạo giao dịch 500,000 VND - Mua hàng online - CREDIT_CARD
System:
  - Tạo transaction
  - Tạo debt "Credit Card Debt" với remainingAmount = 500,000
  - Dashboard hiển thị nợ 500,000 VND
```

### Case 2: Subsequent Transactions

```
User: Tạo giao dịch 300,000 VND - Đi ăn - CREDIT_CARD
System:
  - Tạo transaction
  - Tìm thấy debt "Credit Card Debt" (hiện tại: 500,000)
  - Increment thành 800,000
  - Dashboard hiển thị nợ 800,000 VND
```

### Case 3: Payment

```
User: Make Payment 500,000 VND cho "Credit Card Debt"
System:
  - Tạo DebtPayment record
  - Decrement remainingAmount: 800,000 - 500,000 = 300,000
  - Dashboard hiển thị nợ 300,000 VND
```

### Case 4: Full Repayment

```
User: Make Payment 300,000 VND (trả hết)
System:
  - Tạo DebtPayment record
  - Decrement remainingAmount: 300,000 - 300,000 = 0
  - Status có thể update thành PAID
  - Dashboard hiển thị 0 VND hoặc ẩn debt này
```

## Benefits

1. **Tự động hóa**: Không cần user tự tạo debt cho credit card
2. **Chính xác**: Mỗi transaction credit card tự động cộng vào tổng nợ
3. **Atomic**: Đảm bảo data consistency với transaction wrapper
4. **Rõ ràng**: User luôn thấy tổng nợ credit card hiện tại
5. **Dễ quản lý**: Tất cả credit card expenses tập trung vào 1 debt record

## Testing Checklist

- [ ] Tạo transaction EXPENSE với CREDIT_CARD → Debt tự động tạo
- [ ] Tạo transaction thứ 2 → Debt tăng đúng số tiền
- [ ] Tạo transaction với payment method khác → Debt không thay đổi
- [ ] Tạo transaction INCOME với CREDIT_CARD → Debt không thay đổi
- [ ] Make payment → remainingAmount giảm đúng
- [ ] Make payment full → remainingAmount = 0
- [ ] Dashboard hiển thị đúng số nợ
- [ ] Transaction fail → Debt không tăng (atomicity)

## Future Enhancements

1. Tự động set dueDate = end of month cho Credit Card Debt
2. Notification khi gần đến dueDate
3. Separate debt cho từng thẻ credit card (nếu user có nhiều thẻ)
4. Report monthly: Tổng chi tiêu credit card
5. Limit warning: Cảnh báo khi credit card debt > threshold
