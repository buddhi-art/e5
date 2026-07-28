-- The first cleanup migration may already have been applied before legacy
-- tasks were linked to package_item_id. Repeat the cleanup against both
-- package linkage columns, using the exact old generator descriptions/status.

BEGIN;

DELETE FROM tasks AS task
USING projects AS project
WHERE task.project_id = project.id
  AND (project.package_item_id IS NOT NULL OR project.package_id IS NOT NULL)
  AND task.status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM (VALUES
      ('Phase 1'::production_phase, 'Concept & Scripting (%)', 'Initial planning, storyboarding, scriptwriting, and concept approval'),
      ('Phase 2'::production_phase, 'Videography & On-Site Shoot (%)', 'On-site camera shoot, lighting, asset capture, and audio recording'),
      ('Phase 3'::production_phase, 'Editing & Graphic Design (%)', 'Video editing, color grading, audio sync, graphic assets, and motion design'),
      ('Phase 4'::production_phase, 'QA Review & Founder Feedback (%)', 'Internal quality review, founder feedback, and revision round'),
      ('Phase 5'::production_phase, 'Final Export & Client Delivery (%)', 'Exporting final 4K/HD video or design files and submitting Drive link')
    ) AS generated(phase, title_pattern, description)
    WHERE task.phase = generated.phase
      AND task.title LIKE generated.title_pattern
      AND task.description = generated.description
  );

COMMIT;