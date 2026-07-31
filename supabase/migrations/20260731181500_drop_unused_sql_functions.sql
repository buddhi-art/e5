-- Drop unused frontend-facing KPI functions
DROP FUNCTION IF EXISTS public.recompute_all_kpis();
DROP FUNCTION IF EXISTS public.calculate_employee_kpi(uuid, integer);

-- Drop unused CI testing functions
DROP FUNCTION IF EXISTS public.test_generate_batch_invoice_numbers(text, integer);
DROP FUNCTION IF EXISTS public.test_seed_equipment(text, text);
DROP FUNCTION IF EXISTS public.test_cleanup_equipment(uuid);
DROP FUNCTION IF EXISTS public.test_create_employee_profile(text, text, text);
