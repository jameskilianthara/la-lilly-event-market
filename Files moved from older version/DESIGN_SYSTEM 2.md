# Event Marketplace Design System

A comprehensive design system built with React, Tailwind CSS, and design tokens for consistent, scalable, and accessible user interfaces.

## 🎨 Overview

This design system provides a unified foundation for building consistent and beautiful user interfaces across the Event Marketplace platform. It includes design tokens, atomic components, layout templates, and development tools to ensure design consistency and developer productivity.

### Key Features

- **🎯 Design Tokens** - Centralized design decisions in CSS variables
- **⚛️ Atomic Components** - Reusable UI building blocks
- **📱 Responsive Design** - Mobile-first, responsive layouts
- **♿ Accessibility** - WCAG 2.1 AA compliant components
- **🌙 Dark Mode** - Built-in theme switching support
- **📖 Documentation** - Comprehensive component documentation with Storybook
- **🛠️ Developer Tools** - ESLint rules, generators, and automation

## 🚀 Quick Start

### Installation

The design system is already integrated into the project. To use components:

```jsx
import { Button, Card, Input, PageTemplate } from '../ui';

function MyPage() {
  return (
    <PageTemplate title="My Page">
      <Card>
        <Card.Header>
          <Card.Title>Welcome</Card.Title>
        </Card.Header>
        <Card.Body>
          <Input label="Email" type="email" placeholder="Enter email" />
          <Button>Submit</Button>
        </Card.Body>
      </Card>
    </PageTemplate>
  );
}
```

### Generate New Pages

Use the built-in generator to scaffold new pages:

```bash
npm run generate:page MyNewPage
```

This creates:
- `src/pages/MyNewPage.jsx` - Page component with PageTemplate
- `src/stories/MyNewPage.stories.jsx` - Storybook documentation
- Automatic route registration in `App.js`

## 🎨 Design Tokens

Design tokens are the foundation of our design system, stored in `src/styles/tokens.css`. They provide consistent values for colors, spacing, typography, and more.

### Color System

#### Primary Colors
```css
--color-primary-500: #0ea5e9;  /* Main brand color */
--color-primary-600: #0284c7;  /* Hover states */
--color-primary-700: #0369a1;  /* Active states */
```

#### Semantic Colors
```css
--color-success-500: #22c55e;  /* Success states */
--color-warning-500: #f59e0b;  /* Warning states */
--color-error-500: #ef4444;    /* Error states */
```

#### Usage in Code
```jsx
// With Tailwind classes
<div className="bg-primary-500 text-white">Primary background</div>

// With CSS variables
<div style={{ backgroundColor: 'var(--color-primary-500)' }}>Custom styling</div>
```

### Spacing Scale

Consistent spacing using a harmonious scale:

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
```

#### Usage
```jsx
// With Tailwind classes
<div className="p-md m-lg">Spacing with tokens</div>

// Component props
<Card padding="md">Content</Card>
```

### Typography Scale

```css
--font-size-sm: 0.875rem;    /* 14px */
--font-size-base: 1rem;      /* 16px */
--font-size-lg: 1.125rem;    /* 18px */
--font-size-xl: 1.25rem;     /* 20px */
--font-size-2xl: 1.5rem;     /* 24px */
```

#### Usage
```jsx
// Responsive typography
<h1 className="text-responsive-3xl">Page Title</h1>
<p className="text-base">Body text</p>
```

## 🧩 Components

### Core Components

#### Button
Versatile button component with multiple variants and states.

```jsx
import { Button } from '../ui';

// Basic usage
<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>

// With icon
<Button icon={<PlusIcon />} iconPosition="left">
  Add Item
</Button>

// Loading state
<Button loading>Processing...</Button>
```

**Props:**
- `variant`: primary, secondary, accent, success, warning, error, ghost, outline, fluorescent, glass
- `size`: xs, sm, md, lg, xl
- `disabled`, `loading`, `fullWidth`
- `icon`, `iconPosition`: left, right

#### Card
Flexible container component with sub-components for structured content.

```jsx
import { Card } from '../ui';

<Card variant="default" shadow="lg" hover>
  <Card.Header>
    <Card.Title>Card Title</Card.Title>
    <Card.Description>Card description</Card.Description>
  </Card.Header>
  <Card.Body>
    Main content area
  </Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

**Props:**
- `variant`: default, secondary, tertiary, accent, success, warning, error, premium
- `padding`: none, xs, sm, md, lg, xl
- `shadow`: none, sm, base, md, lg, xl, premium, glow
- `hover`, `interactive`, `glass`, `gradient`

#### Input
Form input component with validation states and enhancements.

```jsx
import { Input } from '../ui';

<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  required
  error={hasError}
  errorMessage="Invalid email format"
  helperText="We'll never share your email"
  icon={<EmailIcon />}
  iconPosition="left"
/>
```

**Props:**
- `type`: text, email, password, number, tel, url, search, date, time
- `size`: sm, md, lg
- `error`, `success`, `disabled`, `required`
- `label`, `helperText`, `errorMessage`
- `icon`, `iconPosition`

#### Modal
Accessible modal component with customizable sizes and behaviors.

```jsx
import { Modal } from '../ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
  closeOnOverlayClick
>
  <Modal.Body>
    Modal content goes here
  </Modal.Body>
  <Modal.Footer>
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button onClick={handleSave}>Save</Button>
  </Modal.Footer>
</Modal>
```

#### PageTemplate
Layout wrapper providing consistent page structure and responsive behavior.

```jsx
import { PageTemplate } from '../ui';

<PageTemplate
  title="Page Title"
  subtitle="Page description"
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Current Page' }
  ]}
  actions={<Button>Action</Button>}
  sidebar={<SidebarContent />}
  maxWidth="wide"
  padding="lg"
  spacing="lg"
>
  <PageTemplate.Section title="Section Title">
    <PageTemplate.Grid columns={3} gap="lg">
      <Card>Content 1</Card>
      <Card>Content 2</Card>
      <Card>Content 3</Card>
    </PageTemplate.Grid>
  </PageTemplate.Section>
</PageTemplate>
```

## 🎭 Special Effects

### Glass Morphism
Modern glass effect with backdrop blur:

```jsx
<Card glass>
  <Card.Body className="text-white">
    Glass morphism effect
  </Card.Body>
</Card>
```

### Fluorescent Colors
Eye-catching fluorescent effects for special occasions:

```jsx
<Button variant="fluorescent">Celebrate!</Button>
<div className="glow-pink">Glowing element</div>
```

### Gradient Backgrounds
Premium gradient effects:

```jsx
<Card gradient>Premium content</Card>
<PageTemplate background="gradient">Gradient page</PageTemplate>
```

## 🌙 Dark Mode

Dark mode is supported through the `data-theme` attribute:

```jsx
// Toggle dark mode
<div data-theme="dark">
  <YourApp />
</div>

// In CSS, tokens automatically switch
:root { --color-text-primary: #0f172a; }
[data-theme='dark'] { --color-text-primary: #f8fafc; }
```

## 📱 Responsive Design

The design system follows a mobile-first approach with consistent breakpoints:

```css
--breakpoint-mobile: 640px;
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
--breakpoint-wide: 1280px;
```

### Responsive Components
```jsx
// Responsive grid
<PageTemplate.Grid
  columns={4}        // 4 columns on desktop
  responsive={true}  // Auto-responsive: 1 -> 2 -> 3 -> 4
  gap="lg"
>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
  <Card>Item 4</Card>
</PageTemplate.Grid>

// Responsive typography
<h1 className="text-responsive-3xl">Responsive heading</h1>
```

## ♿ Accessibility

All components follow WCAG 2.1 AA guidelines:

### Built-in Features
- **Focus Management**: Visible focus indicators and logical tab order
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: Meeting minimum contrast ratios
- **Semantic HTML**: Proper heading hierarchy and landmarks

### Best Practices
```jsx
// Use semantic HTML
<PageTemplate title="Page Title">  <!-- Generates h1 -->
  <PageTemplate.Section title="Section">  <!-- Generates h2 -->
    <Card.Title as="h3">Card Title</Card.Title>
  </PageTemplate.Section>
</PageTemplate>

// Provide proper labels
<Input
  label="Search Events"
  aria-describedby="search-help"
  helperText="Enter keywords to find events"
/>

// Use focus management
<Modal isOpen={isOpen} onClose={onClose}>
  <!-- Focus automatically managed -->
</Modal>
```

## 🛠️ Development Tools

### ESLint Rules

Custom ESLint rules enforce design system usage:

```bash
# Check for design token violations
npm run lint:design-system

# Auto-fix common issues
npm run lint:fix
```

**Enforced Rules:**
- No literal color values (use design tokens)
- No hardcoded spacing (use spacing scale)
- Prefer design system components over native elements
- Consistent component naming conventions
- Accessibility requirements

### Page Generator

Scaffold new pages with proper structure:

```bash
# Generate a new page
npm run generate:page EventDetails

# Creates:
# - src/pages/EventDetails.jsx
# - src/stories/EventDetails.stories.jsx
# - Route in App.js
```

### Storybook Documentation

View and test components in isolation:

```bash
# Run Storybook (when configured)
npm run storybook
```

## 📐 Layout Guidelines

### Grid System
Use the responsive grid for consistent layouts:

```jsx
// Common layouts
<PageTemplate.Grid columns={2}>      <!-- 50/50 split -->
<PageTemplate.Grid columns={3}>      <!-- 33/33/33 split -->
<PageTemplate.Grid columns={4}>      <!-- 25/25/25/25 split -->

// Custom responsive
<PageTemplate.Grid 
  columns={1}        // Mobile: 1 column
  responsive={false} // Disable auto-responsive
  className="md:grid-cols-2 lg:grid-cols-3" // Custom breakpoints
/>
```

### Spacing Consistency
Follow the spacing scale for all layouts:

```jsx
// Component spacing
<Card padding="md">         <!-- 16px internal spacing -->
<Card spacing="lg">         <!-- 24px between children -->

// Layout spacing
<PageTemplate 
  padding="lg"              <!-- 24px page padding -->
  spacing="xl"              <!-- 32px section spacing -->
/>

// Manual spacing with Tailwind
<div className="p-md m-lg"> <!-- Using design tokens -->
```

## 🎨 Customization

### Extending Colors
Add new colors to the design system:

```css
/* In tokens.css */
:root {
  --color-brand-purple: #8b5cf6;
  --color-brand-orange: #f97316;
}
```

```js
// In tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-purple': 'var(--color-brand-purple)',
        'brand-orange': 'var(--color-brand-orange)',
      }
    }
  }
}
```

### Custom Components
Build new components following design system patterns:

```jsx
// src/ui/Badge.jsx
import React from 'react';
import PropTypes from 'prop-types';

const Badge = ({ children, variant = 'default', size = 'md', ...props }) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-neutral-100 text-neutral-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
  };
  
  const sizes = {
    sm: 'px-component-sm py-component-xs text-xs',
    md: 'px-component-md py-component-sm text-sm',
    lg: 'px-component-lg py-component-md text-base',
  };
  
  return (
    <span 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'primary', 'success']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default Badge;
```

## 🔧 Troubleshooting

### Common Issues

#### Design Token Not Working
```jsx
// ❌ Wrong - hardcoded value
<div style={{ color: '#3b82f6' }}>Text</div>

// ✅ Correct - design token
<div className="text-primary-500">Text</div>
<div style={{ color: 'var(--color-primary-500)' }}>Text</div>
```

#### Component Not Styling Correctly
```jsx
// ❌ Wrong - missing Tailwind classes
<Button className="my-custom-class">Button</Button>

// ✅ Correct - extend with design tokens
<Button className="shadow-premium glow-blue">Button</Button>
```

#### ESLint Errors
```bash
# View specific design system violations
npm run lint:design-system

# Common fixes:
# - Replace hardcoded colors with design tokens
# - Use spacing scale instead of pixel values
# - Import design system components instead of native elements
```

### Performance Tips

1. **Import Only What You Need**
   ```jsx
   // ❌ Avoid importing everything
   import * as UI from '../ui';
   
   // ✅ Import specific components
   import { Button, Card } from '../ui';
   ```

2. **Use CSS Variables for Dynamic Styles**
   ```jsx
   // ❌ Avoid inline styles with hardcoded values
   <div style={{ backgroundColor: '#3b82f6' }} />
   
   // ✅ Use CSS variables for theming
   <div style={{ backgroundColor: 'var(--color-primary-500)' }} />
   ```

3. **Prefer Tailwind Classes**
   ```jsx
   // ❌ Avoid unnecessary CSS-in-JS
   <div style={{ padding: '16px', margin: '24px' }} />
   
   // ✅ Use Tailwind with design tokens
   <div className="p-md m-lg" />
   ```

## 📚 Resources

### Documentation
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Guide](https://www.framer.com/motion/)
- [React Accessibility](https://reactjs.org/docs/accessibility.html)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Tools
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessibility Insights](https://accessibilityinsights.io/)
- [React DevTools](https://react-dev-tools.netlify.app/)

### Design Inspiration
- [Material Design](https://material.io/design)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Polaris Design System](https://polaris.shopify.com/)

## 🤝 Contributing

### Adding New Components

1. **Create the Component**
   ```bash
   # Create in src/ui/
   touch src/ui/NewComponent.jsx
   ```

2. **Follow the Pattern**
   ```jsx
   // Use design tokens
   // Include PropTypes
   // Add accessibility features
   // Export from src/ui/index.js
   ```

3. **Add Documentation**
   ```bash
   # Create Storybook story
   touch src/stories/NewComponent.stories.jsx
   ```

4. **Test and Validate**
   ```bash
   # Run linting
   npm run lint:design-system
   
   # Test accessibility
   # Verify responsive behavior
   # Check dark mode support
   ```

### Updating Design Tokens

1. **Modify `src/styles/tokens.css`**
2. **Update `tailwind.config.js` if needed**
3. **Test existing components**
4. **Update documentation**

---

## 🎉 Getting Started

Ready to build amazing interfaces? Start with:

1. **Generate a new page**: `npm run generate:page MyPage`
2. **Use design system components**: Import from `../ui`
3. **Follow spacing guidelines**: Use the spacing scale
4. **Test accessibility**: Ensure keyboard navigation works
5. **Check responsiveness**: Test on different screen sizes

Happy coding! 🚀

---

*For questions or support, please reach out to the development team or create an issue in the repository.*