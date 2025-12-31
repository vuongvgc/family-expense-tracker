# Animation Components Documentation

## Installation

```bash
yarn add framer-motion
```

## Components

### 1. AnimatedCard

Wrap any card with fade-in, slide-up animation and hover effect.

**Usage:**

```tsx
import { AnimatedCard } from '@/components/ui/animated-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<AnimatedCard delay={0}>
  <Card>
    <CardHeader>
      <CardTitle>Tài sản ròng</CardTitle>
    </CardHeader>
    <CardContent>
      <AnimatedNumber value={1500000} />
    </CardContent>
  </Card>
</AnimatedCard>

<AnimatedCard delay={0.1}>
  <Card>
    <CardHeader>
      <CardTitle>Ngân sách</CardTitle>
    </CardHeader>
    <CardContent>
      <AnimatedNumber value={5000000} />
    </CardContent>
  </Card>
</AnimatedCard>
```

**Props:**

- `children`: ReactNode - Content to animate
- `className?`: string - Additional CSS classes
- `delay?`: number - Delay before animation starts (in seconds, default: 0)

---

### 2. AnimatedNumber

Animates currency values with counting effect.

**Usage:**

```tsx
import { AnimatedNumber } from '@/components/ui/animated-number';

<AnimatedNumber
  value={10000000}
  locale='vi-VN'
  currency='VND'
  className='text-2xl font-bold'
/>;
```

**Props:**

- `value`: number - The number to display
- `duration?`: number - Animation duration (default: 1s)
- `locale?`: string - Locale for formatting (default: 'vi-VN')
- `currency?`: string - Currency code (default: 'VND')
- `className?`: string - Additional CSS classes

---

### 3. AnimatedProgress

Progress bar that animates from 0% to target percentage when in viewport.

**Usage:**

```tsx
import { AnimatedProgress } from '@/components/ui/animated-progress';

<AnimatedProgress value={75} className='h-2' indicatorClassName='bg-green-500' />;
```

**Props:**

- `value`: number - Progress percentage (0-100)
- `className?`: string - Classes for the progress container
- `indicatorClassName?`: string - Classes for the progress bar

---

### 4. AnimatedList & StaggerList

Animate list items with stagger effect.

**AnimatedList Usage (with AnimatePresence for add/remove):**

```tsx
import { AnimatedList } from '@/components/ui/animated-list';

<AnimatedList>
  {transactions.map((transaction) => (
    <div key={transaction.id}>
      <TransactionCard transaction={transaction} />
    </div>
  ))}
</AnimatedList>;
```

**StaggerList Usage (for static lists):**

```tsx
import { StaggerList } from '@/components/ui/animated-list';

<StaggerList staggerDelay={0.1}>
  {categories.map((category) => (
    <CategoryCard key={category.id} category={category} />
  ))}
</StaggerList>;
```

**Props:**

- `children`: ReactNode[] - Array of children to animate
- `className?`: string - Additional CSS classes
- `staggerDelay?`: number - Delay between each item (default: 0.1s)

---

### 5. AnimatedDialog

Dialog with smooth scale-in animation.

**Usage:**

```tsx
import {
  AnimatedDialog,
  AnimatedDialogContent,
  AnimatedDialogHeader,
  AnimatedDialogTitle,
  AnimatedDialogDescription,
  AnimatedDialogTrigger,
} from '@/components/ui/animated-dialog';

<AnimatedDialog>
  <AnimatedDialogTrigger asChild>
    <Button>Thêm giao dịch</Button>
  </AnimatedDialogTrigger>
  <AnimatedDialogContent>
    <AnimatedDialogHeader>
      <AnimatedDialogTitle>Thêm giao dịch mới</AnimatedDialogTitle>
      <AnimatedDialogDescription>
        Nhập thông tin giao dịch của bạn
      </AnimatedDialogDescription>
    </AnimatedDialogHeader>
    {/* Form content */}
  </AnimatedDialogContent>
</AnimatedDialog>;
```

---

## Example: Dashboard Summary Cards

```tsx
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardSummary({ data }) {
  return (
    <div className='grid gap-4 md:grid-cols-3'>
      <AnimatedCard delay={0}>
        <Card>
          <CardHeader>
            <CardTitle>Tài sản ròng</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatedNumber value={data.netWorth} className='text-2xl font-bold' />
          </CardContent>
        </Card>
      </AnimatedCard>

      <AnimatedCard delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>Tổng tài sản</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatedNumber
              value={data.totalAssets}
              className='text-2xl font-bold text-green-600'
            />
          </CardContent>
        </Card>
      </AnimatedCard>

      <AnimatedCard delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle>Tổng nợ</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatedNumber
              value={data.totalDebts}
              className='text-2xl font-bold text-red-600'
            />
          </CardContent>
        </Card>
      </AnimatedCard>
    </div>
  );
}
```

## Example: Budget Progress with Animation

```tsx
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { AnimatedNumber } from '@/components/ui/animated-number';

export function BudgetCard({ budget }) {
  const percentage = (budget.spent / budget.total) * 100;

  return (
    <div className='space-y-2'>
      <div className='flex justify-between'>
        <span>{budget.categoryName}</span>
        <span>{percentage.toFixed(0)}%</span>
      </div>
      <AnimatedProgress
        value={percentage}
        className='h-2'
        indicatorClassName={
          percentage > 90
            ? 'bg-red-500'
            : percentage > 70
            ? 'bg-yellow-500'
            : 'bg-green-500'
        }
      />
      <div className='flex justify-between text-sm text-muted-foreground'>
        <AnimatedNumber value={budget.spent} />
        <AnimatedNumber value={budget.total} />
      </div>
    </div>
  );
}
```

## Tips

1. **Performance**: Use `delay` prop to stagger multiple cards instead of animating all at once
2. **Accessibility**: Animations respect `prefers-reduced-motion` automatically via framer-motion
3. **Layout animations**: Use `layout` prop on motion.div for smooth repositioning
4. **Exit animations**: Wrap with `<AnimatePresence>` to animate items leaving the DOM
