# Test Credentials — CampusConnect

## Accounts (email / password / role)
- Admin: admin@campus.edu / admin123 (admin)
- Enseignant: prof@campus.edu / prof123 (teacher) — Prof. Martin Leroy
- Étudiant: etudiant@campus.edu / etudiant123 (student) — Sophie Dubois (has seeded grades, fees, notifications)

## Auth endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me  (Bearer token in Authorization header)

## Notes
- JWT token returned in login/register response body; frontend stores it in localStorage and sends as `Authorization: Bearer <token>`.
- Stripe uses test key (sk_test_emergent). Use Stripe test card 4242 4242 4242 4242 for payments.
