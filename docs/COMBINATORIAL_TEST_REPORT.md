# Combinatorial Test Report

**Project:** CareVault  
**Test Type:** Combinatorial Testing (Pairwise Analysis)  
**Generated:** 2026-02-13  
**Framework:** Jest 30.2.0

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Test Suites | 2 |
| Total Tests | 104 |
| Passed | 104 |
| Failed | 0 |
| Pass Rate | 100% |
| Combinations Tested | 104 |

---

## Coverage Summary

| Metric | Percentage | Covered/Total |
|--------|------------|---------------|
| Statements | 30.52% | 76/249 |
| Branches | 29.6% | 45/152 |
| Functions | 36.73% | 18/49 |
| Lines | 33.5% | 65/194 |

---

## Test Suites

### 1. Permission Combinations Matrix

**File:** `__tests__/combinatorial/permissions-combinations.test.ts`

#### Combination Matrix: Role × Permission

| Permission | caregiver | patient | null | undefined |
|------------|-----------|---------|------|-----------|
| canViewPatientInfo | TRUE | TRUE | FALSE | FALSE |
| canEditPatientInfo | TRUE | FALSE | FALSE | FALSE |
| canManageMedications | TRUE | FALSE | FALSE | FALSE |
| canAddCareLogs | TRUE | FALSE | FALSE | FALSE |
| canEditCareLogs | TRUE | FALSE | FALSE | FALSE |
| canDeleteCareLogs | TRUE | FALSE | FALSE | FALSE |
| canManageAppointments | TRUE | FALSE | FALSE | FALSE |
| canUploadDocuments | TRUE | FALSE | FALSE | FALSE |
| canDeleteDocuments | TRUE | FALSE | FALSE | FALSE |
| canViewEmergencySummary | TRUE | TRUE | FALSE | FALSE |
| canExportEmergencySummary | TRUE | TRUE | FALSE | FALSE |
| canManageContacts | TRUE | FALSE | FALSE | FALSE |
| canManageFinancials | TRUE | FALSE | FALSE | FALSE |

**Total Combinations:** 4 roles × 13 permissions = 52 tests

#### Validation Tests

| Test Case | Expected | Status |
|-----------|----------|--------|
| Caregiver has exactly 13 true permissions | 13 | PASS |
| Patient has exactly 3 true permissions | 3 | PASS |
| Null role has exactly 0 true permissions | 0 | PASS |
| Undefined role has exactly 0 true permissions | 0 | PASS |

---

### 2. Service Combinations Matrix

**File:** `__tests__/combinatorial/service-combinations.test.ts`

#### Medical Records by Type Combinations

| care_recipient_id | type | Success Test | Error Test |
|-------------------|------|--------------|------------|
| cr-001 | medication | PASS | PASS |
| cr-001 | care_log | PASS | PASS |
| cr-001 | lab_result | PASS | PASS |
| cr-001 | diagnosis | PASS | PASS |
| cr-001 | note | PASS | PASS |
| cr-002 | medication | PASS | PASS |
| cr-002 | care_log | PASS | PASS |
| cr-002 | lab_result | PASS | PASS |
| cr-002 | diagnosis | PASS | PASS |
| cr-002 | note | PASS | PASS |

**Total Combinations:** 2 IDs × 5 types × 2 scenarios = 20 tests

#### CRUD Operation Combinations

**Read Operations (Returns Array):**

| Service | Method | Success | Empty | Error |
|---------|--------|---------|-------|-------|
| careRecipientService | getCareRecipientsByCaregiver | PASS | PASS | N/A |
| medicalRecordService | getMedicalRecords | PASS | PASS | N/A |
| medicalRecordService | getMedicalRecordsByType | PASS | PASS | N/A |
| medicalRecordService | getActiveMedications | PASS | PASS | N/A |
| appointmentService | getAppointments | PASS | PASS | N/A |
| appointmentService | getUpcomingAppointments | PASS | PASS | N/A |
| emergencyContactService | getEmergencyContacts | PASS | PASS | N/A |
| documentService | getDocuments | PASS | PASS | N/A |

**Create Operations (Returns ID):**

| Service | Method | Success | Error |
|---------|--------|---------|-------|
| careRecipientService | createCareRecipient | PASS | PASS |
| medicalRecordService | createMedicalRecord | PASS | PASS |
| appointmentService | createAppointment | PASS | PASS |
| emergencyContactService | createEmergencyContact | PASS | PASS |

**Delete Operations (Returns Void):**

| Service | Method | Success | Error |
|---------|--------|---------|-------|
| careRecipientService | deleteCareRecipient | PASS | PASS |
| medicalRecordService | deleteMedicalRecord | PASS | PASS |
| appointmentService | deleteAppointment | PASS | PASS |
| emergencyContactService | deleteEmergencyContact | PASS | PASS |

---

## Pairwise Test Results

### Permission System Pairwise Coverage

| Pair Type | Total Pairs | Tested | Coverage |
|-----------|-------------|--------|----------|
| Role × Permission | 52 | 52 | 100% |
| Permission × Permission | N/A | N/A | N/A |

### Service System Pairwise Coverage

| Pair Type | Total Pairs | Tested | Coverage |
|-----------|-------------|--------|----------|
| Service × Operation | 24 | 24 | 100% |
| ID × RecordType | 10 | 10 | 100% |
| Operation × Outcome | 32 | 32 | 100% |

---

## Boundary Value Analysis

### Permission Boundaries

| Test | Boundary | Value | Result |
|------|----------|-------|--------|
| Minimum permissions | Patient role | 3 | PASS |
| Maximum permissions | Caregiver role | 13 | PASS |
| Zero permissions | Null role | 0 | PASS |
| Invalid role | Undefined | 0 | PASS |

### Service Boundaries

| Test | Boundary | Value | Result |
|------|----------|-------|--------|
| Empty result set | No records | [] | PASS |
| Single item | One record | [item] | PASS |
| Multiple items | Many records | [items...] | PASS |
| Error case | Null | error | PASS |

---

## Defects Found

No defects were found during combinatorial testing. All combinations behave as expected.

---

## Test Distribution

| Category | Count | Percentage |
|----------|-------|------------|
| Permission Matrix | 56 | 53.8% |
| Service CRUD | 48 | 46.2% |
| **Total** | **104** | **100%** |

---

## Recommendations

1. Consider adding combinatorial tests for:
   - User roles × CRUD operations (authorization matrix)
   - Document categories × file types
   - Appointment status × urgency levels

2. Pairwise testing tools could reduce test count while maintaining coverage

---

*Report generated by Jest combinatorial test suite*
