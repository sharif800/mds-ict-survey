# National ICT Infrastructure Survey Portal — System Walkthrough

The standalone National ICT Infrastructure Survey Portal is now fully operational and integrated with the M365 License Portal. This system serves as the central data collection and analytics engine for institutional hardware, software, and information systems across the government.

## 🏛️ System Architecture
- **Port**: 3001 (Standalone Next.js 15+ App)
- **Database**: Shared with M365 Portal (Prisma / SQLite)
- **Theme**: MDS "Government Dark" (Teal primary brand)
- **Repository**: [sharif800/mds-ict-survey](https://github.com/sharif800/mds-ict-survey)

---

## 🚀 Key Features

### 1. Integrated Analytics Dashboard
A high-level view aggregating data from both portals.
- **Hardware vs. License Mapping**: Visualizes which physical devices are associated with which M365 licenses.
- **National ICT Inventory**: Summary of total assets, software, and systems across all registered institutions.
- **Institutional Breakdown**: A tabular view for MDS admins to compare infrastructure density across different government bodies.

### 2. Windows 11 Readiness Engine
Automated technical assessment of institutional hardware.
- **Compatibility Scoring**: Logic evaluates CPU generation, RAM (4GB+), Storage (64GB+), and TPM version.
- **Replacement Planning**: MDS admins can instantly identify devices needing replacement before the Windows 10 end-of-life.
- **Readiness Gauge**: A real-time percentage indicator of "National Upgrade Readiness."

### 3. Survey & Approval Workflow
A secure, multi-stage submission process for institutions.
1. **DRAFT**: IT officers populate inventory via manual entry or **Bulk CSV Import**.
2. **SUBMITTED**: Survey is locked and sent to the Institute Administrator.
3. **INSTITUTE_APPROVED**: Internal approval completed; survey sent to MDS.
4. **MDS_REVIEWED**: MDS administrators verify data and add review notes.
5. **COMPLETED**: Data is finalized and moved into the permanent national inventory.

### 4. Government-Grade Auditing & Reporting
- **Audit Logs**: A permanent, immutable trail of all approvals, imports, and status changes.
- **Standard Reports**: 5 pre-built printable reports:
  - Hardware Asset Summary
  - Windows 11 Readiness Report
  - Software License Audit (Non-M365)
  - Asset Depreciation & Lifecycle (Book Value)
  - Survey Submission Status
- **PDF Uploads**: Institutions can attach signed approval letters and procurement documents directly to their surveys.

---

## 🛠️ Developer Notes

### Deployment Status
- **M365 Portal (3000)**: Cleaned of AI Agent files (moved to `backlog/`) for stable deployment.
- **ICT Survey Portal (3001)**: Production-ready and pushed to GitHub.

### Security Reminders
- **Environment Variables**: Ensure `DATABASE_URL` and `NEXTAUTH_SECRET` are consistent across both portals to maintain shared session/DB state.
- **Git Security**: Remote URLs have been sanitized (tokens removed). Use the newly generated GitHub SSH keys or PAT for future pushes.
