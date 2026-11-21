# Identity and data mapping

Browser IDs are native Frappe document `name` values; no display-number-to-record guesses. Company links resolve ERPNext Company; Project.company must match every API company parameter. Parent project scope propagates to transaction child rows. BOQ Group/Item scope derives through the single parent BOQ; group and item must belong to the same revision. Measurement rows reference native work-order-line names, not mutable descriptions. RA bills derive quantities/rates from work-order lines and certified measurements, and retain the upstream Purchase Invoice link.

Dates use ISO calendar dates. Numeric browser form values remain decimal strings until backend validation; NaN/Infinity are rejected. ERPNext field/company currency precision controls financial posting; upstream float/rounding behavior requires monetary fixture tests before release. UOM values must be existing ERPNext UOM links.

No external OpenProject/OpenConstructionERP identity tables exist yet. Before enabling either service, add unique (tenant,system,external_id) and (tenant,doctype,document) mappings plus revision/version snapshots. Do not map records by user-visible project title.
