# Cadence Database Schema

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users      │       │  categories  │       │    teams      │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ name         │       │ name         │       │ createdAt    │
│ email (UQ)   │       │ slug (UQ)    │       └──────┬───────┘
│ role         │       └──────┬───────┘              │
│ avatarUrl    │              │                      │
│ bio          │              │               ┌──────┴───────┐
│ createdAt    │              │               │ team_members  │
└──┬───────────┘              │               ├──────────────┤
   │                          │               │ id (PK)      │
   │  ┌───────────────────────┘               │ teamId → teams│
   │  │                                       │ userId → users│
   │  │  ┌────────────────┐                   │ role         │
   │  │  │    courses      │                  │ createdAt    │
   │  │  ├────────────────┤                   └──────────────┘
   │  └──│ categoryId (FK)│
   └─────│ instructorId(FK)│
          │ id (PK)        │
          │ title           │
          │ slug (UQ)       │
          │ description     │
          │ salesCopy       │
          │ status          │
          │ coverImageUrl   │
          │ price           │
          │ pppEnabled      │
          │ createdAt       │
          │ updatedAt       │
          └──┬─────────────┘
             │
     ┌───────┼────────────────────┐
     │       │                    │
     ▼       ▼                    ▼
┌─────────┐ ┌──────────────┐  ┌──────────────┐
│enrollments│ │  purchases   │  │   modules    │
├─────────┤ ├──────────────┤  ├──────────────┤
│id (PK)  │ │ id (PK)      │  │ id (PK)      │
│userId→  │ │ userId →     │  │ courseId →   │
│courseId→ │ │ courseId →   │  │ title        │
│enrolledAt│ │ pricePaid    │  │ position     │
│completedAt││ country      │  │ createdAt    │
└─────────┘ │ createdAt    │  └──────┬───────┘
            └──────┬───────┘         │
                   │                 ▼
                   │          ┌──────────────┐
                   │          │   lessons     │
                   │          ├──────────────┤
                   │          │ id (PK)      │
                   │          │ moduleId →   │
                   │          │ title        │
                   │          │ content      │
                   │          │ videoUrl     │
                   │          │ githubRepoUrl│
                   │          │ position     │
                   │          │ durationMins │
                   │          │ createdAt    │
                   │          └──┬───┬───────┘
                   │             │   │
            ┌──────┘    ┌────────┘   └────────┐
            │           │                     │
            ▼           ▼                     ▼
     ┌──────────┐ ┌───────────────┐  ┌────────────────┐
     │ coupons   │ │lesson_progress│  │video_watch_evts│
     ├──────────┤ ├───────────────┤  ├────────────────┤
     │id (PK)   │ │ id (PK)       │  │ id (PK)        │
     │teamId →  │ │ userId →      │  │ userId →       │
     │courseId → │ │ lessonId →    │  │ lessonId →     │
     │code (UQ) │ │ status        │  │ eventType      │
     │purchaseId→│ │ completedAt   │  │ positionSeconds│
     │redeemedBy→│ └───────────────┘  │ createdAt      │
     │redeemedAt │                    └────────────────┘
     │createdAt  │
     └──────────┘         ┌──────────────┐
                          │   quizzes     │
            lessons ─────→├──────────────┤
                          │ id (PK)      │
                          │ lessonId →   │
                          │ title        │
                          │ passingScore │
                          └──────┬───────┘
                                 │
                          ┌──────┴───────┐
                          │quiz_questions │
                          ├──────────────┤
                          │ id (PK)      │
                          │ quizId →     │
                          │ questionText │
                          │ questionType │
                          │ position     │
                          └──┬───────┬───┘
                             │       │
                    ┌────────┘       └────────┐
                    ▼                         ▼
             ┌─────────────┐          ┌──────────────┐
             │ quiz_options │          │ quiz_attempts │
             ├─────────────┤          ├──────────────┤
             │ id (PK)     │          │ id (PK)      │
             │ questionId → │          │ userId →     │
             │ optionText  │          │ quizId →     │
             │ isCorrect   │          │ score        │
             └─────────────┘          │ passed       │
                    │                 │ attemptedAt  │
                    │                 └──────┬───────┘
                    │                        │
                    │                 ┌──────┴───────┐
                    │                 │ quiz_answers  │
                    │                 ├──────────────┤
                    └────────────────→│ id (PK)      │
                                      │ attemptId →  │
                                      │ questionId → │
                                      │selectedOptId→│
                                      └──────────────┘
```
