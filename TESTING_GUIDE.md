# Testing Guide for Properties API

## Quick Start

### 1. Verify API Routes are Registered

Run this command to see all registered API routes:

```bash
php artisan route:list --path=api
```

You should see these routes:
- `GET /api/properties`
- `GET /api/properties/status`
- `GET /api/properties/type`

### 2. Test the API Endpoints

#### Method 1: Using cURL

```bash
# Test basic endpoint
curl -X GET "http://localhost:8000/api/properties"

# Test with pagination
curl -X GET "http://localhost:8000/api/properties?page=1&per_page=10"

# Test by status
curl -X GET "http://localhost:8000/api/properties/status?status=available&page=1"

# Test by type
curl -X GET "http://localhost:8000/api/properties/type?type=rental&page=1"
```

#### Method 2: Using Browser

Simply navigate to:
- http://localhost:8000/api/properties
- http://localhost:8000/api/properties?page=1&per_page=20

#### Method 3: Using Postman or Insomnia

Import these requests:

**GET All Properties**
- URL: `http://localhost:8000/api/properties`
- Query Params: 
  - `page`: 1
  - `per_page`: 20

**GET Properties by Status**
- URL: `http://localhost:8000/api/properties/status`
- Query Params:
  - `status`: available
  - `page`: 1
  - `per_page`: 20

**GET Properties by Type**
- URL: `http://localhost:8000/api/properties/type`
- Query Params:
  - `type`: rental
  - `page`: 1
  - `per_page`: 20

### 3. Test Frontend Integration

#### Using the Example Component

1. Import the example component in a page:

```typescript
// In resources/js/pages/properties/all.tsx (create this file)
import { PropertiesInfiniteScrollExample } from '@/components/properties-infinite-scroll-example';

export default function AllPropertiesPage() {
  return <PropertiesInfiniteScrollExample />;
}
```

2. Add a route in your Laravel routes (if using Inertia):

```php
// In routes/web.php or routes/tenant.php
Route::get('/all-properties', function () {
    return Inertia::render('properties/all');
})->name('properties.all');
```

#### Using the Hook Directly

```typescript
import { useInfiniteProperties } from '@/hooks/use-infinite-properties';

function MyComponent() {
  const { 
    properties, 
    loading, 
    hasMore, 
    error, 
    meta, 
    loadMore, 
    refresh 
  } = useInfiniteProperties({
    perPage: 20,
    endpoint: 'all',
  });

  if (loading && properties.length === 0) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Found {meta?.total} properties</h1>
      {properties.map(property => (
        <div key={`${property.tenant_id}-${property.id}`}>
          <h2>{property.address}</h2>
          <p>{property.display_price}</p>
        </div>
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### 4. Verify Data Structure

Expected response format:

```json
{
  "data": [
    {
      "id": 1,
      "tenant_id": "abc123",
      "address": "123 Main Street",
      "city": "Karachi",
      "province": "Sindh",
      "price": "50000.00",
      "formatted_price": "Rs. 50,000/mo",
      "display_price": "Rs. 50,000/mo",
      "type": "rental",
      "status": "available",
      "bedrooms": 3,
      "bathrooms": 2,
      "square_feet": 1200,
      "primary_image": {
        "id": 1,
        "image_url": "/storage/properties/image.jpg",
        "alt_text": "Front view"
      },
      "created_at": "2025-11-01T10:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 150,
    "last_page": 8,
    "has_more_pages": true,
    "from": 1,
    "to": 20
  }
}
```

### 5. Performance Testing

Test with multiple tenants and properties:

```bash
# Create test tenants (if needed)
php artisan tinker

# In tinker:
use App\Models\Tenant;
$tenant = Tenant::create(['id' => 'test-tenant-1']);
$tenant->domains()->create(['domain' => 'test1.localhost']);

# Then switch to tenant context and create properties
tenancy()->initialize($tenant);
App\Models\Property::factory(50)->create();
tenancy()->end();
```

### 6. Check Logs for Errors

If something doesn't work, check the logs:

```bash
tail -f storage/logs/laravel.log
```

Look for any errors related to:
- Tenancy initialization
- Database connections
- Property fetching

### 7. Verify Tenancy Isolation

Ensure each tenant's properties are correctly isolated:

```php
// Test script
php artisan tinker

use App\Models\Tenant;
use App\Models\Property;

$tenants = Tenant::all();

foreach ($tenants as $tenant) {
    tenancy()->initialize($tenant);
    $count = Property::count();
    echo "Tenant {$tenant->id}: {$count} properties\n";
    tenancy()->end();
}
```

## Common Issues and Solutions

### Issue 1: "Route [api.properties.index] not defined"

**Solution:** Clear route cache
```bash
php artisan route:clear
php artisan route:cache
```

### Issue 2: API returns empty data

**Possible Causes:**
1. No tenants in database
2. No properties in tenant databases
3. Tenancy not initialized correctly

**Solution:**
```bash
# Check if tenants exist
php artisan tinker
App\Models\Tenant::count();

# Check if tenant databases have tables
tenancy()->initialize(App\Models\Tenant::first());
Schema::hasTable('properties');
```

### Issue 3: CORS errors in browser

**Solution:** Update `config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['*'], // or specify your frontend URL
```

### Issue 4: Slow response times

**Solutions:**
1. Add database indexes
2. Implement caching
3. Reduce `per_page` size
4. Use eager loading (already implemented)

## Performance Benchmarks

Expected performance (approximate):

- **1-5 tenants, <1000 properties total:** < 500ms
- **5-10 tenants, 1000-5000 properties:** 500ms - 2s
- **10+ tenants, 5000+ properties:** Consider caching

## Next Steps

After basic testing:

1. ✅ Verify all endpoints work
2. ✅ Test pagination
3. ✅ Test filtering (status, type)
4. 🔒 Add authentication (Sanctum)
5. 🔒 Add rate limiting
6. ⚡ Implement caching
7. 📊 Add monitoring/logging
8. 🧪 Write automated tests

## Automated Testing

Create a feature test:

```bash
php artisan make:test PropertyApiTest
```

Example test:

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PropertyApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_all_properties(): void
    {
        $response = $this->getJson('/api/properties');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data',
                     'meta' => [
                         'current_page',
                         'per_page',
                         'total',
                         'has_more_pages',
                     ]
                 ]);
    }

    public function test_pagination_works(): void
    {
        $response = $this->getJson('/api/properties?page=1&per_page=10');

        $response->assertStatus(200)
                 ->assertJsonPath('meta.per_page', 10)
                 ->assertJsonPath('meta.current_page', 1);
    }

    public function test_can_filter_by_status(): void
    {
        $response = $this->getJson('/api/properties/status?status=available');

        $response->assertStatus(200)
                 ->assertJsonPath('meta.status', 'available');
    }
}
```

Run tests:

```bash
php artisan test --filter=PropertyApiTest
```

## Monitoring

Add logging to track usage:

```php
// In the controller
Log::info('Properties API called', [
    'page' => $page,
    'per_page' => $perPage,
    'total_properties' => $total,
    'tenants_count' => $tenants->count(),
    'response_time' => microtime(true) - $startTime,
]);
```

View logs:

```bash
tail -f storage/logs/laravel.log | grep "Properties API"
```

