-- PostgreSQL 10+: rename enum labels in place (preserves row values).
-- Safe when the DB still has CENTRE_GENERAL / DEPARTMENT_CENTRE_GENERAL from prior migrations.
ALTER TYPE "Role" RENAME VALUE 'CENTRE_GENERAL' TO 'CENTRE_REGION';
ALTER TYPE "Role" RENAME VALUE 'DEPARTMENT_CENTRE_GENERAL' TO 'DEPARTMENT_CENTRE_REGION';
