# BotNexa - WhatsApp Bot Management System

## Quick Start

```bash
# Install dependencies
npm install

# Run development server with node-dev
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Database Migration Guide

### Current Issue Fix
We're addressing the database error:
```
QueryFailedError: column "user" of relation "activity_logs" contains null values
```

### Steps to Fix

1. **Stop the Application**
```bash
# If running in dev mode
Ctrl + C

# If running in production
pm2 stop all
```

2. **Backup Your Database** (Important!)
```bash
pg_dump -U postgres botnexadb > backup_$(date +%Y%m%d).sql
```

3. **Run the Migration**
```bash
# Run the migration script
npm run migration:run
```

4. **Verify the Changes**
```bash
# Check migration status
npm run migration:show

# Check database structure
\d activity_logs  # In psql
```

### Migration Details

The migration `UpdateActivityLogs1703207400000` makes the following changes:

1. **Schema Updates**
   - Adds enum types for actions and statuses
   - Updates column names to follow conventions
   - Makes user/bot references nullable
   - Adds proper foreign key constraints

2. **Data Handling**
   - Preserves existing data
   - Converts string values to enum types
   - Updates relationships

### Available Commands

```bash
# Development
npm run dev              # Start development server with node-dev
npm start               # Start production server
npm run build           # Build TypeScript files

# Migration Commands
npm run migration:run      # Apply migrations
npm run migration:revert   # Revert last migration
npm run migration:show     # Show migration status
npm run migration:create   # Create new migration
npm run migration:generate # Generate migration from changes

# Schema Commands
npm run schema:sync       # Sync database schema
npm run schema:log        # Show pending changes
npm run schema:drop       # Drop all tables (CAUTION!)

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

### Entity Changes

The following entities have been updated:

1. **ActivityLogs**
   - New enum types for actions and status
   - Nullable relationships with Users and Bots
   - Improved type safety
   - Better error handling

2. **Users & Bots**
   - Updated relationships
   - Added helper methods
   - Improved type definitions

### Post-Migration Steps

1. **Verify Data**
```sql
SELECT * FROM activity_logs LIMIT 5;
```

2. **Check Relationships**
```sql
SELECT a.*, u.name as user_name, b.name as bot_name 
FROM activity_logs a 
LEFT JOIN users u ON a."userId" = u.id 
LEFT JOIN bots b ON a."botId" = b.id 
LIMIT 5;
```

3. **Test Application**
```bash
# Start in development mode
npm run dev

# Check for any errors in logs
```

### Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Review the migration logs
3. Try reverting and re-running the migration
4. Restore from backup if needed
5. Open an issue with detailed error information

### Best Practices

1. Always backup before migrations
2. Test migrations in development first
3. Schedule migrations during low-traffic periods
4. Have a rollback plan ready
5. Monitor the application after migration
