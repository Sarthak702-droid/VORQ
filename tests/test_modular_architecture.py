"""Enforce domain boundaries, stable HTTP contracts and lifecycle protections."""
import ast
import importlib
import importlib.util
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / 'integration-workspace/apps/vorq'
PACKAGE = BACKEND / 'vorq'


class ArchitectureTests(unittest.TestCase):
    def test_domains_do_not_depend_on_transport_or_application_or_other_domains(self):
        for path in (PACKAGE / 'modules').rglob('*.py'):
            own = path.relative_to(PACKAGE / 'modules').parts[0]
            for node in ast.walk(ast.parse(path.read_text())):
                imports = [node.module] if isinstance(node, ast.ImportFrom) else [a.name for a in node.names] if isinstance(node, ast.Import) else []
                for name in imports:
                    if not name:
                        continue
                    self.assertFalse(name.startswith(('vorq.api', 'vorq.application', 'vorq.module_registry')), str(path))
                    if name.startswith('vorq.modules.'):
                        self.assertEqual(name.split('.')[2], own, str(path))

    def test_all_endpoints_preserve_signatures_and_http_restrictions(self):
        def contract(path):
            return {n.name: (ast.dump(n.args), [ast.dump(d) for d in n.decorator_list])
                    for n in ast.parse(path.read_text()).body
                    if isinstance(n, ast.FunctionDef) and not n.name.startswith('_')}
        # The pre-refactor source is retained by the existing auth patch workflow.
        self.assertEqual(contract(PACKAGE / 'api/v1.py.orig'), contract(PACKAGE / 'api/v1.py'))

    def test_application_services_cannot_be_called_as_frappe_http_handlers(self):
        for directory in ('application', 'modules', 'shared'):
            for path in (PACKAGE / directory).rglob('*.py'):
                self.assertNotIn('@frappe.whitelist', path.read_text(), str(path))

    def test_every_record_has_one_owner_and_financial_policy_is_preserved(self):
        with patch.object(sys, 'path', [str(BACKEND), *sys.path]):
            registry = importlib.import_module('vorq.module_registry')
        self.assertEqual(len(registry.CATALOG), 22)
        self.assertEqual(set(registry.OWNERS), set(registry.CATALOG))
        self.assertEqual(registry.FINANCIAL, {'sales-invoices', 'purchase-invoices', 'payments', 'expenses'})
        for key in registry.FINANCIAL:
            self.assertEqual(registry.OWNERS[key], 'finance')
            self.assertEqual(registry.CATALOG[key][2], ['Owner', 'Accountant'])
        self.assertEqual(registry.OWNERS['measurements'], 'contracts')
        self.assertEqual(registry.OWNERS['boqs'], 'planning')


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.frappe = types.ModuleType('frappe')
        self.frappe.ValidationError = ValueError
        self.frappe.PermissionError = PermissionError
        def throw(message, error):
            raise error(message)
        self.frappe.throw = throw
        self.patcher = patch.dict(sys.modules, {'frappe': self.frappe})
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop()

    def load(self, relative):
        spec = importlib.util.spec_from_file_location('isolated', PACKAGE / relative)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def test_approved_boq_and_certified_measurements_remain_immutable(self):
        planning = self.load('modules/planning/workflow.py')
        contracts = self.load('modules/contracts/workflow.py')
        for status in ('Submitted', 'Approved'):
            with self.assertRaises(ValueError):
                planning.editable(types.SimpleNamespace(status=status))
        with self.assertRaises(ValueError):
            contracts.editable(types.SimpleNamespace(status='Certified'))
        planning.editable(types.SimpleNamespace(status='Draft'))
        contracts.editable(types.SimpleNamespace(status='Draft'))

    def test_unauthorized_approval_never_calls_upstream(self):
        planning = self.load('modules/planning/workflow.py')
        contracts = self.load('modules/contracts/workflow.py')
        doc = types.SimpleNamespace(status='Draft', name='test')
        for role in ('Site Engineer', 'Accountant', 'Subcontractor'):
            self.assertEqual(planning.actions(doc, role), [])
            self.assertEqual(contracts.actions(doc, role), [])
            with self.assertRaises(PermissionError):
                planning.transition(doc, 'Approve baseline', role)
            with self.assertRaises(PermissionError):
                contracts.certify(doc, role)

    def test_boq_and_measurement_commands_delegate_once_to_upstream(self):
        planning = self.load('modules/planning/workflow.py')
        contracts = self.load('modules/contracts/workflow.py')
        boq = types.ModuleType('buildsuite_core.api.boq')
        boq.approve_boq, boq.submit_boq = Mock(), Mock()
        subcontract = types.ModuleType('buildsuite_core.api.subcontract')
        subcontract.certify_measurement_book = Mock()
        with patch.dict(sys.modules, {'buildsuite_core.api.boq': boq, 'buildsuite_core.api.subcontract': subcontract}):
            doc = types.SimpleNamespace(name='record-1')
            planning.transition(doc, 'Submit', 'Quantity Surveyor')
            planning.transition(doc, 'Approve baseline', 'Owner')
            contracts.certify(doc, 'Quantity Surveyor')
        boq.submit_boq.assert_called_once_with('record-1')
        boq.approve_boq.assert_called_once_with('record-1')
        subcontract.certify_measurement_book.assert_called_once_with('record-1')

    def test_http_facade_forwards_write_arguments_without_changes(self):
        self.frappe.whitelist = lambda **kwargs: lambda fn: fn
        facade = self.load('api/v1.py')
        service = types.ModuleType('vorq.application.records')
        service.save = Mock(return_value={'name': 'saved'})
        args = dict(module='payments', company='company', project='project', values={'paid_amount': '12.50'}, idempotency_key='stable-request-key', name='entry', modified='version')
        with patch.dict(sys.modules, {'vorq.application.records': service}):
            self.assertEqual(facade.save(**args), {'name': 'saved'})
        service.save.assert_called_once_with(**args)


if __name__ == '__main__':
    unittest.main()
