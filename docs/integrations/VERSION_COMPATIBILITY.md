# Version compatibility

| Component | Selected / inspected | Compatibility conclusion |
|---|---|---|
| Frappe default | 7660724… v17 development | Do not co-install with current BuildSuite |
| ERPNext default | 35a7124… requires Frappe >=17,<18 | Do not co-install with current BuildSuite |
| Frappe stable inspection | b1b7d48cf4c423657891d23c397f08319c047774; version-16 16.55.1 | Source reference; runtime measured as 16.55.0 |
| ERPNext stable inspection | 9cd11b19575bfc34f092a24f6c8b368c4dd69481 | Source reference; not the default audit checkout |
| ERPNext runtime | frappe/erpnext:v16.53.0; manifest sha256:6a70fca65ce0e6aa98c3f1a047618ae5275c44a9cb28e6f78b26dfe0e3e51314 | Official image selected by inspected frappe_docker; image build succeeded; site installation/acceptance in progress |
| BuildSuite | b93246cd4e9bc365ff2eafd8f6b6a72999134502 | Declares v16 + Python >=3.14; installed successfully; core acceptance passed |
| Cepho | 758a29c… README v15 | Excluded from v16 installation; missing license and empty billing controller |
| OpenConstructionERP | 2d27b86… standalone 19.0.0 | Separate runtime; no direct Frappe install |
| OpenProject | 3fb8814… standalone Rails/Angular | Separate runtime; no direct Frappe install |
| MariaDB / Redis | mariadb:11.8 / redis:7-alpine | Development-only tags; production must pin digests and validate restore |

The version ranges are evidence of declared compatibility, not proof. Record `bench version --format json` and image IDs after installation; do not substitute development-branch commits for actual runtime versions. App migration, hooks, permission overrides and financial posting remain runtime gates.
