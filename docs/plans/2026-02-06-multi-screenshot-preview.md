# Multi-Screenshot Upload with Preview

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add image preview step before API call, support multiple screenshots that get merged into one grade result.

**Architecture:** Frontend-driven merge. Upload component collects 1-4 images, shows preview thumbnails, user clicks Submit, frontend calls API for each image sequentially, then merges results client-side.

**Tech:** React state management, new mergeGrades utility function.

---

## UI Flow

```
[Upload/Paste Area]
       ↓
[Preview Area]
  - Thumbnails of uploaded images (1-4 max)
  - "Add another screenshot" button
  - "Remove" button per thumbnail
  - "Submit" button (disabled until ≥1 image)
       ↓
[Loading]
  - "Analyzing image 1 of 3..."
       ↓
[Results]
  - Merged grade data
```

## App States

```typescript
type AppState = 'upload' | 'preview' | 'loading' | 'results' | 'error';
```

- `upload` → Initial state, no images yet
- `preview` → Has 1+ images, showing thumbnails, waiting for Submit
- `loading` → Processing images sequentially
- `results` → Showing merged grade data
- `error` → Something went wrong

## Data Merging Rules

1. Match assignments by name (case-insensitive, trimmed)
2. If duplicate, keep the one with more data (score vs null)
3. Combine all unique categories
4. Recalculate overall grade from merged assignments
5. Class name + grading scale from first screenshot
6. If class names differ significantly → show warning (but still merge)

## Files to Modify

### Frontend

**App.tsx**
- Add `preview` state
- Hold `files: File[]` array instead of single file
- Add `handleAddImage`, `handleRemoveImage`, `handleSubmit`

**ScreenshotUpload.tsx**
- Split into two modes: "empty" (upload) and "has images" (preview)
- Show thumbnails with remove buttons
- "Add another" button (if < 4 images)
- "Submit" button

**api/client.ts**
- Add `analyzeMultipleScreenshots(files: File[])` that calls API per image

**New: utils/mergeGrades.ts**
- `mergeGradeData(results: GradeData[]): GradeData`

### Backend

No changes needed - single image endpoint stays the same.

## Component Structure

```
App
├── ScreenshotUpload (upload mode - no images)
├── ImagePreview (preview mode - has images)
│   ├── Thumbnail[]
│   ├── AddMoreButton
│   └── SubmitButton
├── LoadingSpinner (with progress)
├── GradeDisplay
└── FinalCalculator
```

---

## Verification

- [ ] Can upload single image, see preview, submit
- [ ] Can paste image, see preview, submit
- [ ] Can add multiple images (up to 4)
- [ ] Can remove images from preview
- [ ] Submit processes all images with progress indicator
- [ ] Merged results show all assignments without duplicates
- [ ] "Analyze Another" resets to upload state
