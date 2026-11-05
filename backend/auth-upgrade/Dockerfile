FROM frappe/erpnext:v16.53.0@sha256:6a70fca65ce0e6aa98c3f1a047618ae5275c44a9cb28e6f78b26dfe0e3e51314
COPY --chown=frappe:frappe vendor/buildsuite_core /home/frappe/frappe-bench/apps/buildsuite_core
COPY --chown=frappe:frappe apps/vorq /home/frappe/frappe-bench/apps/vorq
RUN /home/frappe/frappe-bench/env/bin/pip install --no-deps -e apps/buildsuite_core -e apps/vorq
RUN /home/frappe/frappe-bench/env/bin/python -c "from vorq.api import v1; import vorq.auth_flow; assert all(callable(getattr(v1, name, None)) for name in ('auth_challenge', 'auth_start', 'auth_signup', 'auth_finish')), 'VORQ auth API missing from image'"
