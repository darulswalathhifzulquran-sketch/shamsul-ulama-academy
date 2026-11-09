# Gallery Upload Compatibility — staging plan

**Existing feature contract:** gallery supports JPEG/PNG/WebP/MP4/WebM direct uploads up to 16 MiB, optional image optimisation, and HTTPS media links.

**Free host issue:** Netlify's function request cap is ~4.5 MiB for binary payloads. Uploading a 16 MiB file in one request cannot work there.

**Staging workaround implemented in source:** 2 MiB authenticated, CSRF-checked chunks saved into a dedicated temporary Netlify Blobs store. After all chunks are uploaded, the final operation reassembles them and invokes the ORIGINAL Gallery handler, retaining all role checks, file signature validation, database insert, audit, and publish/draft state. The browser still shows one upload flow.

**NOT YET VERIFIED:** actual hosted uploads of 5 MiB, 10 MiB and 16 MiB, performance and free credit consumption, cancel/expiry cleanup, video streaming, and mobile Safari. Do not call this fixed until these pass. Never test with production user media.

Storage temp chunks may remain after interrupted uploads; add automated expiry cleanup and verify limits before releasing for production.
