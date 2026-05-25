# Romega Solutions - Certificate Generator

A modern, responsive certificate generator built with Next.js 14 and Tailwind CSS. Create, customize, and export professional certificates with an intuitive drag-and-drop interface for Romega Organization.

![Certificate Generator Preview](./preview.png)

## 🚀 Features

- **🔐 Secure Authentication**: Protected routes with session management for authorized team members
- **🎨 Drag & Drop Editor**: Intuitive interface for positioning elements
- **📝 Advanced Text Customization**: Font selection, colors, sizing, and positioning
- **🖼️ Template Management**: Multiple pre-built templates with custom upload support and n8n Data Table fallback storage
- **💾 High-Quality Export**: Download certificates as PNG at 2x resolution
- **🌗 Dark/Light Mode**: Seamless theme switching with custom Romega Solutions color system
- **📱 Responsive Design**: Works flawlessly across all devices
- **⚡ Real-Time Preview**: See changes instantly as you edit
- **🎯 Precise Positioning**: Pixel-perfect element placement
- **🔤 Local Font Support**: Merriweather font loaded locally to avoid CORS issues
- **📧 Email Queue System**: PostgreSQL-backed email queueing with n8n Data Table fallback
- **🔄 Auto-Refresh Status**: Real-time email status monitoring (5-second intervals)
- **📦 Batch Generation**: Generate and queue multiple certificates at once
- **🎓 Professional Email Presets**: 4 ready-to-use templates (Event, KPI, Internship, UMak)
- **🌐 n8n Webhook Integration**: Automated email sending via external workflow

## 📚 Documentation

### Quick Links

- **[UPDATE SUMMARY](./docs/UPDATE-SUMMARY.md)** - Latest changes and features ⭐
- **[n8n Setup Guide](./docs/n8n-setup.md)** - Complete n8n workflow configuration
- **[Email Presets Guide](./docs/email-presets-guide.md)** - All 4 email templates explained
- **[Testing Checklist](./docs/testing-checklist.md)** - 10 comprehensive test scenarios
- **[System Flow Diagram](./docs/system-flow-diagram.md)** - Visual architecture overview

### Email Integration

This system now includes a complete email queue with:

- **Queue Storage**: PostgreSQL via `DATABASE_URL`, or n8n Data Table via `N8N_CERTIFICATE_QUEUE_TABLE_ID`
- **Template Storage**: Local filesystem in development, or n8n Data Table via `N8N_CERTIFICATE_TEMPLATE_TABLE_ID` in production
- **n8n Webhook**: Configured with `N8N_WEBHOOK_URL`
- **4 Email Presets**: Professional templates for different use cases
- **Batch Support**: Queue multiple certificates with personalized emails
- **Status Tracking**: Real-time monitoring with auto-refresh

See **[docs/UPDATE-SUMMARY.md](./docs/UPDATE-SUMMARY.md)** for complete details.

## 🔐 Authentication

The application features secure authentication to ensure only authorized Romega Solutions team members can create and manage certificates.

### Credentials

Credentials are configured through server-side environment variables. Copy `.env.example` to `.env.local` and set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SESSION_SECRET` before running the app.

### Security Features

- Session-based authentication
- Server-side API route protection with an HTTP-only session cookie
- Automatic redirect to login for unauthenticated users
- Secure logout functionality
- Client-side route protection
- 7-day session duration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL=postgresql://cert_admin:replace-with-password@db.example.com:5432/certificate_queue
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/certificate-email-api
N8N_URL=https://n8n.example.com
N8N_API_KEY=your_n8n_api_key
N8N_CERTIFICATE_QUEUE_TABLE_ID=nVHE9LCcyohrNEdO
N8N_CERTIFICATE_TEMPLATE_TABLE_ID=9ELqiAraypvLj0VA
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_strong_password
ADMIN_NAME=Certificate Admin
ADMIN_EMAIL=admin@example.com
SESSION_SECRET=your_long_random_secret
N8N_UPDATE_TOKEN=your_n8n_callback_token
```

## 🏗️ Project Structure

```text
certificate-generator/
├── public/
│   ├── romega-logo.svg        # Company logo
│   └── templates/             # Certificate templates
├── src/
│   ├── app/                   # Next.js app router
│   │   ├── page.tsx          # Landing page
│   │   ├── login/            # Authentication page
│   │   ├── dashboard/        # User dashboard
│   │   └── generator/        # Certificate editor
│   ├── components/
│   │   ├── auth/             # Authentication components
│   │   │   ├── login-form.tsx
│   │   │   └── protected-route.tsx
│   │   ├── certificate/      # Core certificate components
│   │   │   ├── canvas.tsx              # Main editing workspace
│   │   │   ├── download-button.tsx     # PNG export functionality
│   │   │   ├── draggable-text.tsx      # Text element manipulation
│   │   │   ├── text-controls.tsx       # Text customization panel
│   │   │   ├── image-controls.tsx      # Image management
│   │   │   ├── template-selector.tsx   # Template browser
│   │   │   └── batch-generator.tsx     # Bulk certificate generation
│   │   ├── layout/           # Layout components
│   │   │   ├── navbar.tsx
│   │   │   └── sidebar.tsx
│   │   ├── onboarding/       # User guidance
│   │   │   ├── tour.tsx
│   │   │   └── generator-tour.tsx
│   │   └── ui/               # Shadcn/ui components
│   │       ├── button.tsx
│   │       └── accordion.tsx
│   ├── hooks/
│   │   └── use-auth.ts       # Authentication hook
│   ├── lib/
│   │   ├── auth.ts           # Auth utilities
│   │   ├── utils.ts          # Helper functions
│   │   └── batch-generator.ts # Batch processing
│   ├── types/
│   │   ├── certificates.ts   # Certificate type definitions
│   │   └── batch.ts          # Batch generation types
│   ├── styles/
│   │   └── globals.css       # Global styles + Romega Solutions theme
│   └── assets/
│       └── fonts/            # Local font files
│           ├── Merriweather_24pt-Bold.ttf
│           └── Merriweather_24pt-Regular.ttf
├── .env.local                # Environment variables (create this)
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind + RS color system
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command         | Action                                       |
| :-------------- | :------------------------------------------- |
| `npm install`   | Installs dependencies                        |
| `npm run dev`   | Starts local dev server at `localhost:3000`  |
| `npm run build` | Build your production site to `./.next/`     |
| `npm run start` | Preview your build locally, before deploying |
| `npm run lint`  | Run ESLint to check code quality             |

## 🛠️ Tech Stack

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible UI components
- **[html2canvas](https://html2canvas.hertzen.com/)** - High-quality image export
- **[Lucide Icons](https://lucide.dev/)** - Clean, customizable icons

## 🎨 Color Scheme - Romega Solutions

The project uses the official Romega Solutions color system:

### Primary Colors (Blue)

- **rs-primary-50** to **rs-primary-950**: Full range of blue shades
- **Main brand color**: `hsla(209, 100%, 45%, 1)` (rs-primary-500)

### Accent Colors (Yellow/Orange)

- **rs-accent-50** to **rs-accent-950**: Full range of yellow/orange shades
- **Secondary accent**: `hsla(42, 94%, 45%, 1)` (rs-accent-500)

### Neutral Colors

- **rs-neutral-50** to **rs-neutral-950**: Gray scale for text and backgrounds

### Typography

- **Headings**: Merriweather (serif) - Loaded locally
- **Body Text**: Source Sans 3 (sans-serif)
- **Monospace**: Geist Mono for code snippets

## 📝 How to Use

1. **Login** using your Romega Solutions credentials

2. **Navigate to Generator** from the dashboard

3. **Select a Template** or upload your own certificate design

4. **Add Text Elements**:

   - Click "Add Text" to create new elements
   - Drag elements to position them
   - Customize font, size, color, and alignment

5. **Add Images** (optional):

   - Upload logos or graphics
   - Position and resize as needed

6. **Preview in Real-Time**:

   - All changes appear instantly
   - Zoom in/out for precise editing

7. **Download Certificate**:

   - Click "Download PNG" button
   - High-quality 2x resolution export
   - Custom filename with timestamp

8. **Batch Generation** (Coming Soon):
   - Upload CSV with recipient data
   - Generate multiple certificates at once

## 💡 Core Components

### Canvas Component

Main editing workspace with:

- Drag & drop functionality
- Element selection
- Real-time preview
- Canvas scaling

### DownloadButton Component

High-quality export featuring:

- html2canvas integration
- 2x scale for crisp output
- CORS handling
- Error management

### DraggableText Component

Text manipulation with:

- Free positioning
- Visual selection feedback
- Mouse-based dragging
- Position updates

### TextControls Component

Customization panel including:

- Font family picker
- Size slider
- Color picker
- Alignment options

## 🎯 Customization

### Adding New Templates

1. Add template image to `public/templates/`
2. Update template list in `template-selector.tsx`
3. Configure default dimensions

### Styling Changes

- Modify Tailwind classes in components
- Update RS colors in `tailwind.config.js`
- Add custom CSS in `globals.css`

### Font Customization

To use different fonts:

1. Add font files to `src/assets/fonts/`
2. Update `@font-face` in `globals.css`
3. Reference in text controls

## 🖼️ Image Export Quality

The download functionality generates professional-quality images:

- **2x Resolution**: Double the display resolution
- **Scale Factor**: Configurable for higher quality
- **CORS Handling**: `useCORS` and `allowTaint` enabled
- **Background**: White (#ffffff) for compatibility
- **Format**: PNG for lossless quality
- **File Naming**: Auto-generated with timestamp

## 📱 Responsive Design

The application adapts to all screen sizes:

- Mobile-optimized interface
- Touch-friendly controls
- Responsive canvas scaling
- Adaptive sidebar
- Mobile-first approach

## 🔒 Security Best Practices

1. **Change default credentials** immediately after deployment
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** in production (required for secure cookies)
4. **Implement rate limiting** for auth endpoints
5. **Regular security audits** of dependencies
6. **Secure session management** with HTTP-only cookies
7. **Monitor access logs** for unauthorized attempts

## 🚀 Deployment

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd certificate-generator
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Build for production**

   ```bash
   npm run build
   ```

5. **Deploy to hosting provider**
   - **Vercel** (Recommended): `vercel --prod`
   - **Netlify**: Connect repository
   - **AWS/Azure**: Use appropriate deployment tools
   - Ensure environment variables are set in hosting dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Need help? Contact:

- **IT Support**: [it@romega-solutions.com](mailto:it@romega-solutions.com)
- **Developer**: [kengarcia.romegasolutions@gmail.com](mailto:kengarcia.romegasolutions@gmail.com)
- **HR Team**: [hr@romega-solutions.com](mailto:hr@romega-solutions.com)

## 👀 Want to learn more?

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [html2canvas Documentation](https://html2canvas.hertzen.com/)

---

**Built with ❤️ by [Ken Patrick Garcia](mailto:kengarcia.romegasolutions@gmail.com) for Romega Solutions**

**Version:** 1.0.0  
**Last Updated:** November 2025
