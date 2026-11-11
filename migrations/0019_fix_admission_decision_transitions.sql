-- Repair admission state transitions without deleting any records.
CREATE OR REPLACE FUNCTION academy_decide_admission(
 p_application_id BIGINT,
 p_next_status TEXT,
 p_reason TEXT,
 p_staff_note TEXT,
 p_interview_at TIMESTAMPTZ,
 p_actor_id BIGINT,
 p_password_salt TEXT,
 p_password_hash TEXT,
 p_password_iterations INTEGER
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
 a academy_admission_applications%ROWTYPE;
 assigned_student_id BIGINT;
 assigned_account_id BIGINT;
 generated_number TEXT;
 generated_username TEXT;
 created_account BOOLEAN := false;
BEGIN
 SELECT * INTO a FROM academy_admission_applications
 WHERE id=p_application_id FOR UPDATE;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'Application not found' USING ERRCODE='P0002';
 END IF;

 IF p_next_status NOT IN ('submitted','under_review','interview','approved','rejected') THEN
  RAISE EXCEPTION 'Invalid application status' USING ERRCODE='P0001';
 END IF;

 IF p_next_status<>a.status AND NOT (
   (a.status='submitted' AND p_next_status IN ('under_review','interview','approved','rejected'))
   OR (a.status='under_review' AND p_next_status IN ('interview','approved','rejected'))
   OR (a.status='interview' AND p_next_status IN ('under_review','approved','rejected'))
   OR (a.status='rejected' AND p_next_status IN ('under_review','approved'))
   OR (a.status='approved' AND a.student_id IS NULL AND p_next_status IN ('under_review','rejected'))
 ) THEN
  RAISE EXCEPTION 'Status transition not permitted' USING ERRCODE='P0001';
 END IF;

 generated_number:='HIFZ-'||a.application_year::TEXT||'-'||lpad(a.id::TEXT,3,'0');
 generated_username:=lower(generated_number);
 assigned_student_id:=a.student_id;

 -- Idempotent: pressing Approve again does not create a second account.
 IF p_next_status='approved' AND assigned_student_id IS NULL THEN
  IF p_password_salt IS NULL OR p_password_hash IS NULL
   OR p_password_iterations NOT BETWEEN 210000 AND 1000000 THEN
    RAISE EXCEPTION 'Credentials must be generated before approval' USING ERRCODE='P0001';
  END IF;
  IF EXISTS (SELECT 1 FROM academy_students WHERE admission_number=generated_number)
    OR EXISTS (SELECT 1 FROM academy_accounts_v2 WHERE username=generated_username) THEN
    RAISE EXCEPTION 'Generated admission number or student username already exists' USING ERRCODE='23505';
  END IF;

  INSERT INTO academy_students (
   admission_number,full_name,batch_name,contact_phone,guardian_name,
   guardian_phone,date_of_birth,postal_address,notes,status
  ) VALUES (
   generated_number,a.student_name,NULL,NULL,a.guardian_name,
   a.guardian_phone,a.date_of_birth,a.address,a.notes,'active'
  ) RETURNING id INTO assigned_student_id;

  INSERT INTO academy_accounts_v2 (
   username,display_name,role,password_salt,password_hash,password_iterations,
   created_by,must_change_password,active
  ) VALUES (
   generated_username,a.student_name,'student',p_password_salt,p_password_hash,
   p_password_iterations,p_actor_id,true,true
  ) RETURNING id INTO assigned_account_id;

  INSERT INTO academy_links_v2 (account_id,student_id,relationship)
   VALUES (assigned_account_id,assigned_student_id,'student');
  created_account:=true;
 END IF;

 IF p_next_status=a.status AND NOT created_account
   AND nullif(btrim(coalesce(p_reason,'')),'') IS NULL
   AND nullif(btrim(coalesce(p_staff_note,'')),'') IS NULL
   AND p_interview_at IS NULL THEN
  -- Return successful idempotent outcome for approved records.
  IF p_next_status='approved' AND assigned_student_id IS NOT NULL THEN
   RETURN jsonb_build_object('id',a.id,'status','approved',
      'student_id',assigned_student_id,'admission_number',generated_number,
      'username',generated_username,'account_created',false,'already_approved',true);
  END IF;
  IF p_next_status='rejected' THEN
   RETURN jsonb_build_object('id',a.id,'status','rejected','student_id',a.student_id,'account_created',false,'already_rejected',true);
  END IF;
  RAISE EXCEPTION 'No change to save' USING ERRCODE='P0001';
 END IF;

 UPDATE academy_admission_applications SET
  status=p_next_status,
  student_id=COALESCE(assigned_student_id,student_id),
  interview_at=CASE WHEN p_next_status='interview' THEN p_interview_at ELSE NULL END,
  decision_reason=CASE WHEN p_next_status='rejected' THEN nullif(btrim(p_reason),'') ELSE NULL END,
  staff_note=COALESCE(nullif(btrim(p_staff_note),''),staff_note),
  reviewed_by=p_actor_id, reviewed_at=now(), updated_at=now()
 WHERE id=a.id;

 INSERT INTO academy_application_events (application_id,from_status,to_status,note,actor_account_id)
 VALUES (a.id,a.status,p_next_status,
  CASE WHEN p_next_status='rejected' THEN nullif(btrim(p_reason),'')
   ELSE COALESCE(nullif(btrim(p_staff_note),''),nullif(btrim(p_reason),'')) END,
  p_actor_id);

 RETURN jsonb_build_object('id',a.id,'status',p_next_status,
  'student_id',assigned_student_id,
  'admission_number',CASE WHEN assigned_student_id IS NOT NULL THEN generated_number ELSE NULL END,
  'username',CASE WHEN assigned_student_id IS NOT NULL THEN generated_username ELSE NULL END,
  'account_created',created_account,
  'already_approved',false);
END $$;