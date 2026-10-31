# SKSSF CHAPPARAPPADAVU ZONE – ADVANCED ATTENDANCE MANAGEMENT SYSTEM

A complete, professional, high-performance attendance management and points calculation web application built for **SKSSF CHAPPARAPPADAVU ZONE**.

---

## 🚀 Features Overview

### 1. Structure & Committees
- **Zone Committee**: 21 positions (President, VP, General Secretary, Additional GS, Joint Secretaries, Working Secretaries, Treasurer, Joint Treasurer, Editor, Sub-Editor, Executive Members).
- **Cluster Committees**: 3 Clusters (**Padappengad**, **Perumalabad**, **Kuttaparamb**) with 4 standard office-bearer positions each (12 points total).
- **Unit Committees**: 16 Units across the 3 clusters with 4 positions each (64 points total).
- **Sub-Wing Leadership**: Specialized wings (Vikaya, Campus Wing, Sahachari, Trend, Cyber Wing, Sargavasa, IBAD, Twala'ath) with appointed chairpersons.

### 2. Member & Operator Management
- Individual member directory with unique phone numbers, membership IDs, and active position assignments.
- Attendance Operator portal with mobile-based login credentials, activation toggles, and direct credential copy actions.

### 3. Event & Attendance Recording
- **Program Lifecycle**: `Upcoming` ➡️ `Active` (Live Check-in) ➡️ `Closed` (Archived).
- **Operator Terminal**: Search-first mobile layout, instant 1-tap check-in, Web Audio API sound feedback, haptic vibration, live counter, and duplicate check-in prevention with exact previous timestamp.

### 4. Real-time Committee Points & Analytics
- Live points calculation (Zone: 21 pts, Clusters: 12 pts, Units: 64 pts).
- Committee standings rankings and percentage participation metrics.

### 5. Document Exports
- **Excel (.xlsx)**: Formatted attendance register and committee points sheets.
- **PDF (.pdf)**: Official SKSSF Chapparappadavu Zone branded reports using jsPDF and jspdf-autotable.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Backend & Database**: Supabase (PostgreSQL with Row Level Security & Triggers)
- **Data & State**: TanStack React Query v5
- **Document Generation**: XLSX, jsPDF, jspdf-autotable

---

## 🗄️ Database Setup Instructions

1. Open your Supabase project dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to the **SQL Editor** tab.
3. Open `supabase/schema.sql` located in this repository.
4. Copy and paste the entire script into the Supabase SQL Editor and click **Run**.
5. The script will create:
   - All tables: `profiles`, `clusters`, `units`, `committees`, `positions`, `members`, `member_positions`, `sub_wings`, `attendance_operators`, `programs`, `attendance`, `audit_logs`
   - Trigger functions: `handle_new_user()`, `handle_updated_at()`
   - Stored procedures: `mark_attendance()`, `start_program()`, `close_program()`
   - Complete Row Level Security (RLS) policies

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run production build validation
npm run build
```

---

## 🔐 Initial Login & Onboarding

- **Admin Portal**: Navigate to `/admin/login`. Click **"First-time setup?"** to create your primary administrative account.
- **Operator Portal**: Operators sign in at `/operator/login` using their mobile number and password assigned by the Admin under **Operators** management.
