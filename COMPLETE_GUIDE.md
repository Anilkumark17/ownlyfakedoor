# Complete Setup Guide

## ✅ Features Implemented

### 1. **User Authentication**
- **Customer Login**: Enter unique username to start
- **Admin Login**: admin@gmail.com / Admin@123
- **Logout**: Available in both customer app and admin dashboard

### 2. **Complete Behavior Tracking**
All user interactions are stored in NeonDB:
- Session start with username
- Banner impressions, clicks, dismissals
- Search queries
- Destination selection
- Vehicle selection
- Captain assignment
- Ride progress and completion
- All Ownly touchpoint interactions

### 3. **Admin Dashboard**
- **Authentication Required**: admin@gmail.com
- **Real-time Updates**: Every 3 seconds
- **Overview Tab**:
  - Key metrics (sessions, conversions, CTR, rides)
  - Journey funnel visualization
  - Ownly touchpoint performance
- **Sessions Tab**:
  - Individual session details
  - Journey timeline with durations
  - Complete event log
- **Export**: Download all data as JSON
- **Logout**: Secure session management

### 4. **Database Integration**
- **NeonDB**: Serverless Postgres
- **Drizzle ORM**: Type-safe database queries
- **Tables**:
  - `sessions`: User profiles and funnel flags
  - `events`: Complete behavioral events

## 🚀 How to Use

### Development
\`\`\`bash
npm run dev
\`\`\`

### Production
\`\`\`bash
npm run build
npm start
\`\`\`

## 📊 Access Points

### Customer Experience
1. Go to http://localhost:3000/
2. Click "Continue as Customer"
3. Enter a unique username (e.g., "user123")
4. Start exploring the Rapido experience
5. Click profile icon (top right) to logout

### Admin Dashboard
1. Go to http://localhost:3000/
2. Click "Admin Login"
3. Email: **admin@gmail.com**
4. Password: **Admin@123**
5. View complete behavior analytics
6. Export data or logout

## 🎯 Event Tracking

All events are automatically logged:
- `session_start` - When user begins
- `banner_impression` - Banner shown
- `banner_click` - User clicks Ownly banner
- `search_term` - Search query entered
- `destination_selected` - Destination chosen
- `vehicle_selected` - Vehicle type picked
- `captain_found` - Captain assigned
- `ride_started` - Ride begins
- `ride_complete` - Ride finishes
- `ride_search_ad_click` - Any Ownly ad clicked

## 📁 Key Files

### Authentication
- `app/login/page.tsx` - Login UI for customer and admin
- `lib/constants.ts` - Admin credentials

### Customer App
- `components/study/StudyApp.tsx` - Full Rapido experience
- User journey with Ownly promotions

### Admin Dashboard
- `app/admin/page.tsx` - Analytics dashboard
- Real-time session tracking and analysis

### Database
- `lib/db/schema.ts` - Database tables
- `lib/db/index.ts` - Database connection
- `app/api/sessions/route.ts` - Create sessions
- `app/api/events/route.ts` - Log events
- `app/api/admin/sessions/route.ts` - Fetch analytics

## 🔐 Admin Credentials

**Email**: admin@gmail.com  
**Password**: Admin@123

## 🎨 User Experience Flow

1. **Login** → Enter username
2. **Home** → See Rapido app with Ownly banner
3. **Search** → Find destination
4. **Vehicle** → Select ride type (Ownly promotion)
5. **Captain** → Find captain (Ownly ad)
6. **Ride** → Track progress (Ownly ad)
7. **Complete** → Finish ride (Ownly CTA)
8. **Ownly** → Click any promotion to redirect

## 📈 Analytics Features

### Overview Metrics
- Total sessions
- Ownly conversions
- Banner CTR
- Ad clicks
- Completed rides

### Journey Funnel
- Session start → Complete ride
- Conversion rates at each step
- Ownly click-through highlighted

### Touchpoint Analysis
- Top Banner performance
- Home Feed Card clicks
- Vehicle Selection prompts
- Captain Found ads
- In-ride promotions
- Completion CTAs
- Bottom Navigation

### Session Details
- Complete user journey timeline
- Time spent in each state
- All Ownly interactions
- Raw event log (color-coded)

## 🔄 Data Flow

1. User action triggers event
2. Event sent to `/api/events`
3. Stored in NeonDB
4. Admin dashboard fetches via `/api/admin/sessions`
5. Real-time display in UI
6. Export available as JSON

## 🛠️ Database Commands

\`\`\`bash
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio GUI
\`\`\`

## 📝 Notes

- Usernames must be unique per session
- Admin dashboard auto-refreshes
- All data persists in NeonDB
- Console logs available for debugging
- Logout clears authentication
- Export includes journey analysis

## 🎯 Research Objectives

This prototype tracks 10 key objectives:
1. Organic banner click-through
2. Order attempt rate
3. Repeat intent signals
4. Banner awareness
5. Search term logging
6. Restaurant/destination interest
7. Coverage gap identification
8. Substitute behavior
9. Waitlist engagement
10. Captain trust interaction

All metrics available in admin dashboard!
