# Design Document: Intelligent Leave Management System

## Overview

The Intelligent Leave Management System is a full-stack web application built with Next.js (frontend) and Node.js/Express (backend), using PostgreSQL for data persistence and Redis for caching. The system automates leave request evaluation through a configurable rule engine that analyzes team workload, project deadlines, and team availability to automatically approve or escalate requests.

The architecture follows clean architecture principles with clear separation between presentation, business logic, and data layers. Real-time updates are delivered via WebSocket connections, and the system is designed for horizontal scalability with stateless API servers.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Next.js Frontend<br/>TypeScript + Tailwind]
    end
    
    subgraph "API Layer"
        API[Express API Server<br/>Stateless]
        WS[WebSocket Server]
        Auth[JWT Auth Middleware]
    end
    
    subgraph "Business Logic Layer"
        RuleEngine[Rule Engine]
        WorkloadAnalyzer[Workload Analyzer]
        NotificationService[Notification Service]
        LeaveService[Leave Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Cache[(Redis Cache)]
    end
    
    subgraph "External Services"
        Email[Email Service<br/>SMTP]
    end
    
    UI -->|HTTPS| API
    UI -->|WSS| WS
    API --> Auth
    Auth --> LeaveService
    Auth --> RuleEngine
    LeaveService --> WorkloadAnalyzer
    LeaveService --> RuleEngine
    RuleEngine --> NotificationService
    NotificationService --> Email
    LeaveService --> DB
    WorkloadAnalyzer --> DB
    RuleEngine --> DB
    LeaveService --> Cache
    WS --> Cache
```

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts (data visualization)
- FullCalendar (calendar component)
- Socket.io-client (WebSocket)

**Backend:**
- Node.js 18+
- Express.js
- TypeScript
- Prisma ORM
- Socket.io (WebSocket server)
- JWT (jsonwebtoken)
- bcrypt (password hashing)

**Data Storage:**
- PostgreSQL 15+ (primary database)
- Redis 7+ (caching and session management)

**Deployment:**
- Docker containers
- Environment-based configuration

## Components and Interfaces

### 1. Authentication Service

**Responsibility:** Handle user authentication and JWT token management.

**Interface:**
```typescript
interface AuthService {
  // Authenticate user with credentials
  authenticate(email: string, password: string): Promise<AuthResult>
  
  // Verify JWT token and extract user info
  verifyToken(token: string): Promise<UserPayload>
  
  // Refresh expired token
  refreshToken(token: string): Promise<string>
  
  // Hash password for storage
  hashPassword(password: string): Promise<string>
  
  // Verify password against hash
  verifyPassword(password: string, hash: string): Promise<boolean>
}

interface AuthResult {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: UserRole
    teamId: string
  }
}

type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN'

interface UserPayload {
  userId: string
  email: string
  role: UserRole
  teamId: string
}
```

**Implementation Notes:**
- Use bcrypt with cost factor 12 for password hashing
- JWT tokens expire after 8 hours
- Include user role and team ID in JWT payload for authorization
- Implement rate limiting: 5 failed attempts per email per 15 minutes

### 2. Leave Service

**Responsibility:** Manage leave request lifecycle, balance tracking, and history.

**Interface:**
```typescript
interface LeaveService {
  // Submit new leave request
  submitLeaveRequest(request: LeaveRequestInput): Promise<LeaveRequest>
  
  // Get leave balance for user
  getLeaveBalance(userId: string): Promise<LeaveBalance>
  
  // Get leave history for user
  getLeaveHistory(userId: string, filters?: HistoryFilters): Promise<LeaveRequest[]>
  
  // Cancel leave request
  cancelLeaveRequest(requestId: string, userId: string): Promise<void>
  
  // Get pending requests for manager
  getPendingRequests(managerId: string): Promise<LeaveRequest[]>
  
  // Approve leave request (manager action)
  approveLeaveRequest(requestId: string, managerId: string): Promise<void>
  
  // Reject leave request (manager action)
  rejectLeaveRequest(requestId: string, managerId: string, reason: string): Promise<void>
}

interface LeaveRequestInput {
  userId: string
  leaveType: LeaveType
  startDate: Date
  endDate: Date
  reason: string
}

type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'BEREAVEMENT'

interface LeaveRequest {
  id: string
  userId: string
  leaveType: LeaveType
  startDate: Date
  endDate: Date
  reason: string
  status: LeaveStatus
  workingDays: number
  riskScore: number
  createdAt: Date
  updatedAt: Date
  approvedBy?: string
  rejectionReason?: string
}

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

interface LeaveBalance {
  userId: string
  annual: number
  sick: number
  maternity: number
  paternity: number
  bereavement: number
}

interface HistoryFilters {
  startDate?: Date
  endDate?: Date
  status?: LeaveStatus
  leaveType?: LeaveType
}
```

**Implementation Notes:**
- Calculate working days excluding weekends and public holidays
- Validate date ranges (start date must be before end date)
- Check leave balance before submitting to rule engine
- Use database transactions for balance updates
- Cache leave balance in Redis with 5-minute TTL

### 3. Workload Analyzer

**Responsibility:** Calculate workload scores and team availability metrics.

**Interface:**
```typescript
interface WorkloadAnalyzer {
  // Calculate workload score for a user
  calculateWorkloadScore(userId: string): Promise<WorkloadScore>
  
  // Calculate team availability for date range
  calculateTeamAvailability(teamId: string, startDate: Date, endDate: Date): Promise<number>
  
  // Get workload heatmap for team
  getTeamWorkloadHeatmap(teamId: string): Promise<WorkloadHeatmap>
  
  // Suggest task reassignments
  suggestTaskReassignment(userId: string, startDate: Date, endDate: Date): Promise<TaskSuggestion[]>
}

interface WorkloadScore {
  userId: string
  score: number
  classification: 'SAFE' | 'MODERATE' | 'HIGH_RISK'
  activeTasks: number
  remainingWorkingDays: number
}

interface WorkloadHeatmap {
  teamId: string
  members: Array<{
    userId: string
    userName: string
    workloadScore: number
    classification: string
  }>
}

interface TaskSuggestion {
  taskId: string
  taskName: string
  priority: TaskPriority
  deadline: Date
  suggestedAssignee: {
    userId: string
    userName: string
    currentWorkload: number
  }
}

type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
```

**Implementation Notes:**
- Workload Score Formula: `(activeTasks × priorityWeight) / remainingWorkingDays`
- Priority Weights: LOW=1, MEDIUM=2, HIGH=3, CRITICAL=4
- Classification: <0.5 = SAFE, 0.5-0.8 = MODERATE, >0.8 = HIGH_RISK
- Team Availability: `(availableMembers / totalMembers) × 100`
- Cache workload scores for 10 minutes
- Only count tasks with deadlines within next 30 days

### 4. Rule Engine

**Responsibility:** Evaluate leave requests against configurable rules and determine approval/escalation.

**Interface:**
```typescript
interface RuleEngine {
  // Evaluate leave request and return decision
  evaluateLeaveRequest(request: LeaveRequest): Promise<RuleDecision>
  
  // Get all active rules
  getRules(): Promise<Rule[]>
  
  // Create new rule (admin only)
  createRule(rule: RuleInput): Promise<Rule>
  
  // Update existing rule (admin only)
  updateRule(ruleId: string, rule: RuleInput): Promise<Rule>
  
  // Delete rule (admin only)
  deleteRule(ruleId: string): Promise<void>
}

interface RuleDecision {
  action: 'APPROVE' | 'REJECT' | 'ESCALATE'
  reason: string
  appliedRules: string[]
  riskScore: number
  metadata: {
    workloadScore?: number
    teamAvailability?: number
    deadlineConflicts?: string[]
  }
}

interface Rule {
  id: string
  name: string
  priority: number
  condition: RuleCondition
  action: 'APPROVE' | 'REJECT' | 'ESCALATE'
  enabled: boolean
}

interface RuleCondition {
  type: 'BALANCE' | 'DEADLINE' | 'AVAILABILITY' | 'WORKLOAD' | 'COMPOSITE'
  operator: 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ'
  value: number | string
  subConditions?: RuleCondition[]
  logicalOperator?: 'AND' | 'OR'
}

interface RuleInput {
  name: string
  priority: number
  condition: RuleCondition
  action: 'APPROVE' | 'REJECT' | 'ESCALATE'
  enabled: boolean
}
```

**Implementation Notes:**
- Rules are evaluated in priority order (lower number = higher priority)
- First matching rule determines the action
- Default rules:
  1. Priority 1: Insufficient balance → REJECT
  2. Priority 2: Deadline conflict (within 7 days) → ESCALATE
  3. Priority 3: Team availability < 60% → ESCALATE
  4. Priority 4: Workload score > 0.8 → ESCALATE
  5. Priority 5: Default → APPROVE
- Store rules as JSON in database for flexibility
- Log all rule evaluations in audit log
- Calculate risk score: `(workloadScore × 0.4) + ((100 - teamAvailability) × 0.4) + (deadlineConflictCount × 0.2)`

### 5. Notification Service

**Responsibility:** Send email and system notifications with retry logic.

**Interface:**
```typescript
interface NotificationService {
  // Send leave request status notification
  sendLeaveStatusNotification(request: LeaveRequest, status: LeaveStatus): Promise<void>
  
  // Send escalation notification to manager
  sendEscalationNotification(request: LeaveRequest, managerId: string): Promise<void>
  
  // Send cancellation notification
  sendCancellationNotification(request: LeaveRequest, managerId: string): Promise<void>
  
  // Create calendar event for approved leave
  createCalendarEvent(request: LeaveRequest): Promise<void>
  
  // Retry failed notifications
  retryFailedNotifications(): Promise<void>
}

interface EmailTemplate {
  to: string
  subject: string
  body: string
  attachments?: Array<{
    filename: string
    content: Buffer
  }>
}
```

**Implementation Notes:**
- Use SMTP for email delivery (configurable via environment variables)
- Implement exponential backoff retry: 3 attempts with delays of 1s, 5s, 15s
- Store failed notifications in database for manual review
- Email templates:
  - Leave approved: Include dates, type, and calendar attachment
  - Leave rejected: Include reason and contact information
  - Escalation: Include risk score, workload data, and approval link
  - Cancellation: Include original dates and employee information
- Use queue system (Redis) for async notification processing

### 6. WebSocket Service

**Responsibility:** Provide real-time updates to connected clients.

**Interface:**
```typescript
interface WebSocketService {
  // Broadcast leave request update to relevant users
  broadcastLeaveUpdate(request: LeaveRequest): void
  
  // Broadcast calendar update to team
  broadcastCalendarUpdate(teamId: string, event: CalendarEvent): void
  
  // Broadcast dashboard update to managers
  broadcastDashboardUpdate(teamId: string, data: DashboardData): void
  
  // Handle client connection
  handleConnection(socket: Socket): void
  
  // Handle client disconnection
  handleDisconnection(socket: Socket): void
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: 'LEAVE' | 'DEADLINE' | 'HOLIDAY'
  userId?: string
  status?: LeaveStatus
}

interface DashboardData {
  pendingCount: number
  teamAvailability: number
  riskAlerts: RiskAlert[]
}

interface RiskAlert {
  type: 'LOW_AVAILABILITY' | 'HIGH_WORKLOAD' | 'DEADLINE_CONFLICT'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  message: string
  affectedUsers: string[]
}
```

**Implementation Notes:**
- Use Socket.io for WebSocket implementation
- Authenticate WebSocket connections using JWT token
- Create rooms based on team ID for targeted broadcasts
- Implement automatic reconnection with exponential backoff
- Heartbeat interval: 30 seconds
- Maximum reconnection attempts: 5

### 7. API Endpoints

**REST API Structure:**

```
POST   /api/auth/login                    # Authenticate user
POST   /api/auth/refresh                  # Refresh JWT token
POST   /api/auth/logout                   # Logout user

GET    /api/leave/balance                 # Get leave balance
POST   /api/leave/request                 # Submit leave request
GET    /api/leave/history                 # Get leave history
GET    /api/leave/pending                 # Get pending requests (manager)
PUT    /api/leave/:id/approve             # Approve request (manager)
PUT    /api/leave/:id/reject              # Reject request (manager)
DELETE /api/leave/:id                     # Cancel request

GET    /api/workload/score                # Get user workload score
GET    /api/workload/team                 # Get team workload heatmap
GET    /api/workload/availability         # Get team availability

GET    /api/rules                         # Get all rules
POST   /api/rules                         # Create rule (admin)
PUT    /api/rules/:id                     # Update rule (admin)
DELETE /api/rules/:id                     # Delete rule (admin)

GET    /api/calendar/events               # Get calendar events
GET    /api/calendar/holidays             # Get public holidays

GET    /api/dashboard/manager             # Get manager dashboard data
GET    /api/dashboard/analytics           # Get leave analytics

GET    /api/tasks                         # Get user tasks
PUT    /api/tasks/:id/reassign            # Reassign task (manager)

GET    /api/audit/logs                    # Get audit logs (admin)
```

**Middleware Stack:**
1. Rate limiting (100 req/min per user)
2. CORS configuration
3. Request logging
4. JWT authentication
5. Role-based authorization
6. Input validation
7. Error handling

## Data Models

### Database Schema (Prisma)

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String
  name          String
  role          UserRole
  teamId        String
  team          Team           @relation(fields: [teamId], references: [id])
  leaveRequests LeaveRequest[]
  tasks         Task[]
  leaveBalance  LeaveBalance?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  @@index([email])
  @@index([teamId])
}

enum UserRole {
  EMPLOYEE
  MANAGER
  ADMIN
}

model Team {
  id        String   @id @default(uuid())
  name      String
  managerId String
  users     User[]
  projects  Project[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model LeaveRequest {
  id              String      @id @default(uuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  leaveType       LeaveType
  startDate       DateTime
  endDate         DateTime
  reason          String
  status          LeaveStatus @default(PENDING)
  workingDays     Int
  riskScore       Float       @default(0)
  approvedBy      String?
  rejectionReason String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([userId])
  @@index([status])
  @@index([startDate, endDate])
}

enum LeaveType {
  ANNUAL
  SICK
  MATERNITY
  PATERNITY
  BEREAVEMENT
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

model LeaveBalance {
  id         String   @id @default(uuid())
  userId     String   @unique
  user       User     @relation(fields: [userId], references: [id])
  annual     Int      @default(20)
  sick       Int      @default(10)
  maternity  Int      @default(90)
  paternity  Int      @default(10)
  bereavement Int     @default(5)
  updatedAt  DateTime @updatedAt
  
  @@index([userId])
}

model Task {
  id          String       @id @default(uuid())
  title       String
  description String?
  assignedTo  String
  user        User         @relation(fields: [assignedTo], references: [id])
  projectId   String
  project     Project      @relation(fields: [projectId], references: [id])
  priority    TaskPriority
  deadline    DateTime
  status      TaskStatus   @default(TODO)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@index([assignedTo])
  @@index([deadline])
  @@index([status])
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  COMPLETED
}

model Project {
  id        String   @id @default(uuid())
  name      String
  teamId    String
  team      Team     @relation(fields: [teamId], references: [id])
  deadline  DateTime
  tasks     Task[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([teamId])
  @@index([deadline])
}

model Rule {
  id        String   @id @default(uuid())
  name      String
  priority  Int
  condition Json
  action    String
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([priority])
  @@index([enabled])
}

model AuditLog {
  id        String   @id @default(uuid())
  action    String
  userId    String?
  entityType String
  entityId  String?
  metadata  Json?
  timestamp DateTime @default(now())
  
  @@index([userId])
  @@index([timestamp])
  @@index([entityType, entityId])
}

model Holiday {
  id    String   @id @default(uuid())
  name  String
  date  DateTime
  
  @@index([date])
}
```

### Redis Cache Structure

```typescript
// Leave balance cache
// Key: `balance:${userId}`
// TTL: 5 minutes
interface CachedBalance {
  userId: string
  annual: number
  sick: number
  maternity: number
  paternity: number
  bereavement: number
  cachedAt: number
}

// Workload score cache
// Key: `workload:${userId}`
// TTL: 10 minutes
interface CachedWorkload {
  userId: string
  score: number
  classification: string
  activeTasks: number
  cachedAt: number
}

// Team availability cache
// Key: `availability:${teamId}:${startDate}:${endDate}`
// TTL: 5 minutes
interface CachedAvailability {
  teamId: string
  startDate: string
  endDate: string
  percentage: number
  cachedAt: number
}

// WebSocket session
// Key: `session:${socketId}`
// TTL: Session duration
interface SocketSession {
  userId: string
  teamId: string
  role: string
  connectedAt: number
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **Notification properties (11.1-11.4)** can be consolidated into a single property about notification triggers
2. **Workload classification properties (4.2-4.4)** can be combined into one comprehensive classification property
3. **Calendar display properties (8.1-8.3)** can be merged into one property about calendar data completeness
4. **Audit logging properties (12.3-12.4)** can be combined into one property about audit trail completeness
5. **Real-time update properties (14.1-14.3)** can be consolidated into one property about WebSocket broadcasts
6. **Authorization properties (8.5-8.6, 12.2, 12.5)** can be combined into role-based data access properties

### Authentication and Authorization Properties

**Property 1: Valid authentication produces JWT tokens**
*For any* valid user credentials (email and password), authenticating should return a JWT token that can be verified and contains the correct user information (userId, email, role, teamId).
**Validates: Requirements 1.1**

**Property 2: Invalid authentication is rejected**
*For any* invalid credentials (wrong password, non-existent email, or malformed input), authentication should fail and return an error without issuing a token.
**Validates: Requirements 1.2**

**Property 3: Role-based access control enforcement**
*For any* protected endpoint and any user, access should be granted if and only if the user's role has permission for that endpoint.
**Validates: Requirements 1.3**

**Property 4: Password hashing security**
*For any* password, the stored hash should be a valid bcrypt hash with cost factor ≥ 10, and verifying the original password against the hash should succeed.
**Validates: Requirements 15.1**

**Property 5: JWT token expiration**
*For any* generated JWT token, the expiration time should be exactly 8 hours from issuance, and expired tokens should be rejected during verification.
**Validates: Requirements 15.6**

### Leave Request Submission Properties

**Property 6: Required field validation**
*For any* leave request missing required fields (userId, leaveType, startDate, endDate, or reason), submission should be rejected with a validation error.
**Validates: Requirements 2.1**

**Property 7: Date range validation**
*For any* leave request where startDate > endDate, submission should be rejected with a validation error.
**Validates: Requirements 2.2**

**Property 8: Insufficient balance rejection**
*For any* leave request where the requested working days exceed the employee's available balance for that leave type, the request should be rejected immediately without rule engine evaluation.
**Validates: Requirements 2.4, 5.1**

**Property 9: Valid request storage**
*For any* valid leave request (all fields present, valid dates, sufficient balance), submission should store the request with status "PENDING" and trigger rule engine evaluation.
**Validates: Requirements 2.5**

**Property 10: Working days calculation**
*For any* date range, the calculated working days should equal the number of weekdays (Monday-Friday) in the range, excluding public holidays.
**Validates: Requirements 2.7**

### Leave Balance Properties

**Property 11: Balance retrieval accuracy**
*For any* employee, requesting leave balance should return the current remaining days for all five leave types (annual, sick, maternity, paternity, bereavement).
**Validates: Requirements 3.1**

**Property 12: Balance deduction on approval**
*For any* approved leave request, the employee's balance for that leave type should decrease by exactly the number of working days in the request.
**Validates: Requirements 3.2**

**Property 13: Balance preservation on rejection/cancellation**
*For any* leave request that is rejected or cancelled before approval, the employee's leave balance should remain unchanged.
**Validates: Requirements 3.3**

**Property 14: Balance restoration on approved cancellation**
*For any* approved leave request that is subsequently cancelled, the employee's balance should increase by exactly the number of working days that were originally deducted.
**Validates: Requirements 7.2**

### Workload Analysis Properties

**Property 15: Workload score calculation**
*For any* employee with active tasks, the workload score should equal (sum of (task priority weight)) / (remaining working days until furthest deadline), where priority weights are LOW=1, MEDIUM=2, HIGH=3, CRITICAL=4.
**Validates: Requirements 4.1**

**Property 16: Workload classification correctness**
*For any* workload score, the classification should be "SAFE" if score < 0.5, "MODERATE" if 0.5 ≤ score ≤ 0.8, and "HIGH_RISK" if score > 0.8.
**Validates: Requirements 4.2, 4.3, 4.4**

**Property 17: Team availability calculation**
*For any* team and date range, team availability percentage should equal (number of available members / total team members) × 100, where a member is unavailable if they have an approved leave request overlapping the date range.
**Validates: Requirements 4.5**

**Property 18: Active task filtering**
*For any* workload score calculation, only tasks with status "TODO" or "IN_PROGRESS" should be included; completed tasks should not affect the score.
**Validates: Requirements 13.2**

### Rule Engine Properties

**Property 19: Deadline conflict escalation**
*For any* leave request where any project deadline assigned to the requesting employee falls within 7 days of the leave period, the rule engine should escalate the request to a manager.
**Validates: Requirements 5.2, 13.4**

**Property 20: Low availability escalation**
*For any* leave request where team availability during the requested period would be less than 60%, the rule engine should escalate the request to a manager.
**Validates: Requirements 5.3**

**Property 21: High workload escalation**
*For any* leave request where the requesting employee's workload score is greater than 0.8, the rule engine should escalate the request to a manager.
**Validates: Requirements 5.4**

**Property 22: Auto-approval for safe requests**
*For any* leave request where (1) balance is sufficient, (2) no deadline conflicts exist, (3) team availability ≥ 60%, and (4) workload score ≤ 0.8, the rule engine should auto-approve the request.
**Validates: Requirements 5.5**

**Property 23: Rule evaluation audit logging**
*For any* leave request evaluated by the rule engine, an audit log entry should be created containing the request ID, evaluation result (approve/reject/escalate), applied rules, and timestamp.
**Validates: Requirements 5.8**

**Property 24: Admin rule modification authorization**
*For any* rule modification operation (create, update, delete), the operation should succeed if and only if the requesting user has role "ADMIN".
**Validates: Requirements 5.7**

### Manager Workflow Properties

**Property 25: Manager approval workflow**
*For any* escalated leave request approved by a manager, the request status should update to "APPROVED" and the employee's balance should be deducted by the working days amount.
**Validates: Requirements 6.2**

**Property 26: Manager rejection workflow**
*For any* escalated leave request rejected by a manager with a reason, the request status should update to "REJECTED", the rejection reason should be stored, and the balance should remain unchanged.
**Validates: Requirements 6.3**

**Property 27: Escalated request data completeness**
*For any* escalated leave request viewed by a manager, the returned data should include risk score, workload score, team availability percentage, and list of affected project deadlines.
**Validates: Requirements 6.5**

### Cancellation Properties

**Property 28: Pending request cancellation**
*For any* leave request with status "PENDING", an employee should be able to cancel it, resulting in status "CANCELLED" with no balance changes.
**Validates: Requirements 7.1**

**Property 29: Started request cancellation prevention**
*For any* leave request where the current date is on or after the start date, cancellation attempts should be rejected with an error.
**Validates: Requirements 7.3**

### Calendar and Availability Properties

**Property 30: Calendar data completeness**
*For any* team calendar request, the returned events should include all approved leave requests, all project deadlines, and all public holidays for the requested date range.
**Validates: Requirements 8.1, 8.2, 8.3**

**Property 31: Role-based calendar filtering**
*For any* calendar request by an employee, only that employee's leave requests should be included; for any manager, all team members' leave requests should be included.
**Validates: Requirements 8.5, 8.6**

### Dashboard and Analytics Properties

**Property 32: Pending approval count accuracy**
*For any* manager dashboard request, the pending approval count should equal the number of leave requests with status "PENDING" or "ESCALATED" for that manager's team.
**Validates: Requirements 9.1**

**Property 33: Workload heatmap completeness**
*For any* team workload heatmap request, the returned data should include workload score and classification for every member of the team.
**Validates: Requirements 9.2**

**Property 34: Risk alert generation**
*For any* manager dashboard request where team availability for the current or upcoming week is below 50%, a risk alert should be included in the response.
**Validates: Requirements 9.6**

**Property 35: Dashboard filter application**
*For any* dashboard request with filters (date range, project, team), the returned data should include only records matching all specified filter criteria.
**Validates: Requirements 9.5**

### Impact Visualization Properties

**Property 36: Risk score calculation**
*For any* leave request, the risk score should be calculated as: (workload score × 0.4) + ((100 - team availability) × 0.4) + (deadline conflict count × 0.2), normalized to 0-100 range.
**Validates: Requirements 10.1**

**Property 37: Affected deadlines identification**
*For any* leave request, all project deadlines assigned to the requesting employee that fall within the leave period should be identified and listed.
**Validates: Requirements 10.2**

**Property 38: Projected availability calculation**
*For any* leave request, the projected team availability should be calculated as if the request were approved, showing the impact on team capacity.
**Validates: Requirements 10.3**

**Property 39: Task reassignment suggestions**
*For any* leave request with affected critical tasks (priority HIGH or CRITICAL), the system should suggest alternative employees with workload score < 0.7 who can cover those tasks.
**Validates: Requirements 10.4**

### Notification Properties

**Property 40: Notification trigger completeness**
*For any* leave request status change (approved, rejected, escalated, cancelled), appropriate email notifications should be queued for the relevant parties (employee for approval/rejection, manager for escalation/cancellation).
**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 6.1, 7.4**

**Property 41: Notification retry with exponential backoff**
*For any* failed email notification, the system should retry up to 3 times with delays of 1 second, 5 seconds, and 15 seconds between attempts.
**Validates: Requirements 11.5**

**Property 42: Calendar event creation**
*For any* approved leave request, a calendar event invitation should be created with the leave dates, type, and employee information.
**Validates: Requirements 11.6**

### Audit Trail Properties

**Property 43: Comprehensive audit logging**
*For any* leave request status change or rule engine evaluation, an audit log entry should be created with timestamp, user ID, action type, entity ID, and relevant metadata.
**Validates: Requirements 12.3, 12.4**

**Property 44: Leave history retrieval**
*For any* employee requesting their leave history, all leave requests where userId matches should be returned; for any manager, all leave requests where the employee's teamId matches the manager's teamId should be returned.
**Validates: Requirements 12.1, 12.2**

**Property 45: Admin audit log access**
*For any* audit log query by an admin user, all audit log entries should be accessible; for non-admin users, only entries related to their own actions should be accessible.
**Validates: Requirements 12.5**

### Real-Time Update Properties

**Property 46: WebSocket broadcast on state changes**
*For any* leave request status change, team availability change, or calendar update, a WebSocket message should be broadcast to all connected clients in the affected team's room.
**Validates: Requirements 14.1, 14.2, 14.3, 8.4**

**Property 47: WebSocket reconnection handling**
*For any* WebSocket connection loss, the client should automatically attempt to reconnect with exponential backoff (delays: 1s, 2s, 4s, 8s, 16s) up to 5 attempts.
**Validates: Requirements 14.4**

### Security Properties

**Property 48: Rate limiting enforcement**
*For any* user making more than 100 API requests within a 60-second window, subsequent requests should be rejected with HTTP 429 (Too Many Requests) until the window resets.
**Validates: Requirements 15.3**

**Property 49: Authorization error responses**
*For any* API request where the authenticated user lacks permission to access the requested resource, the response should be HTTP 403 (Forbidden) with no sensitive data leaked.
**Validates: Requirements 15.4**

**Property 50: Input sanitization**
*For any* user input containing SQL injection patterns (e.g., `'; DROP TABLE`) or XSS patterns (e.g., `<script>`), the input should be sanitized or rejected before processing.
**Validates: Requirements 15.5**

### Performance and Caching Properties

**Property 51: Leave balance caching**
*For any* leave balance query, if a cached value exists in Redis with TTL > 0, that value should be returned; otherwise, the database should be queried and the result cached with 5-minute TTL.
**Validates: Requirements 16.4**

**Property 52: Slow query logging**
*For any* database query taking longer than 2 seconds to execute, a performance warning should be logged with the query details and execution time.
**Validates: Requirements 16.6**

### Error Handling Properties

**Property 53: Unhandled exception handling**
*For any* unhandled exception in an API endpoint, the error should be logged with stack trace, and the client should receive a generic error message (not exposing internal details).
**Validates: Requirements 17.1**

**Property 54: API request logging**
*For any* API request, a log entry should be created containing timestamp, user ID, HTTP method, endpoint path, and response status code.
**Validates: Requirements 17.2**

**Property 55: Rule engine failure escalation**
*For any* rule engine evaluation that throws an exception, the error should be logged and the leave request should be automatically escalated to a manager for manual review.
**Validates: Requirements 17.3**

**Property 56: Notification failure handling**
*For any* notification that fails after all retry attempts, the failure should be logged and a manual notification task should be created in the database for admin review.
**Validates: Requirements 17.4**

**Property 57: Structured JSON logging**
*For any* log entry, the output should be valid JSON containing at minimum: timestamp, level, message, and context fields.
**Validates: Requirements 17.5**

### Data Integrity Properties

**Property 58: Transaction atomicity**
*For any* leave request approval operation, if any step fails (status update, balance deduction, notification queuing), all changes should be rolled back and the request should remain in its original state.
**Validates: Requirements 19.3**

**Property 59: Referential integrity enforcement**
*For any* attempt to create a leave request with a non-existent userId, or a task with a non-existent projectId, the operation should be rejected with a foreign key constraint error.
**Validates: Requirements 19.5**

## Error Handling

### Error Categories

**1. Validation Errors (HTTP 400)**
- Missing required fields
- Invalid date ranges
- Invalid enum values
- Malformed input data

**2. Authentication Errors (HTTP 401)**
- Invalid credentials
- Expired JWT token
- Missing authentication token

**3. Authorization Errors (HTTP 403)**
- Insufficient role permissions
- Accessing other users' data without proper role

**4. Not Found Errors (HTTP 404)**
- Non-existent leave request ID
- Non-existent user ID
- Non-existent rule ID

**5. Business Logic Errors (HTTP 422)**
- Insufficient leave balance
- Cannot cancel started leave
- Cannot approve already approved request

**6. Rate Limiting Errors (HTTP 429)**
- Too many requests from user
- Retry-After header included

**7. Server Errors (HTTP 500)**
- Database connection failures
- Unhandled exceptions
- External service failures

### Error Response Format

All errors follow a consistent JSON structure:

```typescript
interface ErrorResponse {
  error: {
    code: string           // Machine-readable error code
    message: string        // Human-readable error message
    details?: any          // Additional error context
    timestamp: string      // ISO 8601 timestamp
    requestId: string      // Unique request identifier for tracing
  }
}
```

### Error Handling Strategy

**1. Input Validation**
- Validate all inputs at API boundary using validation middleware
- Return detailed validation errors for client-side correction
- Sanitize inputs to prevent injection attacks

**2. Database Errors**
- Catch and log all database errors with full context
- Return generic error messages to clients (don't expose schema details)
- Implement retry logic for transient failures (connection timeouts)

**3. External Service Failures**
- Implement circuit breaker pattern for email service
- Queue notifications for retry on failure
- Provide fallback behavior (e.g., escalate on rule engine failure)

**4. Unhandled Exceptions**
- Global exception handler catches all unhandled errors
- Log full stack trace and context
- Return generic 500 error to client
- Alert monitoring system for critical errors

**5. Graceful Degradation**
- If Redis cache is unavailable, fall back to database queries
- If WebSocket server is down, clients fall back to polling
- If workload calculation fails, escalate request to manager

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests**: Validate specific examples, edge cases, and error conditions
- Specific date range examples (e.g., weekend-only requests)
- Boundary conditions (e.g., exactly 60% availability)
- Error scenarios (e.g., database connection failure)
- Integration points between components

**Property Tests**: Verify universal properties across all inputs
- Generate random leave requests and verify business rules
- Generate random workload scenarios and verify calculations
- Generate random team configurations and verify availability
- Minimum 100 iterations per property test

### Property-Based Testing Configuration

**Framework**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Test Configuration**:
```typescript
// Example property test configuration
fc.assert(
  fc.property(
    // Generators for random inputs
    fc.record({
      userId: fc.uuid(),
      leaveType: fc.constantFrom('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT'),
      startDate: fc.date(),
      endDate: fc.date(),
      reason: fc.string()
    }),
    // Property to verify
    async (request) => {
      // Test implementation
    }
  ),
  { numRuns: 100 } // Minimum 100 iterations
)
```

**Test Tagging**: Each property test must reference its design document property:
```typescript
// Feature: intelligent-leave-management-system, Property 10: Working days calculation
test('working days calculation excludes weekends and holidays', async () => {
  // Property test implementation
})
```

### Test Coverage Requirements

**Backend Coverage**:
- Unit tests: 80% code coverage minimum
- Property tests: All 59 correctness properties implemented
- Integration tests: All API endpoints tested
- E2E tests: Critical user flows (submit → approve → notify)

**Frontend Coverage**:
- Component tests: All UI components tested
- Integration tests: Form submission and validation
- E2E tests: Complete user workflows with Playwright

### Testing Tools

**Backend**:
- Jest (unit test runner)
- fast-check (property-based testing)
- Supertest (API testing)
- Prisma test database (isolated test data)

**Frontend**:
- Jest + React Testing Library (component tests)
- Playwright (E2E tests)
- MSW (API mocking)

### Test Data Management

**Generators for Property Tests**:
```typescript
// User generator
const userGen = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  role: fc.constantFrom('EMPLOYEE', 'MANAGER', 'ADMIN'),
  teamId: fc.uuid()
})

// Leave request generator
const leaveRequestGen = fc.record({
  userId: fc.uuid(),
  leaveType: fc.constantFrom('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT'),
  startDate: fc.date({ min: new Date(), max: new Date('2025-12-31') }),
  endDate: fc.date({ min: new Date(), max: new Date('2025-12-31') }),
  reason: fc.string({ minLength: 10, maxLength: 500 })
}).filter(req => req.startDate <= req.endDate)

// Task generator
const taskGen = fc.record({
  id: fc.uuid(),
  assignedTo: fc.uuid(),
  priority: fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
  deadline: fc.date({ min: new Date(), max: new Date('2025-12-31') }),
  status: fc.constantFrom('TODO', 'IN_PROGRESS', 'COMPLETED')
})
```

### Continuous Integration

**CI Pipeline**:
1. Lint code (ESLint, Prettier)
2. Type check (TypeScript)
3. Run unit tests
4. Run property tests (100 iterations each)
5. Run integration tests
6. Generate coverage report
7. Run E2E tests (on staging environment)

**Quality Gates**:
- All tests must pass
- Code coverage ≥ 80%
- No TypeScript errors
- No high-severity linting errors

## Deployment Architecture

### Container Structure

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${API_URL}
      - NEXT_PUBLIC_WS_URL=${WS_URL}
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Environment Variables

**Required Variables**:
```bash
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/leave_management
DB_NAME=leave_management
DB_USER=postgres
DB_PASSWORD=secure_password

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRATION=8h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# API
API_URL=http://localhost:4000
WS_URL=ws://localhost:4000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### Scaling Considerations

**Horizontal Scaling**:
- API servers are stateless (can run multiple instances)
- Use load balancer (nginx) to distribute requests
- WebSocket connections use Redis pub/sub for cross-server communication
- Database connection pooling (max 20 connections per instance)

**Caching Strategy**:
- Redis for session data and frequently accessed data
- CDN for static frontend assets
- Database query result caching with invalidation on updates

**Monitoring**:
- Application metrics (Prometheus)
- Log aggregation (ELK stack or similar)
- Error tracking (Sentry or similar)
- Performance monitoring (New Relic or similar)
