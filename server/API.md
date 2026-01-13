# Blog Backend API Documentation

## Base URL
`http://localhost:3003`

## Authentication
Most endpoints require authentication. Include the token in the Authorization header:
`Authorization: Bearer <your-token>`

## Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Posts

#### Get All Posts
```http
GET /api/posts
```

#### Get Single Post
```http
GET /api/posts/:id
```

#### Create Post
```http
POST /api/posts
Content-Type: application/json

{
  "id": "post-123",
  "title": "My Blog Post",
  "content": "Post content here...",
  "summary": "Brief summary",
  "tags": ["tech", "programming"],
  "author": "admin"
}
```

#### Update Post
```http
PUT /api/posts/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content",
  "summary": "Updated summary",
  "tags": ["tech", "updated"]
}
```

#### Delete Post
```http
DELETE /api/posts/:id
Authorization: Bearer <token>
```

#### Increment Post Views
```http
POST /api/posts/:id/view
```

### File Upload

#### Upload Markdown File
```http
POST /api/upload
Content-Type: multipart/form-data

file: <markdown-file>
```

### Stats

#### Get Blog Statistics
```http
GET /api/stats
```

#### Increment Total Visits
```http
POST /api/stats/visit
```

### Admin Only

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <admin-token>
```

#### Delete User
```http
DELETE /api/admin/users/:username
Authorization: Bearer <admin-token>
```

## Database Schema

### Posts Table
- id (TEXT PRIMARY KEY)
- title (TEXT NOT NULL)
- content (TEXT NOT NULL)
- summary (TEXT)
- tags (TEXT - JSON array)
- createdAt (TEXT NOT NULL)
- author (TEXT NOT NULL)
- views (INTEGER DEFAULT 0)
- status (TEXT DEFAULT 'published')

### Users Table
- username (TEXT PRIMARY KEY)
- password (TEXT NOT NULL)
- email (TEXT)
- role (TEXT DEFAULT 'user')
- createdAt (TEXT NOT NULL)

### Stats Table
- key (TEXT PRIMARY KEY)
- value (INTEGER DEFAULT 0)

## Default Admin User
- Username: admin
- Password: admin123
- Role: admin

## Running the Server

```bash
cd server
npm install
npm run dev
```

The server will start on http://localhost:3003 by default.