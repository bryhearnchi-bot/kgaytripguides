#!/bin/bash

# Fix all remaining table references in storage.ts
sed -i '' 's/\.update(itinerary)/.update(schema.itinerary)/g' server/storage.ts
sed -i '' 's/\.delete(itinerary)/.delete(schema.itinerary)/g' server/storage.ts
sed -i '' 's/eq(itinerary\./eq(schema.itinerary./g' server/storage.ts
sed -i '' 's/asc(itinerary\./asc(schema.itinerary./g' server/storage.ts

sed -i '' 's/\.from(events)/.from(schema.events)/g' server/storage.ts
sed -i '' 's/\.insert(events)/.insert(schema.events)/g' server/storage.ts
sed -i '' 's/\.update(events)/.update(schema.events)/g' server/storage.ts
sed -i '' 's/\.delete(events)/.delete(schema.events)/g' server/storage.ts
sed -i '' 's/eq(events\./eq(schema.events./g' server/storage.ts
sed -i '' 's/and(eq(events\./and(eq(schema.events./g' server/storage.ts

sed -i '' 's/\.from(talent)/.from(schema.talent)/g' server/storage.ts
sed -i '' 's/\.insert(talent)/.insert(schema.talent)/g' server/storage.ts
sed -i '' 's/\.update(talent)/.update(schema.talent)/g' server/storage.ts
sed -i '' 's/\.delete(talent)/.delete(schema.talent)/g' server/storage.ts
sed -i '' 's/eq(talent\./eq(schema.talent./g' server/storage.ts

sed -i '' 's/\.from(talentCategories)/.from(schema.talentCategories)/g' server/storage.ts
sed -i '' 's/eq(talentCategories\./eq(schema.talentCategories./g' server/storage.ts

sed -i '' 's/\.from(settings)/.from(schema.settings)/g' server/storage.ts
sed -i '' 's/\.insert(settings)/.insert(schema.settings)/g' server/storage.ts
sed -i '' 's/\.update(settings)/.update(schema.settings)/g' server/storage.ts
sed -i '' 's/eq(settings\./eq(schema.settings./g' server/storage.ts
sed -i '' 's/and(eq(settings\./and(eq(schema.settings./g' server/storage.ts

sed -i '' 's/\.from(cruiseTalent)/.from(schema.tripTalent)/g' server/storage.ts
sed -i '' 's/\.insert(cruiseTalent)/.insert(schema.tripTalent)/g' server/storage.ts
sed -i '' 's/\.delete(cruiseTalent)/.delete(schema.tripTalent)/g' server/storage.ts
sed -i '' 's/eq(cruiseTalent\./eq(schema.tripTalent./g' server/storage.ts

sed -i '' 's/\.from(tripInfoSections)/.from(schema.tripInfoSections)/g' server/storage.ts
sed -i '' 's/\.insert(tripInfoSections)/.insert(schema.tripInfoSections)/g' server/storage.ts
sed -i '' 's/\.update(tripInfoSections)/.update(schema.tripInfoSections)/g' server/storage.ts
sed -i '' 's/\.delete(tripInfoSections)/.delete(schema.tripInfoSections)/g' server/storage.ts
sed -i '' 's/eq(tripInfoSections\./eq(schema.tripInfoSections./g' server/storage.ts

echo "Storage.ts schema references fixed!"