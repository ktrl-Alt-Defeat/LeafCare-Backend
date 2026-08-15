# LeafCare Backend — API Endpoint Reference Documentation

**Base URL:** `http://localhost:5000`  
**API Version:** `v1` (`/api/v1`)  
**Format:** JSON (`application/json`)  
**Documentation UI:** `http://localhost:5000/docs`  
**OpenAPI Spec:** `http://localhost:5000/docs.json`  

---

## Table of Contents
1. [System & Operations](#1-system--operations)
2. [Language Module](#2-language-module)
3. [Crop Agronomy Module](#3-crop-agronomy-module)
4. [Plant Pathology Module](#4-plant-pathology-module)
5. [Knowledge Base Module](#5-knowledge-base-module)
6. [Community Forum Module](#6-community-forum-module)
7. [Marketplace Module](#7-marketplace-module)

---

## 1. System & Operations

### `GET /`
* **Summary:** Root Server Welcome Message
* **Description:** Serves service metadata, status, version, and links to documentation.
* **Authentication:** None
* **Response (200 OK):**
  ```json
  {
    "message": "LeafCare Multilingual Agricultural Advisory API",
    "status": "online",
    "version": "1.0.0",
    "documentation": "http://localhost:5000/docs",
    "timestamp": "2026-08-15T04:44:05.337Z"
  }
  ```

---

### `GET /api/v1`
* **Summary:** API Index & Endpoints Registry
* **Description:** Serves index of all available modules and operation endpoints.
* **Authentication:** None
* **Response (200 OK):**
  ```json
  {
    "service": "LeafCare API",
    "version": "1.0.0",
    "apiVersion": "v1",
    "environment": "development",
    "status": "online",
    "documentation": "/docs",
    "openapi": "/docs.json",
    "endpoints": {
      "operations": ["/api/v1/health", "/api/v1/ready", "/api/v1/ai/health"],
      "languages": ["/api/v1/languages"],
      "crops": ["/api/v1/crops", "/api/v1/crops/search", "/api/v1/crops/{id_or_slug}"],
      "diseases": ["/api/v1/diseases", "/api/v1/diseases/search", "/api/v1/diseases/{id_or_slug}"],
      "knowledge": ["/api/v1/knowledge/categories", "/api/v1/knowledge/articles"],
      "community": ["/api/v1/community/categories", "/api/v1/community/posts", "/api/v1/community/search"],
      "marketplace": ["/api/v1/marketplace/categories", "/api/v1/marketplace/products", "/api/v1/marketplace/search"]
    },
    "timestamp": "2026-08-15T04:44:05.337Z"
  }
  ```

---

### `GET /api/v1/health`
* **Summary:** Liveness Probe & Database Ping
* **Description:** Checks if the service and primary database connection are healthy. Exempt from rate limiting.
* **Authentication:** None
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "database": "connected",
      "timestamp": "2026-08-15T04:44:05.337Z"
    }
  }
  ```
* **Response (503 Service Unavailable):** Database unreachable.

---

### `GET /api/v1/ready`
* **Summary:** Readiness Probe
* **Description:** Evaluates mandatory and optional dependencies before accepting traffic. Exempt from rate limiting.
* **Authentication:** None
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "status": "ready",
      "dependencies": {
        "database": "connected",
        "aiService": "optional_not_configured"
      }
    }
  }
  ```

---

### `GET /api/v1/ai/health`
* **Summary:** External AI Inference Service Status
* **Description:** Reports the health status of the external plant disease classification model. Returns `not_configured` when `AI_SERVICE_URL` environment variable is unset.
* **Authentication:** None
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "status": "not_configured",
      "message": "AI inference service URL is not configured in environment"
    }
  }
  ```

---

## 2. Language Module

### `GET /api/v1/languages`
* **Summary:** List Active System Languages
* **Description:** Retrieves all supported and active languages for localization (e.g., English, Hindi, Tamil, Telugu).
* **Authentication:** None
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "language_code": "en",
        "language_name": "English",
        "native_name": "English",
        "sort_order": 1,
        "is_active": true
      },
      {
        "language_code": "hi",
        "language_name": "Hindi",
        "native_name": "हिन्दी",
        "sort_order": 2,
        "is_active": true
      }
    ]
  }
  ```

---

## 3. Crop Agronomy Module

### `GET /api/v1/crops`
* **Summary:** List Agronomy Crops
* **Description:** Retrieves a paginated list of crops with localized translations.
* **Query Parameters:**
  * `page` *(optional, integer, default: `1`)*: Page number.
  * `limit` *(optional, integer, default: `10`)*: Items per page.
  * `lang` *(optional, string, default: `"en"`)*: Language code ISO.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "c1f7b8e2-9f3a-4e2b-8a1c-7b9d5e3f1a2b",
          "slug": "tomato",
          "scientific_name": "Solanum lycopersicum",
          "crop_name": "Tomato",
          "description": "Warm-season crop widely cultivated across regions.",
          "icon_name": "tomato-icon",
          "image_url": "https://cdn.leafcare.org/crops/tomato.jpg"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 25,
        "totalPages": 3
      }
    }
  }
  ```

---

### `GET /api/v1/crops/search`
* **Summary:** Search Crops
* **Description:** Search crops by localized name, scientific name, or slug keyword.
* **Query Parameters:**
  * `q` *(required, string)*: Search keyword.
  * `lang` *(optional, string, default: `"en"`)*: Target language.
* **Response (200 OK):** Returns matching crops list.

---

### `GET /api/v1/crops/{id_or_slug}`
* **Summary:** Get Crop Details by ID or Slug
* **Description:** Fetches comprehensive crop agronomy information, optimal soil/climate parameters, companion crop relationships, and sowing guides.
* **Path Parameters:**
  * `id_or_slug` *(required, string)*: Crop UUID or unique slug (e.g. `tomato`).
* **Query Parameters:**
  * `lang` *(optional, string, default: `"en"`)*: Target language code.
* **Response (200 OK):** Detailed crop object with companions and translations.
* **Response (404 Not Found):** Crop not found.

---

## 4. Plant Pathology Module

### `GET /api/v1/diseases`
* **Summary:** List Plant Diseases
* **Description:** Retrieves a paginated list of plant diseases with localized names, symptoms, and severity levels.
* **Query Parameters:**
  * `page` *(optional, integer, default: `1`)*: Page number.
  * `limit` *(optional, integer, default: `10`)*: Items per page.
  * `lang` *(optional, string, default: `"en"`)*: Language code.
* **Response (200 OK):** Paginated disease catalog.

---

### `GET /api/v1/diseases/search`
* **Summary:** Search Diseases
* **Description:** Search plant diseases by symptom keywords or localized names.
* **Query Parameters:**
  * `q` *(required, string)*: Search keyword.
  * `lang` *(optional, string, default: `"en"`)*: Language code.
* **Response (200 OK):** Matching disease results.

---

### `GET /api/v1/diseases/{id_or_slug}`
* **Summary:** Get Disease Pathology Details
* **Description:** Retrieves detailed pathology information, affected host crops, symptoms, organic remedies, and chemical treatment guidelines.
* **Path Parameters:**
  * `id_or_slug` *(required, string)*: Disease UUID or slug (e.g. `early-blight-tomato`).
* **Query Parameters:**
  * `lang` *(optional, string, default: `"en"`)*: Target language code.
* **Response (200 OK):** Full disease pathology profile and localized treatments.
* **Response (404 Not Found):** Disease not found.

---

## 5. Knowledge Base Module

### `GET /api/v1/knowledge`
* **Summary:** Knowledge Base API Index
* **Description:** Endpoint index for the CMS knowledge base module.

---

### `GET /api/v1/knowledge/categories`
* **Summary:** List Knowledge Categories
* **Description:** Retrieves CMS article categories with localized names and descriptions.
* **Query Parameters:**
  * `lang` *(optional, string, default: `"en"`)*: Language code.

---

### `GET /api/v1/knowledge/articles`
* **Summary:** List Published Articles
* **Description:** Retrieves a paginated feed of published agricultural advisory articles.
* **Query Parameters:**
  * `page` *(optional, integer, default: `1`)*: Page number.
  * `limit` *(optional, integer, default: `10`)*: Page size.
  * `lang` *(optional, string, default: `"en"`)*: Language code.

---

### `GET /api/v1/knowledge/articles/{id_or_slug}`
* **Summary:** Get Article Details
* **Description:** Fetches full body content, author information, hero image, and tagged crops/diseases for a knowledge article.
* **Path Parameters:**
  * `id_or_slug` *(required, string)*: Article UUID or slug.
* **Query Parameters:**
  * `lang` *(optional, string, default: `"en"`)*: Target language code.

---

## 6. Community Forum Module

### `GET /api/v1/community`
* **Summary:** Community Forum API Index
* **Description:** Endpoint index for the community forum module.

---

### `GET /api/v1/community/categories`
* **Summary:** List Forum Categories
* **Description:** Returns predefined forum post categories:
  * `disease_help`
  * `crop_advice`
  * `fertilizer`
  * `irrigation`
  * `weather`
  * `marketplace`
  * `general`

---

### `GET /api/v1/community/posts`
* **Summary:** Retrieve Community Posts Feed
* **Description:** Retrieves public community discussion posts with author details, creation timestamps, and comment counts.
* **Query Parameters:**
  * `page` *(optional, integer, default: `1`)*: Page number.
  * `limit` *(optional, integer, default: `10`)*: Page size.
  * `category` *(optional, string)*: Filter by category enum.

---

### `GET /api/v1/community/search`
* **Summary:** Search Community Posts
* **Description:** Search posts by title or content keywords.
* **Query Parameters:**
  * `q` *(required, string)*: Search keyword.

---

### `GET /api/v1/community/posts/{id}`
* **Summary:** Get Post Details with Comments
* **Description:** Fetches a single forum post by ID, along with its complete threaded comments and likes metadata.
* **Path Parameters:**
  * `id` *(required, UUID string)*: Post ID.

---

## 7. Marketplace Module

### `GET /api/v1/marketplace`
* **Summary:** Marketplace API Index
* **Description:** Endpoint index for the marketplace module.

---

### `GET /api/v1/marketplace/categories`
* **Summary:** List Product Categories
* **Description:** Returns product categories:
  * `seeds`
  * `fertilizers`
  * `crop_protection`
  * `tools`
  * `equipment`

---

### `GET /api/v1/marketplace/products`
* **Summary:** List Marketplace Products
* **Description:** Retrieves catalog products with pricing, currency, seller information, and stock quantity.
* **Query Parameters:**
  * `page` *(optional, integer, default: `1`)*: Page number.
  * `limit` *(optional, integer, default: `10`)*: Page size.
  * `category` *(optional, string)*: Filter by product category.
  * `is_organic` *(optional, boolean)*: Filter organic products.

---

### `GET /api/v1/marketplace/search`
* **Summary:** Search Products
* **Description:** Search products by product name or description keywords.
* **Query Parameters:**
  * `q` *(required, string)*: Search keyword.

---

### `GET /api/v1/marketplace/products/{id}`
* **Summary:** Get Product Details with Reviews
* **Description:** Retrieves detailed product specifications, stock status, seller profile, and buyer reviews with rating metrics.
* **Path Parameters:**
  * `id` *(required, UUID string)*: Product ID.

---

## 8. Frontend Integration (http://localhost:3000)

### Configuration Summary
* **Frontend Origin:** `http://localhost:3000` (and `http://127.0.0.1:3000`)
* **Backend API Base URL:** `http://localhost:5000/api/v1`
* **CORS Credentials:** Enabled (`credentials: true`)

### Sample Integration Code (JavaScript / React / Axios / Fetch)

#### Native `fetch` Example:
```javascript
const API_BASE_URL = 'http://localhost:5000/api/v1';

// Fetch Crops in Hindi (hi) or English (en)
async function getCrops(language = 'en', page = 1) {
  try {
    const response = await fetch(`${API_BASE_URL}/crops?lang=${language}&page=${page}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    console.log('Crops data:', result.data);
    return result.data;
  } catch (error) {
    console.error('Failed to fetch crops:', error);
  }
}
```

#### Axios Instance Example (`src/api/client.js` in Frontend):
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

