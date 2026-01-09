# Duda Site Exporter - Requirements

## One-Line Summary
Internal tool for crawling Duda websites and exporting content (text as Markdown, images) into a structured ZIP file.

## Problem Statement
- **Who:** Internal Team Members.
- **Problem:** Duda's native export is insufficient; no easy way to get clean text/images for migration or archiving.
- **Solution:** A custom crawler that navigates the sitemap, renders pages fully, and organizes assets into folders.

## User Roles
| Role | Description | Can Do | Cannot Do |
|------|-------------|--------|-----------|
| **Team Member** | Authenticated employee | Login, Scrape URLs, Download own exports | Manage other users |
| **Admin** | System administrator | Invite users, View all logs | - |

## Features (MVP)
| ID | Feature | User Story | Acceptance Criteria | Priority |
|----|---------|-----------|---------------------|----------|
| F1 | **Auth** | As a user, I can log in so only our team accesses the tool. | Supabase Auth implementation. | P0 |
| F2 | **Job Submission** | As a user, I can submit a Duda URL to start a scrape. | Input validation, Queue insertion. | P0 |
| F3 | **Sitemap Crawl** | As the system, I find all pages in `sitemap.xml`. | Extracts valid page URLs. | P0 |
| F4 | **Playwright Scrape** | As the system, I render pages and extract content. | Downloads text (MD) and images. | P0 |
| F5 | **ZIP Generation** | As a user, I download a ZIP with organized folders. | Correct folder structure, valid ZIP. | P0 |

## Features (Post-MVP)
| ID | Feature | Rationale for Deferral |
|----|---------|----------------------|
| F6 | **History UI** | Not critical for initial usage ("fire and forget"). |
| F7 | **Custom Selectors** | Advanced config not needed for standard Duda sites. |

## Out of Scope (Explicit)
- Scraping password-protected pages.
- Exporting functional widgets (e-commerce cart, contact forms logic).
- Public access (Guest users).

## Constraints
- **Budget:** Standard Railway tier.
- **Timeline:** ASAP.
- **Compliance:** Internal use only.
