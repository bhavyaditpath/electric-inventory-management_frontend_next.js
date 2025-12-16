# Electric Inventory Frontend

A comprehensive Next.js-based frontend application for managing electrical inventory across multiple branches. This application provides role-based access for administrators and branch managers to handle inventory, purchases, sales, alerts, and reporting.

## Tech Stack

### Frontend Framework
- **Next.js 16.0.4** - React framework with App Router for server-side rendering and routing
- **React 19.2.0** - UI library for building interactive components
- **TypeScript** - Type-safe JavaScript for better development experience

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS framework for responsive design
- **Heroicons** - Beautiful hand-crafted SVG icons

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript** - Type checking and IntelliSense

## Packages Installed & Their Purposes

### Core Dependencies
- **@emailjs/browser (^4.4.1)** - Email sending functionality for notifications and communications
- **@hello-pangea/dnd (^18.0.1)** - Drag and drop functionality for enhanced user interactions
- **@heroicons/react (^2.2.0)** - React components for consistent iconography
- **jspdf (^3.0.4)** - PDF generation library for reports and exports
- **jspdf-autotable (^5.0.2)** - Table generation plugin for PDF documents
- **react-hot-toast (^2.6.0)** - Toast notifications for user feedback

### Development Dependencies
- **@tailwindcss/postcss (^4)** - PostCSS plugin for Tailwind CSS processing
- **@types packages** - TypeScript type definitions for better type safety

## What Different Things I Have Done

### Architecture & Structure
- **Modular Architecture** - Organized code into logical modules (components, services, hooks, utils)
- **Type-Safe Development** - Comprehensive TypeScript usage with custom types and enums
- **Responsive Design** - Mobile-first approach with adaptive layouts and mobile card views
- **Component Reusability** - Created reusable components like DataTable, Modal, Form components

### Key Components Developed

#### Generic DataTable Component
- **Fully Generic** - TypeScript generics for type-safe data handling
- **Advanced Features** - Sorting (client/server-side), pagination, search, and filtering
- **Responsive Design** - Desktop table view with mobile card layout
- **Server-Side Support** - Handles server-side pagination and sorting
- **Customizable** - Configurable columns, actions, and styling
- **Performance Optimized** - Efficient rendering with large datasets

#### Column Customizer System
- **Dynamic Column Management** - Show/hide columns based on user preferences
- **Persistent Settings** - localStorage integration for user preferences
- **Drag & Drop Reordering** - Column ordering with @hello-pangea/dnd
- **Custom Hook Integration** - useColumnCustomization hook for state management
- **Type-Safe Implementation** - Full TypeScript support with proper typing

#### Custom Hooks
- **useColumnCustomization** - Manages column visibility, ordering, and persistence
- **Reusable Logic** - Extracted complex state logic into reusable hooks
- **Performance Focused** - Optimized re-renders and memory usage

### Advanced Features Implemented
- **JWT Authentication** - Secure token-based authentication with automatic refresh
- **Google OAuth Integration** - Social login functionality
- **Role-Based Access Control** - Different permissions for Admin and Branch users
- **Real-time Notifications** - Toast notifications and alert systems
- **PDF Report Generation** - Dynamic PDF creation with tables and summaries
- **Generic DataTable Component** - Reusable table with sorting, pagination, server-side support, and mobile responsiveness
- **Column Customizer** - Dynamic column visibility and ordering with localStorage persistence
- **Custom Hooks** - useColumnCustomization for reusable column management logic
- **Server-Side Pagination** - Efficient data loading with pagination controls
- **Drag & Drop Support** - Enhanced user interactions (framework ready)

## Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin-specific pages (dashboard, inventory, reports, etc.)
│   ├── branch/            # Branch-specific pages (inventory, alerts, purchase, etc.)
│   ├── auth/              # Authentication pages (login, register, forgot password)
│   ├── notifications/     # Notification management
│   ├── email/             # Email functionality
│   └── Constants/         # Application constants
├── components/            # Reusable UI components
│   ├── DataTable.tsx      # Generic, fully-featured data table component with sorting, pagination, mobile support
│   ├── ColumnCustomizer.tsx # UI component for column customization
│   ├── LayoutWrapper.tsx  # Main layout component
│   ├── Modal.tsx          # Reusable modal component
│   └── ...                # Other UI components
├── contexts/              # React contexts for state management
│   └── AuthContext.tsx    # Authentication context
├── hooks/                 # Custom React hooks
│   └── useColumnCustomization.ts  # Custom hook for managing column visibility and ordering with localStorage
├── Services/              # API service layer
│   ├── api.ts             # Base API client with token management
│   ├── auth.api.ts        # Authentication APIs
│   ├── inventory.service.ts # Inventory management
│   └── ...                # Other service files
├── types/                 # TypeScript type definitions
│   ├── api-types.ts       # API response types
│   ├── enums.ts           # Application enums
│   └── google-oauth.types.ts # OAuth types
├── utils/                 # Utility functions
│   └── pdfExport.ts       # PDF generation utilities
└── styles/                # Styling files
    └── design-system.css  # Design system styles
```

## Tech Stack Topics Covered

### Clear with the Basics
- ✅ React Components and Props
- ✅ State Management with useState/useEffect
- ✅ Event Handling
- ✅ Conditional Rendering
- ✅ Lists and Keys
- ✅ Forms and Controlled Components
- ✅ React Router (Next.js App Router)
- ✅ Component Lifecycle
- ✅ TypeScript Fundamentals
- ✅ CSS Modules and Tailwind CSS
- ✅ API Calls with Fetch
- ✅ Error Handling

### Tried Advanced Topics

#### Authentication & Security
- **JWT Token Management** - Implemented secure token storage, automatic refresh, and expiry handling
- **Google OAuth Integration** - Social authentication with callback handling
- **Role-Based Access Control** - Protected routes and components based on user roles
- **Session Management** - Persistent login state with token validation

#### Data Management
- **Server-Side Pagination** - Efficient data loading with customizable page sizes
- **Advanced Sorting** - Client and server-side sorting capabilities
- **Column Customization** - Dynamic column visibility with localStorage persistence
- **Real-time Data Updates** - Automatic data refresh and synchronization

#### UI/UX Enhancements
- **Responsive Design** - Mobile-first approach with adaptive layouts
- **Advanced Data Tables** - Sortable, paginated tables with mobile card views
- **Toast Notifications** - User feedback system with react-hot-toast
- **Modal Systems** - Reusable modal components for forms and confirmations
- **Loading States** - Skeleton loaders and progress indicators

#### File & Export Features
- **PDF Generation** - Dynamic report creation with jsPDF and autoTable
- **Email Integration** - EmailJS for notification sending
- **Data Export** - Structured data export capabilities

#### Performance & Architecture
- **Custom Hooks** - Advanced custom hooks like useColumnCustomization for complex state management
- **Generic Components** - TypeScript generics in DataTable for reusable, type-safe components
- **Component Composition** - Modular component design with proper separation of concerns
- **Context API** - Global state management for authentication
- **Service Layer** - Organized API calls and business logic
- **Type Safety** - Comprehensive TypeScript implementation with advanced patterns

## Your Definition

This project demonstrates a production-ready inventory management system built with modern web technologies. It showcases the implementation of complex features like authentication, authorization, data visualization, and export functionalities while maintaining clean, maintainable code architecture.

The application serves as a comprehensive example of:
- Full-stack frontend development with Next.js
- Type-safe development practices
- User experience design with responsive interfaces
- Integration of third-party services (OAuth, Email, PDF generation)
- Advanced state management and data handling
- Professional code organization and best practices

## Functionality Used

### Core Features
1. **User Authentication**
   - Login/Register with JWT
   - Google OAuth integration
   - Password reset functionality
   - Session management

2. **Role-Based Dashboard**
   - Admin dashboard with system overview
   - Branch dashboard with branch-specific data
   - Protected routes based on user roles

3. **Inventory Management**
   - Product catalog management
   - Stock level tracking
   - Low stock alerts
   - Inventory reports

4. **Purchase Management**
   - Purchase order creation
   - Supplier management
   - Purchase history tracking
   - PDF report generation

5. **Sales Tracking**
   - Sales data management
   - Sales analytics
   - Branch-wise sales reports

6. **Alert System**
   - Low stock notifications
   - Expiring product alerts
   - Customizable alert priorities
   - Alert status management

7. **Reporting**
   - Comprehensive reports
   - PDF export functionality
   - Data visualization
   - Custom report generation

8. **Notification System**
   - Real-time notifications
   - Toast messages
   - Email notifications
   - Notification history

### Technical Features
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Generic DataTable Component** - Reusable, type-safe table with advanced features
- **Column Customizer** - Dynamic column management with persistence
- **Custom Hooks** - useColumnCustomization for complex state logic
- **Form Handling** - Robust form components with validation
- **API Integration** - RESTful API communication with error handling
- **State Management** - Context API for global state
- **Performance** - Optimized rendering and data loading

## Getting Started

1. **Installation**
   ```bash
   npm install
   ```

2. **Development**
   ```bash
   npm run dev
   ```

3. **Build**
   ```bash
   npm run build
   ```

4. **Start Production**
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env.local` file with:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Key Achievements

- **Scalable Architecture** - Modular design that can easily accommodate new features
- **Type Safety** - Comprehensive TypeScript implementation prevents runtime errors
- **User Experience** - Intuitive interface with responsive design and smooth interactions
- **Performance** - Optimized data loading and rendering for large datasets
- **Security** - Secure authentication and authorization mechanisms
- **Maintainability** - Clean, documented code with consistent patterns
