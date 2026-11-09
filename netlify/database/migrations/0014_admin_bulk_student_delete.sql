-- Safe all-student cleanup, called only by the authenticated main Admin endpoint.
-- Existing data is NOT touched by this migration; this only defines a function.
CREATE OR REPLACE FUNCTION academy_admin_delete_all_students(
 p_actor_account_id BIGINT,
 p_expected_count BIGINT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
 actual_count BIGINT;
 removed_students BIGINT;
 removed_accounts BIGINT;
 student_account_ids BIGINT[];
BEGIN
 IF p_actor_account_id IS NULL OR p_expected_count IS NULL OR p_expected_count <= 0 THEN
  RAISE EXCEPTION 'Explicit positive student count and actor required' USING ERRCODE='P0001';
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM academy_accounts_v2 WHERE id=p_actor_account_id AND role='admin' AND active=true
 ) THEN
  RAISE EXCEPTION 'Main Administrator authorization required' USING ERRCODE='42501';
 END IF;
 -- Prevent simultaneous student INSERT/DELETE during the count check and bulk delete.
 LOCK TABLE academy_students IN SHARE ROW EXCLUSIVE MODE;
 SELECT count(*) INTO actual_count FROM academy_students;
 IF actual_count<>p_expected_count THEN
  RAISE EXCEPTION 'Student count changed. Refresh and confirm again.' USING ERRCODE='P0001';
 END IF;
 SELECT COALESCE(array_agg(id),ARRAY[]::BIGINT[])
 INTO student_account_ids
 FROM academy_accounts_v2 WHERE role='student';

 -- Preserve teacher/admin accounts created by old student accounts.
 UPDATE academy_accounts_v2 SET created_by=NULL
 WHERE created_by=ANY(student_account_ids);
 UPDATE academy_student_targets SET updated_by=NULL
 WHERE updated_by=ANY(student_account_ids);

 -- Foreign keys cascade to Hifz monthly reports, Juz, targets and access links.
 -- Admission applications retain application history (student_id SET NULL).
 DELETE FROM academy_students;
 GET DIAGNOSTICS removed_students=ROW_COUNT;

 IF removed_students<>p_expected_count THEN
  RAISE EXCEPTION 'Unexpected student count: deletion rolled back.' USING ERRCODE='P0001';
 END IF;

 DELETE FROM academy_accounts_v2 a
 WHERE a.role='student' AND a.id=ANY(student_account_ids)
 AND NOT EXISTS (SELECT 1 FROM academy_links_v2 l WHERE l.account_id=a.id);
 GET DIAGNOSTICS removed_accounts=ROW_COUNT;

 IF EXISTS(SELECT 1 FROM academy_students) THEN
  RAISE EXCEPTION 'Students still exist: deletion rolled back.' USING ERRCODE='P0001';
 END IF;
 IF EXISTS(SELECT 1 FROM academy_accounts_v2 WHERE role='student' AND id=ANY(student_account_ids)) THEN
  RAISE EXCEPTION 'Student login still exists: deletion rolled back.' USING ERRCODE='P0001';
 END IF;

 INSERT INTO academy_audit_v2(actor_account_id,action,target_kind,target_id)
 VALUES(p_actor_account_id,'students.bulk_delete','student',removed_students::TEXT);

 RETURN jsonb_build_object(
   'ok',true,'verified',true,'removed_students',removed_students,
   'removed_student_accounts',removed_accounts,
   'remaining_students',0
 );
END $$;