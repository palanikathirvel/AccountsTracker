// ============================================================
// MongoDB Cloud (Atlas) Collection Setup & Indexes
// Database: accountant_tracker
// ============================================================

// Connect to or switch to database
db = db.getSiblingDB("accountant_tracker");

// 1. Users Collection
db.createCollection("users");
db.users.createIndex({ "email": 1 }, { unique: true });

// 2. Requests Collection
db.createCollection("requests");
db.requests.createIndex({ "dueDateTime": 1 });
db.requests.createIndex({ "status": 1 });
db.requests.createIndex({ "assigneeEmail": 1 });
db.requests.createIndex({ "status": 1, "dueDateTime": 1 });

// 3. Reminders Collection
db.createCollection("reminders");
db.reminders.createIndex({ "generatedAt": -1 });
db.reminders.createIndex({ "requestId": 1 });

print("MongoDB Cloud collections and indexes successfully initialized for accountant_tracker!");
