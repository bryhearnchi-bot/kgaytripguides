# Form Setup and Data Flow Documentation

## Overview
This document explains the complete data flow and form setup for admin modals in the K-GAY Travel Guides application. This setup ensures proper data fetching from Supabase, correct field mapping, and successful form submissions.

## Table of Contents
1. [Database to Frontend Data Flow](#database-to-frontend-data-flow)
2. [Critical Form Submission Fix](#critical-form-submission-fix)
3. [Field Mapping Requirements](#field-mapping-requirements)
4. [Complete Working Example](#complete-working-example)
5. [Common Issues and Solutions](#common-issues-and-solutions)

---

## Database to Frontend Data Flow

### 1. Database Structure (Supabase PostgreSQL)
All data is stored in Supabase with snake_case field naming:
```sql
-- Example: ships table
CREATE TABLE ships (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cruise_line VARCHAR(255) NOT NULL,  -- Note: snake_case
  capacity INTEGER,
  decks INTEGER,
  image_url TEXT,
  deck_plans_url TEXT,                 -- Note: snake_case
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. API Layer (Express + Supabase Admin)
**CRITICAL:** Use Supabase Admin client for ALL database operations (GET, POST, PUT, DELETE), NOT Drizzle ORM.

#### ⚠️ IMPORTANT: Consistency Required
ALL endpoints for a resource MUST use the same database client. Mixing Drizzle and Supabase Admin causes data sync issues:
- **Problem:** Using Drizzle for GET and Supabase Admin for PUT/POST breaks data visibility
- **Solution:** Use Supabase Admin for ALL operations

```typescript
// ✅ CORRECT: Using Supabase Admin for ALL operations

// GET endpoint
app.get("/api/ships", async (req, res) => {
  const supabaseAdmin = getSupabaseAdmin();
  let query = supabaseAdmin
    .from('ships')
    .select('*')
    .order('name');

  // Apply filters using Supabase syntax
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data: results, error } = await query;

  // Transform snake_case to camelCase for frontend
  const transformedResults = results.map((ship: any) => ({
    id: ship.id,
    name: ship.name,
    cruiseLine: ship.cruise_line,      // snake_case → camelCase
    capacity: ship.capacity,
    decks: ship.decks,
    imageUrl: ship.image_url,          // snake_case → camelCase
    deckPlansUrl: ship.deck_plans_url, // snake_case → camelCase
    description: ship.description,
    createdAt: ship.created_at,
    updatedAt: ship.updated_at
  }));

  res.json(transformedResults);
});

// GET by ID endpoint
app.get("/api/ships/:id", async (req, res) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: ship, error } = await supabaseAdmin
    .from('ships')
    .select('*')
    .eq('id', Number(req.params.id))
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: "Ship not found" });
    }
    // Handle other errors
  }

  // Transform and return
  const transformedShip = { /* same transformation */ };
  res.json(transformedShip);
});

// ❌ WRONG: Mixing database clients
// GET: db.select().from(schema.ships)  // Drizzle
// PUT: supabaseAdmin.from('ships').update()  // Supabase Admin
// This causes data sync issues!
```

### 3. Frontend Data Types
```typescript
// Frontend uses camelCase
interface Ship {
  id?: number;
  name: string;
  cruiseLine: string;     // camelCase
  capacity?: number;
  decks?: number;
  imageUrl?: string;      // camelCase
  deckPlansUrl?: string;  // camelCase
  description?: string;
}
```

---

## Critical Form Submission Fix

### The Problem
The submit button in modal headers was **outside** the form element, preventing form submission.

### The Solution
Connect the button to the form using HTML5 `form` attribute:

```typescript
// AdminFormModal.tsx
export function AdminFormModal({ onSubmit, primaryAction, ... }) {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          {/* Button is HERE - outside the form */}
          <Button
            type={primaryType}
            form={primaryType === 'submit' && onSubmit ? 'admin-modal-form' : undefined}
            //    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            //    THIS connects the button to the form below
          >
            {primaryAction.label}
          </Button>
        </DialogHeader>

        {/* Form is HERE - with matching ID */}
        <form id="admin-modal-form" onSubmit={onSubmit}>
        {/*   ^^^^^^^^^^^^^^^^^^^^^ */}
        {/*   ID matches the form attribute above */}
          {children}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Field Mapping Requirements

### Database → API Transform
```typescript
// When FETCHING from database (GET endpoints)
const transformedShip = {
  // Database field → Frontend field
  id: ship.id,
  name: ship.name,
  cruiseLine: ship.cruise_line,      // cruise_line → cruiseLine
  capacity: ship.capacity,
  decks: ship.decks,
  imageUrl: ship.image_url,          // image_url → imageUrl
  deckPlansUrl: ship.deck_plans_url, // deck_plans_url → deckPlansUrl
  description: ship.description,
  createdAt: ship.created_at,        // created_at → createdAt
  updatedAt: ship.updated_at         // updated_at → updatedAt
};
```

### Frontend → Database Transform
```typescript
// When SAVING to database (POST/PUT endpoints)
const shipData = {
  // Frontend field → Database field
  name: req.body.name,
  cruise_line: req.body.cruiseLine,      // cruiseLine → cruise_line
  capacity: req.body.capacity || null,
  decks: req.body.decks || null,
  image_url: req.body.imageUrl || null,  // imageUrl → image_url
  deck_plans_url: req.body.deckPlansUrl || null, // deckPlansUrl → deck_plans_url
  description: req.body.description || null
};

// ⚠️ IMPORTANT: Handle empty strings in PUT endpoints
// When updating, convert empty strings to null:
if (req.body.imageUrl !== undefined) {
  updateData.image_url = req.body.imageUrl || null;  // "" becomes null
}
```

---

## Complete Working Example

### 1. Form Modal Component
```typescript
// ShipFormModal.tsx
export function ShipFormModal({ ship, onSuccess, ... }) {
  const [formData, setFormData] = useState({
    name: '',
    cruiseLine: '',
    capacity: '',
    decks: '',
    imageUrl: '',
    deckPlansUrl: '',
    description: '',
  });

  // Load existing data when editing
  useEffect(() => {
    if (ship && isOpen) {
      setFormData({
        name: ship.name || '',
        cruiseLine: ship.cruiseLine || '',  // Data comes in camelCase
        capacity: ship.capacity?.toString() || '',
        decks: ship.decks?.toString() || '',
        imageUrl: ship.imageUrl || '',
        deckPlansUrl: ship.deckPlansUrl || '',
        description: ship.description || '',
      });
    }
  }, [ship, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const shipData = {
      name: formData.name.trim(),
      cruiseLine: formData.cruiseLine.trim(),  // Send in camelCase
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      decks: formData.decks ? parseInt(formData.decks) : null,
      imageUrl: formData.imageUrl.trim() || null,
      deckPlansUrl: formData.deckPlansUrl.trim() || null,
      description: formData.description.trim() || null,
    };

    const response = await api.put(`/api/ships/${ship.id}`, shipData);
    // API will transform camelCase → snake_case for database
  };

  return (
    <AdminFormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Edit Ship"
      onSubmit={handleSubmit}  // ← Pass submit handler
      primaryAction={{
        label: 'Update Ship',
        type: 'submit',       // ← Mark as submit type
        disabled: !formData.name.trim() || !formData.cruiseLine.trim()
      }}
    >
      {/* Form fields */}
    </AdminFormModal>
  );
}
```

### 2. API Endpoint (Complete)
```typescript
// server/routes/locations.ts
app.put("/api/ships/:id", requireContentEditor, async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Transform camelCase → snake_case for database
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // ⚠️ CRITICAL: Handle empty strings properly
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.cruiseLine !== undefined) {
      updateData.cruise_line = req.body.cruiseLine; // cruiseLine → cruise_line
    }
    if (req.body.capacity !== undefined) updateData.capacity = req.body.capacity;
    if (req.body.decks !== undefined) updateData.decks = req.body.decks;
    if (req.body.imageUrl !== undefined) {
      // Convert empty string to null for nullable fields
      updateData.image_url = req.body.imageUrl || null;
    }
    if (req.body.deckPlansUrl !== undefined) {
      // Convert empty string to null for nullable fields
      updateData.deck_plans_url = req.body.deckPlansUrl || null;
    }
    if (req.body.description !== undefined) {
      updateData.description = req.body.description || null;
    }

    // Update in database
    const { data: ship, error } = await supabaseAdmin
      .from('ships')
      .update(updateData)
      .eq('id', Number(req.params.id))
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'update ship');
    }

    // Transform snake_case → camelCase for response
    const transformedShip = {
      id: ship.id,
      name: ship.name,
      cruiseLine: ship.cruise_line,
      capacity: ship.capacity,
      decks: ship.decks,
      imageUrl: ship.image_url,
      deckPlansUrl: ship.deck_plans_url,
      description: ship.description,
      createdAt: ship.created_at,
      updatedAt: ship.updated_at
    };

    res.json(transformedShip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ship' });
  }
});
```

---

## Common Issues and Solutions

### Issue 1: Submit Button Doesn't Work
**Problem:** Button appears clickable but nothing happens when clicked.
**Solution:** Ensure button has `form="admin-modal-form"` attribute and form has matching `id="admin-modal-form"`.

### Issue 2: Data Not Loading in Edit Modal
**Problem:** Fields are empty when editing existing records.
**Cause:** Field names don't match between API response and frontend.
**Solution:** Check API transformation is converting snake_case → camelCase correctly.

### Issue 3: Data Not Saving
**Problem:** Form submits but data doesn't save to database.
**Possible Causes:**
1. API not transforming camelCase → snake_case for database
2. Using wrong database client (should use Supabase Admin, not Drizzle)
3. Missing required fields in database

### Issue 4: Fields Missing from API Response
**Problem:** Some fields don't appear in fetched data.
**Solution:** Ensure all database fields are included in the transformation:
```typescript
// Check that EVERY database field is mapped
const transformedResults = results.map((ship: any) => ({
  id: ship.id,
  name: ship.name,
  cruiseLine: ship.cruise_line,      // ← Don't forget this!
  // ... include ALL fields
}));
```

### Issue 5: Data Saves but Doesn't Show When Editing
**Problem:** Data saves to database but doesn't appear when reopening the edit form.
**Root Cause:** GET endpoints using Drizzle ORM while PUT/POST use Supabase Admin.
**Solution:** Ensure ALL endpoints use Supabase Admin:
```typescript
// ❌ WRONG - Mixed clients cause sync issues
app.get("/api/resorts", async (req, res) => {
  const results = await db.select().from(schema.resorts);  // Drizzle
});

app.put("/api/resorts/:id", async (req, res) => {
  const supabaseAdmin = getSupabaseAdmin();  // Supabase Admin
  await supabaseAdmin.from('resorts').update(data);
});

// ✅ CORRECT - Consistent Supabase Admin usage
app.get("/api/resorts", async (req, res) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin.from('resorts').select('*');
});

app.put("/api/resorts/:id", async (req, res) => {
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.from('resorts').update(data);
});
```

### Issue 6: Some Fields Update, Others Don't
**Problem:** Fields like name and description update, but others like URLs or times don't.
**Root Cause:** Empty strings not converted to null for nullable database fields.
**Solution:** Convert empty strings to null in PUT endpoints:
```typescript
// ❌ WRONG - Empty strings break nullable fields
if (req.body.imageUrl !== undefined) {
  updateData.image_url = req.body.imageUrl;  // "" gets sent to DB
}

// ✅ CORRECT - Convert empty strings to null
if (req.body.imageUrl !== undefined) {
  updateData.image_url = req.body.imageUrl || null;  // "" becomes null
}
```

---

## Best Practices

### 1. Always Use Supabase Admin Client
```typescript
// ✅ CORRECT
const supabaseAdmin = getSupabaseAdmin();
const { data, error } = await supabaseAdmin.from('ships').select('*');

// ❌ WRONG
const results = await db.select().from(schema.ships);
```

### 2. Consistent Field Naming
- Database: `snake_case`
- API Response: `camelCase`
- Frontend: `camelCase`

### 3. Form Pattern
Always use `AdminFormModal` base component with:
- `onSubmit` prop for form submission
- `primaryAction` with `type: 'submit'`
- Form validation in `disabled` property

### 4. Error Handling
```typescript
try {
  const { data, error } = await supabaseAdmin.from('ships').update(updateData);
  if (error) {
    handleSupabaseError(error, 'update ship');
  }
} catch (error) {
  console.error('Error updating ship:', error);
  res.status(500).json({ error: 'Failed to update ship' });
}
```

---

## Testing Checklist

When implementing a new form modal:

- [ ] Database table exists with correct fields (snake_case)
- [ ] **ALL endpoints (GET, POST, PUT, DELETE) use Supabase Admin client**
- [ ] API GET endpoint transforms snake_case → camelCase
- [ ] API GET by ID endpoint uses `.single()` and transforms fields
- [ ] API POST/PUT endpoint transforms camelCase → snake_case
- [ ] **PUT endpoint converts empty strings to null for nullable fields**
- [ ] Frontend interface matches API response format
- [ ] Form uses `AdminFormModal` component
- [ ] Submit button has `type: 'submit'` in primaryAction
- [ ] Form validation sets `disabled` property correctly
- [ ] Test data loads correctly when editing
- [ ] Test data saves correctly when submitting
- [ ] **Test clearing optional fields (should save as null, not empty string)**
- [ ] Test field updates persist after page refresh
- [ ] **Verify saved data appears when reopening edit form**

---

## Summary

The key to making forms work correctly:

1. **Use Supabase Admin** for all database operations
2. **Transform field names** properly (snake_case ↔ camelCase)
3. **Connect form and button** using `id` and `form` attributes
4. **Follow the AdminFormModal pattern** for consistency

This setup ensures reliable data flow from database → API → frontend → API → database with proper field naming conventions at each layer.