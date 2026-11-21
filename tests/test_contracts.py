"""Fast contract checks; real DB acceptance is vorq.smoke.run."""
import ast
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

class ContractTests(unittest.TestCase):
    def test_all_public_handlers_are_method_restricted(self):
        tree = ast.parse((ROOT / 'apps/vorq/vorq/api/v1.py').read_text())
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and not node.name.startswith('_'):
                decorators = [d for d in node.decorator_list if isinstance(d, ast.Call)]
                self.assertTrue(decorators, node.name)
                self.assertTrue(any(k.arg == 'methods' for d in decorators for k in d.keywords), node.name)

    def test_main_entry_does_not_load_demo_context(self):
        app = (ROOT / 'src/App.tsx').read_text()
        self.assertNotIn('AppProvider', app)
        for path in (ROOT / 'src/erp').rglob('*.ts*'):
            self.assertNotIn('mockDatabase', path.read_text())

    def test_no_browser_credentials_or_financial_posting_logic(self):
        code = '\n'.join(p.read_text() for p in (ROOT / 'src/erp').rglob('*.ts*'))
        self.assertNotIn('api_secret', code)
        self.assertNotIn('localStorage', code)
        self.assertNotIn('setClientInvoices', code)

if __name__ == '__main__':
    unittest.main()
