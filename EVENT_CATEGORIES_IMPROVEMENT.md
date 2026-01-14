# Cải Tiến: Danh Mục Theo Sự Kiện (Event-Specific Categories)

## Vấn Đề Ban Đầu

Các danh mục Tết được hardcode trong code, không linh hoạt và khó mở rộng cho các loại sự kiện khác.

## Giải Pháp Mới ✅

### 1. Cập Nhật Database Schema

**Thêm trường `eventType` vào Category:**

```prisma
model Category {
  id        String          @id @default(cuid())
  name      String
  type      TransactionType
  icon      String
  eventType EventType?      // 🆕 Optional: TET, TRAVEL, OTHER, or null (general)
  // ... other fields
}
```

**Ý nghĩa:**

- `eventType = TET`: Danh mục dành riêng cho Tết (🧧 Lì xì, 🛍️ Sắm đồ Tết, etc.)
- `eventType = TRAVEL`: Danh mục dành cho Du lịch (✈️ Vé máy bay, 🏨 Khách sạn, etc.)
- `eventType = null`: Danh mục chung, dùng cho mọi trường hợp

### 2. API Categories - Hỗ Trợ Filter theo EventType

**Endpoint:** `GET /api/categories?type=EXPENSE&eventType=TET`

**Logic:**

```typescript
// Nếu eventType được cung cấp, trả về:
// 1. Categories có eventType tương ứng (TET, TRAVEL, etc.)
// 2. Categories chung (eventType = null)

if (eventType) {
  where.OR = [
    { eventType: eventType }, // Danh mục đặc thù
    { eventType: null }, // Danh mục chung
  ];
}
```

**Ví dụ:**

- User chọn sự kiện "Tết 2026" → API trả về danh mục Tết + danh mục chung
- User không chọn sự kiện → API trả về tất cả danh mục

### 3. Transaction Form - Tự Động Filter

**Flow mới:**

```
1. User chọn Sự kiện "Tết 2026" (type: TET)
   ↓
2. Form tự động fetch: GET /api/categories?type=EXPENSE&eventType=TET
   ↓
3. Dropdown danh mục hiển thị:
   - 🧧 Lì xì (eventType: TET)
   - 🛍️ Sắm đồ Tết (eventType: TET)
   - 🎁 Quà biếu (eventType: TET)
   - 🍜 Thực phẩm Tết (eventType: TET)
   - 🏮 Trang trí Tết (eventType: TET)
   - 🙏 Đồ thờ cúng (eventType: TET)
   - 🍔 Ăn uống (eventType: null - general)
   - 🏠 Nhà cửa (eventType: null - general)
   - ... các danh mục chung khác
```

### 4. Script Seed Categories

**File:** `scripts/seed-event-categories.ts`

**Danh mục Tết (6 categories):**

- 🧧 Lì xì
- 🛍️ Sắm đồ Tết
- 🎁 Quà biếu
- 🍜 Thực phẩm Tết
- 🏮 Trang trí Tết
- 🙏 Đồ thờ cúng

**Danh mục Du lịch (5 categories):**

- ✈️ Vé máy bay
- 🏨 Khách sạn
- 🍽️ Ăn uống du lịch
- 🎫 Vé tham quan
- 🛒 Mua sắm du lịch

**Chạy script:**

```bash
pnpm tsx scripts/seed-event-categories.ts
```

## Lợi Ích

### ✅ Linh Hoạt

- Không còn hardcode danh mục trong code
- Dễ thêm danh mục mới cho các sự kiện khác
- Admin có thể quản lý danh mục qua UI

### ✅ Tự Động

- Form tự động lọc danh mục theo sự kiện
- UX tốt hơn: user chỉ thấy danh mục liên quan

### ✅ Mở Rộng

- Dễ thêm loại sự kiện mới (WEDDING, BIRTHDAY, etc.)
- Mỗi sự kiện có thể có danh mục riêng

### ✅ Backward Compatible

- Danh mục cũ (eventType = null) vẫn hoạt động bình thường
- Không ảnh hưởng đến dữ liệu hiện tại

## Cách Sử Dụng

### Cho User

1. **Tạo giao dịch:**

   - Chọn sự kiện "Tết 2026"
   - Dropdown danh mục tự động hiển thị danh mục Tết
   - Chọn danh mục phù hợp (Lì xì, Sắm đồ Tết, etc.)

2. **Không chọn sự kiện:**
   - Dropdown hiển thị tất cả danh mục chung
   - Hoạt động như trước đây

### Cho Admin

1. **Thêm danh mục mới cho Tết:**

   ```
   Tên: "Bánh mứt Tết"
   Icon: 🍰
   Loại: Chi tiêu
   Sự kiện: TET ← Chọn này!
   ```

2. **Thêm danh mục chung:**
   ```
   Tên: "Giáo dục"
   Icon: 📚
   Loại: Chi tiêu
   Sự kiện: (không chọn) ← Để trống!
   ```

## Migration Notes

**Database:**

- ✅ Đã thêm column `eventType` (nullable)
- ✅ Đã thêm index cho `eventType`
- ✅ Đã chạy `prisma db push`

**Data:**

- ✅ Đã seed 11 event-specific categories (6 Tết + 5 Travel)
- ✅ Categories cũ vẫn giữ nguyên (eventType = null)

**Code:**

- ✅ API categories hỗ trợ filter `eventType`
- ✅ Transaction form tự động filter theo event
- ✅ Prisma client đã regenerate

## Testing

### Test Case 1: Tạo giao dịch với sự kiện Tết

```
1. Mở form thêm giao dịch
2. Chọn "Chi tiêu"
3. Chọn sự kiện "Tết 2026"
4. ✅ Dropdown danh mục hiển thị: Lì xì, Sắm đồ Tết, Quà biếu, Thực phẩm Tết + danh mục chung
```

### Test Case 2: Tạo giao dịch không có sự kiện

```
1. Mở form thêm giao dịch
2. Chọn "Chi tiêu"
3. Không chọn sự kiện
4. ✅ Dropdown danh mục hiển thị: Tất cả danh mục (bao gồm cả event-specific)
```

### Test Case 3: Chuyển đổi sự kiện

```
1. Chọn sự kiện "Tết 2026"
2. ✅ Danh mục cập nhật: Lì xì, Sắm đồ Tết...
3. Chuyển sang sự kiện "Du lịch Hà Nội"
4. ✅ Danh mục cập nhật: Vé máy bay, Khách sạn...
5. Bỏ chọn sự kiện
6. ✅ Danh mục cập nhật: Tất cả danh mục
```

## Future Enhancements

1. **UI quản lý danh mục:** Thêm dropdown chọn EventType trong form tạo/sửa category
2. **Badge hiển thị:** Show badge "Tết", "Du lịch" trên danh mục để dễ phân biệt
3. **Auto-suggest:** Khi tạo sự kiện Tết mới, tự động gợi ý tạo các danh mục Tết
4. **Analytics:** Thống kê chi tiêu theo danh mục event-specific

---

**Status:** ✅ HOÀN THÀNH
**Date:** January 14, 2026
**Version:** 2.0.0
