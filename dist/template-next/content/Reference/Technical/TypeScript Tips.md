# TypeScript Tips & Tricks

Useful TypeScript patterns and best practices.

## Type Inference

Let TypeScript infer types when obvious:

```typescript
// Good - type inferred
const count = 5;
const message = "Hello";

// Unnecessary - type annotation not needed
const count: number = 5;
```

## Utility Types

TypeScript provides powerful utility types:

### Partial
```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

// All properties optional
type PartialUser = Partial<User>;
```

### Pick and Omit
```typescript
// Select specific properties
type UserPreview = Pick<User, 'name' | 'email'>;

// Exclude specific properties
type UserWithoutAge = Omit<User, 'age'>;
```

### Record
```typescript
// Object with string keys and number values
type StringToNumber = Record<string, number>;

const scores: StringToNumber = {
  math: 95,
  english: 87,
};
```

## Union Types

```typescript
type Status = 'loading' | 'success' | 'error';

function handleStatus(status: Status) {
  switch (status) {
    case 'loading':
      return 'Loading...';
    case 'success':
      return 'Success!';
    case 'error':
      return 'Error occurred';
  }
}
```

## Generics

```typescript
function identity<T>(arg: T): T {
  return arg;
}

// Usage
const num = identity<number>(42);
const str = identity<string>("hello");
```

## Type Guards

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process(value: string | number) {
  if (isString(value)) {
    // TypeScript knows value is string here
    console.log(value.toUpperCase());
  }
}
```

## Never Type

```typescript
function assertNever(x: never): never {
  throw new Error("Unexpected value: " + x);
}

type Shape = 'circle' | 'square';

function getArea(shape: Shape) {
  switch (shape) {
    case 'circle':
      return Math.PI;
    case 'square':
      return 4;
    default:
      // Ensures all cases are handled
      return assertNever(shape);
  }
}
```

## Best Practices

1. **Enable strict mode**: Use `"strict": true` in tsconfig.json
2. **Avoid `any`**: Use `unknown` when type is truly unknown
3. **Use const assertions**: `as const` for literal types
4. **Leverage type inference**: Don't over-annotate
5. **Use discriminated unions**: For complex state management
