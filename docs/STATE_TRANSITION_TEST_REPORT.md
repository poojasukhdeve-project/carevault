# State Transition Test Report

**Project:** CareVault  
**Test Type:** State Transition Testing  
**Generated:** 2026-02-13  
**Framework:** Jest 30.2.0

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Test Suites | 4 |
| Total Tests | 76 |
| Passed | 76 |
| Failed | 0 |
| Pass Rate | 100% |
| State Machines Tested | 4 |

---

## State Machines Overview

### 1. Authentication State Machine

**States:** `unauthenticated` → `loading` → `authenticated` / `error` → `logging_out`

```
                    ┌──────────────────┐
                    │  Unauthenticated │
                    └────────┬─────────┘
                             │ LOGIN_SUBMIT
                             ▼
                    ┌──────────────────┐
           ┌────────│     Loading      │────────┐
           │        └──────────────────┘        │
   LOGIN_SUCCESS                         LOGIN_FAILURE
           │                                    │
           ▼                                    ▼
    ┌──────────────────┐              ┌──────────────────┐
    │  Authenticated   │              │      Error       │
    └────────┬─────────┘              └────────┬─────────┘
             │ LOGOUT                          │ LOGIN_SUBMIT
             ▼                                 │
    ┌──────────────────┐                      │
    │   Logging Out    │──────────────────────┘
    └────────┬─────────┘
             │ LOGOUT_COMPLETE
             ▼
    ┌──────────────────┐
    │  Unauthenticated │
    └──────────────────┘
```

### 2. Patient Selection State Machine

**States:** `no_selection` → `loading` → `selected` / `error` → `switching`

```
                    ┌──────────────────┐
                    │   No Selection   │
                    └────────┬─────────┘
                             │ SELECT_PATIENT
                             ▼
                    ┌──────────────────┐
           ┌────────│     Loading      │────────┐
           │        └──────────────────┘        │
     DATA_LOADED                        DATA_LOAD_ERROR
           │                                    │
           ▼                                    ▼
    ┌──────────────────┐              ┌──────────────────┐
    │    Selected      │◄─────────────│      Error       │
    └────────┬─────────┘ SELECT_PATIENT└──────────────────┘
             │ SELECT_DIFFERENT
             ▼
    ┌──────────────────┐
    │    Switching     │────┐
    └──────────────────┘    │ DATA_LOADED
             ▲              │
             └──────────────┘
```

### 3. Form State Machine

**States:** `closed` → `open_empty` → `editing` → `submitting` → `success` / `error`

```
    ┌──────────────────┐
    │      Closed      │
    └────────┬─────────┘
             │ OPEN
             ▼
    ┌──────────────────┐
    │   Open Empty     │
    └────────┬─────────┘
             │ EDIT
             ▼
    ┌──────────────────┐
    │     Editing      │◄───────────────┐
    └────────┬─────────┘                │
             │ SUBMIT                    │ EDIT
             ▼                          │
    ┌──────────────────┐       ┌──────────────────┐
    │    Submitting    │───────│      Error       │
    └────────┬─────────┘       └──────────────────┘
             │ SUBMIT_SUCCESS
             ▼
    ┌──────────────────┐
    │     Success      │──────► Closed
    └──────────────────┘
```

### 4. Data Loading State Machine

**States:** `idle` → `loading` → `loaded` / `error` → `retrying` / `refreshing`

```
    ┌──────────────────┐
    │       Idle       │
    └────────┬─────────┘
             │ FETCH
             ▼
    ┌──────────────────┐
    │     Loading      │
    └────────┬─────────┘
       ┌─────┴─────┐
       │           │
  SUCCESS       FAILURE
       │           │
       ▼           ▼
┌──────────┐  ┌──────────┐
│  Loaded  │  │  Error   │
└────┬─────┘  └────┬─────┘
     │ REFRESH     │ RETRY
     ▼             ▼
┌──────────┐  ┌──────────┐
│Refreshing│  │ Retrying │
└──────────┘  └──────────┘
```

---

## Transition Coverage Matrix

### Authentication State Machine

| From State | Event | To State | Tested |
|------------|-------|----------|--------|
| unauthenticated | LOGIN_SUBMIT | loading | YES |
| unauthenticated | SESSION_RESTORED | authenticated | YES |
| loading | LOGIN_SUCCESS | authenticated | YES |
| loading | LOGIN_FAILURE | error | YES |
| authenticated | LOGOUT | logging_out | YES |
| authenticated | SESSION_EXPIRED | unauthenticated | YES |
| logging_out | LOGOUT_COMPLETE | unauthenticated | YES |
| error | LOGIN_SUBMIT | loading | YES |

### Patient Selection State Machine

| From State | Event | To State | Tested |
|------------|-------|----------|--------|
| no_selection | SELECT_PATIENT | loading | YES |
| loading | DATA_LOADED | selected | YES |
| loading | DATA_LOAD_ERROR | error | YES |
| selected | SELECT_DIFFERENT | switching | YES |
| selected | DESELECT | no_selection | YES |
| selected | REFRESH_DATA | selected (loading) | YES |
| switching | DATA_LOADED | selected | YES |
| switching | DATA_LOAD_ERROR | error | YES |
| error | SELECT_PATIENT | loading | YES |
| error | DESELECT | no_selection | YES |

### Form State Machine

| From State | Event | To State | Tested |
|------------|-------|----------|--------|
| closed | OPEN | open_empty | YES |
| closed | OPEN_WITH_DATA | editing | YES |
| open_empty | EDIT | editing | YES |
| open_empty | CANCEL | closed | YES |
| editing | EDIT | editing | YES |
| editing | SUBMIT | submitting | YES |
| editing | VALIDATION_ERROR | editing | YES |
| editing | CANCEL | closed | YES |
| editing | RESET | open_empty | YES |
| submitting | SUBMIT_SUCCESS | success | YES |
| submitting | SUBMIT_ERROR | error | YES |
| error | EDIT | editing | YES |
| error | SUBMIT | submitting | YES |
| error | CANCEL | closed | YES |

### Data Loading State Machine

| From State | Event | To State | Tested |
|------------|-------|----------|--------|
| idle | FETCH | loading | YES |
| loading | FETCH_SUCCESS | loaded | YES |
| loading | FETCH_ERROR | error | YES |
| loaded | REFRESH | refreshing | YES |
| loaded | INVALIDATE | idle | YES |
| loaded | RESET | idle | YES |
| error | RETRY | retrying | YES |
| error | RESET | idle | YES |
| retrying | FETCH_SUCCESS | loaded | YES |
| retrying | FETCH_ERROR | error | YES |
| refreshing | FETCH_SUCCESS | loaded | YES |
| refreshing | FETCH_ERROR | loaded (with error) | YES |

---

## Invalid Transition Tests

| State Machine | Invalid Transition | Guard Tested |
|---------------|-------------------|--------------|
| Auth | unauthenticated → authenticated | YES |
| Auth | unauthenticated → logout | YES |
| Auth | authenticated → login_submit | YES |
| Patient Selection | no_selection → data_loaded | YES |
| Patient Selection | no_selection → deselect | YES |
| Form | closed → submit | YES |
| Form | closed → edit | YES |
| Form | submitting → cancel | YES |
| Data Loading | loading → fetch | YES |
| Data Loading | idle → retry | YES |
| Data Loading | idle → refresh | YES |

---

## Complete Flow Sequences Tested

### Authentication Flows

1. **Successful Login Flow**
   - unauthenticated → loading → authenticated
   
2. **Failed Login with Retry**
   - unauthenticated → loading → error → loading → authenticated
   
3. **Logout Flow**
   - authenticated → logging_out → unauthenticated

4. **Session Restoration**
   - unauthenticated → authenticated (direct)

### Patient Selection Flows

1. **Initial Selection**
   - no_selection → loading → selected
   
2. **Patient Switch**
   - selected → switching → selected
   
3. **Error Recovery**
   - loading → error → loading → selected

### Form Flows

1. **Create New Record**
   - closed → open_empty → editing → submitting → success
   
2. **Edit Existing Record**
   - closed → editing → submitting → success
   
3. **Error and Retry**
   - editing → submitting → error → editing → submitting → success

### Data Loading Flows

1. **Initial Fetch**
   - idle → loading → loaded
   
2. **Refresh**
   - loaded → refreshing → loaded
   
3. **Multiple Retries**
   - idle → loading → error → retrying → error → retrying → loaded

---

## Test Results Summary

| State Machine | Tests | Passed | Coverage |
|---------------|-------|--------|----------|
| auth-state-transitions | 22 | 22 | 100% |
| patient-selection-transitions | 20 | 20 | 100% |
| form-state-transitions | 18 | 18 | 100% |
| data-loading-transitions | 16 | 16 | 100% |
| **Total** | **76** | **76** | **100%** |

---

*Report generated by Jest state transition test suite*
