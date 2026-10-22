# Security changes

This batch is based on commit 847d8bd2a59121b7db8ae201bdc140071d294796 on melhorias-ditoo. It does not include the uncommitted changes in the original local working directory. Do not discard that working directory when checking out this branch.

- User creation requires an authenticated administrator. Existing accounts remain unchanged.
- On an empty database only, set DITOO_BOOTSTRAP_TOKEN in the server environment and send the same value in the X-Bootstrap-Token header to POST /register. The initial account is always an administrator. Remove the bootstrap variable afterwards. The browser form does not send this header.
- User listings, the shared mailbox and model switching require an administrator. Model switching accepts only names already installed in Ollama and preserves the current selection when loading fails.
- Conversation history is restricted to its owner, including administrators.
- Public folders grant reading only. Uploads and folder creation require ownership, administrator status or an explicit write grant. Grant write permission before using an ordinary account to upload.
- Uploads accept PDF/TXT/CSV/XLSX and default to 50 MiB. DITOO_MAX_UPLOAD_BYTES configures the byte limit. Empty files, unsafe filenames and replacement of existing files are rejected. Complete files are published using a hard link on the same filesystem; NTFS supports this. Other filesystems may need an equivalent atomic publication implementation.
- Folder operations validate resolved paths against the document root. Removing the document root is prohibited.
- Authentication, chat content, model prompts and memory content are excluded from engine debug logs. This does not erase existing log files or change third-party library logging.

## Validation

Run with the backend environment:

    python engine/tests/test_security_routes.py

Nine tests exercise the real route bodies with FastAPI TestClient and an isolated SQLite database: owner isolation, administrative registration, initial provisioning, role validation, administrative endpoints, model failures, write grants, folder paths, upload size and duplicate protection. They do not start Ollama, download embeddings or touch the production database/index.

## Remaining review items

This is the first security batch, not completion of the complete review. Process isolation for generated code, index replacement/deletion behavior, lifecycle/database configuration, RAG evidence/retrieval, settings persistence and the existing email build errors still need separate changes and validation. No email UI work is included here.

Initial provisioning is serialized inside one application process. Run a single worker during initial provisioning; multiple-worker coordination remains a deployment constraint.
