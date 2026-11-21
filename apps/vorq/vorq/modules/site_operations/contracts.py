"""Owned record contracts. Upstream DocTypes remain authoritative."""

CATALOG = {'site-reports': ('VORQ Site Report',
                  ['report_date', 'weather', 'progress_notes', 'blockers'],
                  ['Owner', 'Project Manager', 'Site Engineer']),
 'labour': ('Labour Attendance Register',
            ['employee', 'attendance_date', 'status', 'wage_rate', 'task', 'comments'],
            ['Owner', 'Project Manager', 'Site Engineer'])}

READ_FIELDS = {'labour': ['daily_wage_calculated']}

FINANCIAL = set()
