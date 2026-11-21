"""Composition root: explicit domain registration; no runtime discovery."""
from vorq.modules.masters import contracts as masters
from vorq.modules.planning import contracts as planning
from vorq.modules.site_operations import contracts as site_operations
from vorq.modules.procurement import contracts as procurement
from vorq.modules.inventory import contracts as inventory
from vorq.modules.contracts import contracts as contracts
from vorq.modules.finance import contracts as finance

DOMAINS = (masters, planning, site_operations, procurement, inventory, contracts, finance,)
CATALOG = {}
READ_FIELDS = {}
FINANCIAL = set()
OWNERS = {}
for domain in DOMAINS:
    for key, contract in domain.CATALOG.items():
        if key in CATALOG:
            raise RuntimeError(f"Duplicate record contract: {key}")
        CATALOG[key] = contract
        OWNERS[key] = domain.__name__.split(".")[-2]
    READ_FIELDS.update(domain.READ_FIELDS)
    FINANCIAL.update(domain.FINANCIAL)
