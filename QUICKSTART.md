# 🏗️ BuildERP - Quick Start Guide

Your professional construction project management system is ready!

## 🚀 Get Started in 3 Steps

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Create Project Structure
```bash
npm run setup
```

### 3️⃣ Start Development Server
```bash
npm run dev
```

**Then open http://localhost:3000**

---

## ✨ What's Included

✅ **Project Management** - Create and manage projects  
✅ **WBS Tree** - Build unlimited hierarchical structures  
✅ **Dark Dashboard** - Professional ERP interface  
✅ **TypeScript** - Type-safe development  
✅ **localStorage** - Data persists in browser  
✅ **Production Ready** - Service layer for easy DB migration  

---

## 📺 Screen Overview

1. **Dashboard** - Overview & quick stats
2. **Projects** - Create, view, delete projects
3. **WBS** - Manage work breakdown structure
4. **Navigation** - Sidebar with 6 main sections

---

## 🎯 Try These Actions

1. Click "New Project" button
2. Create a project (e.g., "Office Building A")
3. Click on the project card
4. Add WBS items (e.g., "Foundation", "Structure")
5. Expand/collapse tree nodes
6. Refresh page - data persists! ✨

---

## 📁 Project Structure

```
app/
├── page.tsx              # Home page
├── layout.tsx           # Root layout (dark theme)
├── sidebar.tsx          # Navigation
├── dashboard-page.tsx   # Dashboard
├── projects-page.tsx    # Projects list
├── project-wbs-page.tsx # Project detail
└── wbs-page.tsx         # WBS hub

services/
├── projectService.ts    # Project CRUD
└── wbsService.ts        # WBS operations

types.ts                 # TypeScript types
```

---

## 💾 Data Storage

Data is saved in browser localStorage:
- Project data: `construction-erp:projects`
- WBS data: `construction-erp:wbs:{projectId}`

---

## 🔧 Available Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
npm run setup    # Create directory structure
```

---

## 📖 Full Documentation

- **SETUP_GUIDE.md** - Complete setup & architecture
- **README_IMPLEMENTATION.md** - Implementation details
- **FILE_ORGANIZATION.md** - File structure guide

---

## 🚨 If You Get Errors

**Error: "Cannot find module '@/types'"**
```bash
npm run setup    # This creates all directories
```

**Page not loading:**
1. Delete `.next` folder
2. Run `npm run dev` again
3. Clear browser cache

---

## ✅ System Ready!

Your BuildERP system is fully set up and ready to use. Start building! 🏗️

Need help? Check the docs files included in the project.
