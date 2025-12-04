# Properties API Documentation

## Overview

This API provides endpoints to fetch properties from all tenants in the multi-tenant application. It's designed for optimal performance with infinite scrolling on the frontend using cursor-based pagination.

## Architecture

### Components

1. **API Resources** (`app/Http/Resources/`)
   - `PropertyResource.php` - Formats property data
   - `PropertyImageResource.php` - Formats property image data
   - `PropertyContactResource.php` - Formats property contact data

2. **API Controller** (`app/Http/Controllers/Api/PropertyApiController.php`)
   - Handles multi-tenant property fetching
   - Implements pagination
   - Aggregates data from all tenant databases
   - Handles errors gracefully

3. **Routes** (`routes/api.php`)
   - RESTful API endpoints
   - Prefixed with `/api/properties`

4. **Frontend Hooks** (`resources/js/hooks/use-infinite-properties.ts`)
   - Custom React hook for infinite scrolling
   - Handles pagination state
   - Manages loading and error states

5. **Example Component** (`resources/js/components/properties-infinite-scroll-example.tsx`)
   - Demonstration of infinite scroll implementation
   - Intersection Observer for automatic loading
   - Responsive grid layout

## API Endpoints

### 1. Get All Properties

Fetches all properties from all tenants with pagination.

**Endpoint:** `GET /api/properties`

**Query Parameters:**
- `page` (integer, optional, default: 1) - Current page number
- `per_page` (integer, optional, default: 20) - Items per page

**Example Request:**
```bash
curl -X GET "http://your-domain.com/api/properties?page=1&per_page=20"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "tenant_id": "abc123",
      "address": "123 Main Street",
      "city": "Karachi",
      "province": "Sindh",
      "postal_code": "75500",
      "price": "50000.00",
      "formatted_price": "Rs. 50,000/mo",
      "display_price": "Rs. 50,000/mo",
      "security_deposit": "100000.00",
      "maintenance_charges": "5000.00",
      "price_unit": "per_month",
      "type": "rental",
      "status": "available",
      "category": "residential",
      "sub_category": "apartment",
      "bedrooms": 3,
      "bathrooms": 2,
      "square_feet": 1200,
      "description": "Beautiful apartment in prime location",
      "primary_image": {
        "id": 1,
        "image_url": "/storage/properties/image.jpg",
        "alt_text": "Front view"
      },
      "images": [...],
      "primary_contact": {
        "id": 1,
        "contact_name": "John Doe",
        "contact_email": "john@example.com",
        "contact_phone": "+92-300-1234567",
        "contact_phone_secondary": null,
        "contact_whatsapp": "+92-300-1234567",
        "contact_type": "owner",
        "is_primary": true,
        "notes": null
      },
      "created_at": "2025-11-01T10:00:00.000000Z",
      "updated_at": "2025-11-06T15:30:00.000000Z"
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

### 2. Get Properties by Status

Fetches properties filtered by status from all tenants.

**Endpoint:** `GET /api/properties/status`

**Query Parameters:**
- `status` (string, required) - Property status (e.g., 'available', 'rented', 'sold')
- `page` (integer, optional, default: 1)
- `per_page` (integer, optional, default: 20)

**Example Request:**
```bash
curl -X GET "http://your-domain.com/api/properties/status?status=available&page=1&per_page=20"
```

**Example Response:**
Same structure as "Get All Properties" with additional `status` field in meta.

### 3. Get Properties by Type

Fetches properties filtered by type from all tenants.

**Endpoint:** `GET /api/properties/type`

**Query Parameters:**
- `type` (string, required) - Property type (e.g., 'rental', 'sale')
- `page` (integer, optional, default: 1)
- `per_page` (integer, optional, default: 20)

**Example Request:**
```bash
curl -X GET "http://your-domain.com/api/properties/type?type=rental&page=1&per_page=20"
```

**Example Response:**
Same structure as "Get All Properties" with additional `type` field in meta.

## Performance Considerations

### Optimizations Implemented

1. **Eager Loading**
   - Relationships (images, contacts) are eager loaded to prevent N+1 queries
   - Reduces database queries significantly

2. **Efficient Tenant Iteration**
   - Proper tenancy initialization and termination
   - Ensures no data leakage between tenants

3. **Pagination**
   - Manual pagination implementation for cross-tenant data
   - Metadata includes all necessary information for infinite scroll

4. **Error Handling**
   - Try-catch blocks ensure tenancy is properly ended even on errors
   - Graceful error responses with logging

### Frontend Optimizations

1. **Intersection Observer**
   - Automatic loading when user scrolls near bottom
   - No manual scroll event listeners needed

2. **React Hook Pattern**
   - Reusable across multiple components
   - Manages state efficiently

3. **Conditional Rendering**
   - Loading states
   - Empty states
   - Error states

## Usage Examples

### Frontend - Using the Hook

```typescript
import { useInfiniteProperties } from '@/hooks/use-infinite-properties';

function MyPropertiesPage() {
  const { properties, loading, hasMore, loadMore } = useInfiniteProperties({
    perPage: 20,
    endpoint: 'all',
  });

  return (
    <div>
      {properties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  );
}
```

### Frontend - Filter by Status

```typescript
const { properties, loading } = useInfiniteProperties({
  perPage: 20,
  endpoint: 'status',
  status: 'available',
});
```

### Frontend - Filter by Type

```typescript
const { properties, loading } = useInfiniteProperties({
  perPage: 20,
  endpoint: 'type',
  type: 'rental',
});
```

### cURL Examples

```bash
# Get all properties
curl -X GET "http://your-domain.com/api/properties?page=1&per_page=20"

# Get available properties only
curl -X GET "http://your-domain.com/api/properties/status?status=available&page=1"

# Get rental properties only
curl -X GET "http://your-domain.com/api/properties/type?type=rental&page=1"
```

### JavaScript Fetch API

```javascript
// Fetch all properties
async function fetchProperties(page = 1) {
  const response = await fetch(`/api/properties?page=${page}&per_page=20`);
  const data = await response.json();
  return data;
}

// Fetch with filters
async function fetchAvailableProperties(page = 1) {
  const response = await fetch(
    `/api/properties/status?status=available&page=${page}&per_page=20`
  );
  const data = await response.json();
  return data;
}
```

## Security Considerations

⚠️ **Important:** The current implementation does not include authentication or authorization. Before deploying to production:

1. **Add Authentication Middleware**
   ```php
   Route::middleware(['auth:sanctum'])->group(function () {
       Route::get('/properties', [PropertyApiController::class, 'index']);
   });
   ```

2. **Rate Limiting**
   ```php
   Route::middleware(['throttle:api'])->group(function () {
       // Your routes
   });
   ```

3. **API Token Authentication (Laravel Sanctum)**
   - Install and configure Laravel Sanctum
   - Issue API tokens to authenticated users
   - Protect routes with `auth:sanctum` middleware

4. **CORS Configuration**
   - Configure CORS in `config/cors.php`
   - Whitelist allowed origins

5. **Input Validation**
   - Add Form Request classes for validation
   - Sanitize user inputs

## Testing

### Manual Testing

1. Start your Laravel server:
   ```bash
   php artisan serve
   ```

2. Test the endpoint:
   ```bash
   curl http://localhost:8000/api/properties
   ```

### Automated Testing (PHPUnit)

Create tests in `tests/Feature/Api/PropertyApiTest.php`:

```php
public function test_can_fetch_all_properties()
{
    $response = $this->getJson('/api/properties');
    
    $response->assertStatus(200)
             ->assertJsonStructure([
                 'data' => [
                     '*' => [
                         'id',
                         'tenant_id',
                         'address',
                         'city',
                         'price',
                     ]
                 ],
                 'meta' => [
                     'current_page',
                     'per_page',
                     'total',
                     'has_more_pages',
                 ]
             ]);
}
```

## Troubleshooting

### Issue: Properties not showing up

**Solution:**
- Check if tenants exist in the database
- Verify properties exist in tenant databases
- Check Laravel logs: `storage/logs/laravel.log`

### Issue: Tenancy not switching correctly

**Solution:**
- Ensure tenancy middleware is configured
- Check `config/tenancy.php` for correct settings
- Verify tenant databases exist

### Issue: Slow performance with many tenants

**Solutions:**
1. Implement caching:
   ```php
   Cache::remember('all_properties_page_' . $page, 300, function() {
       // Fetch properties
   });
   ```

2. Add database indexes:
   ```php
   $table->index(['created_at', 'id']);
   $table->index('status');
   $table->index('type');
   ```

3. Consider background jobs for large datasets

## Future Enhancements

1. **Search Functionality**
   - Add search by address, city, price range
   - Implement Elasticsearch for better search

2. **Advanced Filtering**
   - Multiple filters (bedrooms, bathrooms, price range)
   - Location-based filtering

3. **Caching Strategy**
   - Cache frequently accessed data
   - Invalidate cache on property updates

4. **Background Processing**
   - Use queues for large tenant sets
   - Implement lazy loading strategies

5. **GraphQL API**
   - Consider GraphQL for more flexible queries
   - Reduce over-fetching

## Support

For issues or questions:
- Check Laravel documentation: https://laravel.com/docs
- Check Tenancy for Laravel documentation: https://tenancyforlaravel.com/docs
- Review application logs in `storage/logs/`

