-- Enforce single primary image per service (is_primary = true)
CREATE UNIQUE INDEX IF NOT EXISTS "service_images_one_primary"
ON "service_images" ("service_id")
WHERE "is_primary" = true;

-- Enforce single primary image per vendor service (is_primary = true)
CREATE UNIQUE INDEX IF NOT EXISTS "vendor_service_images_one_primary"
ON "vendor_service_images" ("vendor_service_id")
WHERE "is_primary" = true;