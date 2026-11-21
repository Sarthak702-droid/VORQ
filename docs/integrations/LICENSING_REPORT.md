# Licensing evidence and unresolved review

| Source | Evidence | Current action |
|---|---|---|
| Frappe | LICENSE, MIT | Use supported framework in upstream image; retain notice |
| ERPNext | license.txt, GPL-3.0 | Use unmodified image; custom backend declares GPL-3.0-or-later |
| BuildSuite | license.txt, MIT; Infraholic Innovations copyright | Install pinned source with original license retained |
| OpenConstructionERP | LICENSE AGPL v3; backend metadata AGPL-3.0-or-later | No copying or integration pending distribution/compliance decision |
| OpenProject | LICENSE GPL v3 | No source copying; API integration only if required |
| Cepho | README claims MIT, root license absent in inspected tree | Do not copy; obtain authoritative licensing clarification |
| frappe_docker | LICENSE MIT | Adapt development Compose; notice shipped in deployment/FRAPPE_DOCKER_LICENSE |

This is a source-license inventory, not completed legal review. Commercial SaaS/distribution policy is unspecified. Before shipping, qualified review must determine obligations for combined backend distribution, modified network services, source offers, notices, bundled assets and dependencies. An API boundary is not a blanket waiver of obligations. No AGPL source was copied into the frontend. Existing VORQ frontend rights are not altered by the new backend metadata.
