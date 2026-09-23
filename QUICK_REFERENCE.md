# 🎯 Quick Reference Card

## Admin Credentials
**Email**: `admin@gmail.com`  
**Password**: `Admin@123`

## URLs
- **Main App**: http://localhost:3000/
- **Admin Dashboard**: http://localhost:3000/admin

## Customer Login
1. Click "Continue as Customer"
2. Enter any **unique username**
3. Start exploring

## What's Now Tracking

### Every User Action:
✅ Session start with username  
✅ Banner views and clicks  
✅ Search queries  
✅ Destination selection  
✅ Vehicle choice  
✅ Captain assignment  
✅ Ride progress  
✅ Ride completion  
✅ All Ownly touchpoint clicks  

### Where Data Goes:
- **Real-time**: NeonDB (Postgres)
- **Admin View**: Live dashboard (3s refresh)
- **Export**: JSON download available

## Logout
- **Customer**: Click profile icon (top right)
- **Admin**: Click "Logout" button (top right)

## Debugging
Check browser console for:
- "Creating session:" - Session initialization
- "Logging event:" - Each interaction
- "Event logged:" - Confirmation

## Database Check
```bash
npm run db:studio
```
Opens Drizzle Studio to view raw data

## Common Issues

### "No sessions yet"
- Make sure customer has completed actions
- Check browser console for errors
- Verify DATABASE_URL in .env.local

### Auth issues
- Clear localStorage: `localStorage.clear()` in console
- Restart from /login

### Data not showing
- Wait 3 seconds for refresh
- Check terminal for API errors
- Verify NeonDB connection

---

**All systems operational! 🚀**
